import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { nearbyEventsMock, type NearbyEvent } from "@/lib/events/mock-events";
import { useOnboardingDraft } from "@/lib/onboarding/onboarding-draft";

const isIOS = Platform.OS === "ios";

const colors = {
  ink: "#041820",
  mint: "#00C691",
  mintDeep: "#008564",
  paper: "#FAFFFC",
  mapBase: "#E7F1EC",
  mapBlock: "rgba(4, 24, 32, 0.05)",
  road: "rgba(4, 24, 32, 0.07)",
  water: "rgba(0, 150, 199, 0.14)",
  park: "rgba(0, 198, 145, 0.16)",
  muted: "rgba(4, 24, 32, 0.58)",
};

// Cinematic timeline (ms).
const ZOOM_DURATION = 2600;
// Pins begin dropping in the last ~40% of the camera flight (the "settle"), so
// the map reads as coming alive rather than popping all at once.
const PINS_START = Math.round(ZOOM_DURATION * 0.6);
const PIN_STAGGER = 110;
const FOUND_AT = 3500;
const NAVIGATE_AT = 4600;

// Hand-tuned scatter positions (px from center) for up to 6 pins, spread across
// distinct quadrants and radii so no two land in the same spot.
const PIN_LAYOUT = [
  { x: -104, y: -86 },
  { x: 96, y: -52 },
  { x: -38, y: 70 },
  { x: 128, y: 92 },
  { x: -134, y: 40 },
  { x: 30, y: -150 },
];

function MapBackdrop() {
  const scale = useSharedValue(1.05);
  const translateY = useSharedValue(0);
  // pitch -> rotateX (3D tilt), bearing -> rotateZ (heading rotation). Together
  // with perspective they give the raised, rotating "camera" feel; a flat
  // top-down zoom alone reads as static.
  const pitch = useSharedValue(0);
  const bearing = useSharedValue(0);

  useEffect(() => {
    // Non-linear throughout: cubic ease-in-out on the flight, a gentle ease-out
    // for the post-arrival drift (never a linear ramp).
    const flight = { duration: ZOOM_DURATION, easing: Easing.inOut(Easing.cubic) };
    const drift = { duration: 2200, easing: Easing.out(Easing.cubic) };

    // Cinematic fly-to: zoom in while raising the pitch and slowly rotating the
    // bearing, then keep drifting subtly so it never feels frozen.
    scale.value = withSequence(withTiming(1.5, flight), withTiming(1.62, drift));
    translateY.value = withSequence(withTiming(-30, flight), withTiming(-44, drift));
    pitch.value = withSequence(withTiming(52, flight), withTiming(56, drift));
    bearing.value = withSequence(withTiming(20, flight), withTiming(26, drift));
  }, [scale, translateY, pitch, bearing]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${pitch.value}deg` },
      { rotateZ: `${bearing.value}deg` },
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[styles.map, style]}>
      <View style={styles.mapFill} />

      {/* Parks / water blobs for depth */}
      <View style={[styles.blob, styles.park1]} />
      <View style={[styles.blob, styles.park2]} />
      <View style={[styles.blob, styles.water1]} />

      {/* City blocks */}
      <View style={[styles.block, { top: "18%", left: "12%" }]} />
      <View style={[styles.block, { top: "26%", left: "58%", width: 120 }]} />
      <View style={[styles.block, { top: "54%", left: "20%", width: 90 }]} />
      <View style={[styles.block, { top: "62%", left: "62%" }]} />
      <View style={[styles.block, { top: "40%", left: "40%", width: 70, height: 70 }]} />

      {/* Roads */}
      <View style={[styles.roadH, { top: "30%" }]} />
      <View style={[styles.roadH, { top: "58%" }]} />
      <View style={[styles.roadV, { left: "34%" }]} />
      <View style={[styles.roadV, { left: "68%" }]} />
      <View style={styles.roadDiagonal} />
    </Animated.View>
  );
}

function CenterPulse() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulse.value),
    transform: [{ scale: 0.5 + pulse.value * 1.8 }],
  }));

  return (
    <View style={styles.centerWrap} pointerEvents="none">
      <Animated.View style={[styles.pulseRing, ringStyle]} />
      <View style={styles.centerDotOuter}>
        <View style={styles.centerDot} />
      </View>
    </View>
  );
}

function EventPin({ event, index }: { event: NearbyEvent; index: number }) {
  const pos = PIN_LAYOUT[index % PIN_LAYOUT.length];

  // Drive scale + opacity manually (instead of an `entering` preset) so the
  // positioning transform is preserved: the pin scales/fades in place at its
  // own spot. easeOutBack gives the overshoot/bounce.
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * PIN_STAGGER;
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    scale.value = withDelay(
      delay,
      withTiming(1, { duration: 480, easing: Easing.out(Easing.back(1.9)) }),
    );

    // Subtle haptic tap synced to each pin landing (mobile only).
    let hapticTimer: ReturnType<typeof setTimeout> | undefined;
    if (Platform.OS !== "web") {
      hapticTimer = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }, delay);
    }
    return () => {
      if (hapticTimer) clearTimeout(hapticTimer);
    };
  }, [index, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: pos.x },
      { translateY: pos.y },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.pin, style]}>
      <View style={styles.pinBubble}>
        <Text style={styles.pinEmoji}>{event.emoji}</Text>
      </View>
      <View style={styles.pinTail} />
    </Animated.View>
  );
}

export default function DiscoveringScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { location, interests } = useOnboardingDraft();

  const [showPins, setShowPins] = useState(false);
  const [phase, setPhase] = useState<"scan" | "found">("scan");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const events = useMemo(
    () => nearbyEventsMock(location, interests),
    [location, interests],
  );
  const placeLabel = location?.label ?? location?.city ?? "Twojej okolicy";

  // Missing draft data => the final submit would fail; bounce back.
  useEffect(() => {
    if (!location || interests.length === 0) {
      router.replace("/onboarding/location");
    }
  }, [location, interests.length, router]);

  useEffect(() => {
    timers.current = [
      setTimeout(() => setShowPins(true), PINS_START),
      setTimeout(() => setPhase("found"), FOUND_AT),
      setTimeout(() => router.replace("/onboarding/aha"), NAVIGATE_AT),
    ];
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, [router]);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <MapBackdrop />

      {/* Pins + center pulse live on a non-scaling overlay so they stay crisp. */}
      <View style={styles.overlay} pointerEvents="none">
        <CenterPulse />
        {showPins
          ? events.map((event, index) => (
              <EventPin key={event.id} event={event} index={index} />
            ))
          : null}
      </View>

      <LinearGradient
        colors={["rgba(231,241,236,0.9)", "rgba(231,241,236,0)"]}
        style={styles.topScrim}
        pointerEvents="none"
      />

      <View style={[styles.caption, { top: insets.top + 24 }]}>
        {phase === "scan" ? (
          <Animated.Text
            key="scan"
            entering={FadeIn.duration(400)}
            style={styles.captionText}
          >
            Rozglądamy się w {placeLabel}…
          </Animated.Text>
        ) : (
          <Animated.View key="found" entering={FadeInDown.springify().damping(14)}>
            <Text style={styles.foundCount}>{events.length} wydarzeń</Text>
            <Text style={styles.foundSub}>czeka tuż obok Ciebie</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.mapBase,
    flex: 1,
    overflow: "hidden",
  },
  map: {
    // Overflow beyond the screen so the 3D tilt/rotation never reveals empty
    // edges (any sliver blends into the screen's mapBase background).
    bottom: -160,
    left: -120,
    position: "absolute",
    right: -120,
    top: -160,
  },
  mapFill: {
    backgroundColor: colors.mapBase,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  blob: {
    borderRadius: 999,
    position: "absolute",
  },
  park1: {
    backgroundColor: colors.park,
    height: 220,
    left: -40,
    top: "8%",
    width: 220,
  },
  park2: {
    backgroundColor: colors.park,
    bottom: "10%",
    height: 180,
    right: -30,
    width: 180,
  },
  water1: {
    backgroundColor: colors.water,
    borderRadius: 140,
    height: 260,
    left: "45%",
    top: "55%",
    width: 320,
  },
  block: {
    backgroundColor: colors.mapBlock,
    borderRadius: 10,
    height: 56,
    position: "absolute",
    width: 96,
  },
  roadH: {
    backgroundColor: colors.road,
    height: 14,
    left: 0,
    position: "absolute",
    right: 0,
  },
  roadV: {
    backgroundColor: colors.road,
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 14,
  },
  roadDiagonal: {
    backgroundColor: colors.road,
    height: 12,
    left: "-10%",
    position: "absolute",
    top: "46%",
    transform: [{ rotate: "32deg" }],
    width: "120%",
  },
  overlay: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  centerWrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  pulseRing: {
    backgroundColor: colors.mint,
    borderRadius: 999,
    height: 120,
    position: "absolute",
    width: 120,
  },
  centerDotOuter: {
    alignItems: "center",
    backgroundColor: "rgba(0, 198, 145, 0.25)",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  centerDot: {
    backgroundColor: colors.mintDeep,
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    height: 16,
    width: 16,
  },
  pin: {
    alignItems: "center",
    position: "absolute",
  },
  pinBubble: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: colors.mint,
    borderRadius: 999,
    borderWidth: 2,
    height: 48,
    justifyContent: "center",
    width: 48,
    shadowColor: colors.ink,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    ...(isIOS ? null : { elevation: 6 }),
  },
  pinEmoji: {
    fontSize: 22,
  },
  pinTail: {
    backgroundColor: "#FFFFFF",
    height: 12,
    marginTop: -6,
    transform: [{ rotate: "45deg" }],
    width: 12,
    ...(isIOS ? null : { elevation: 6 }),
  },
  topScrim: {
    height: 200,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  caption: {
    alignItems: "center",
    left: 0,
    paddingHorizontal: 28,
    position: "absolute",
    right: 0,
  },
  captionText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  foundCount: {
    color: colors.ink,
    fontFamily: isIOS ? "Georgia" : "serif",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  foundSub: {
    color: colors.muted,
    fontSize: 16,
    marginTop: 2,
    textAlign: "center",
  },
});
