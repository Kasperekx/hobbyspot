import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthError } from "@/lib/auth/api";
import { useAuth } from "@/lib/auth/auth-context";
import { nearbyEventsMock, type NearbyEvent } from "@/lib/events/mock-events";
import { useOnboardingDraft } from "@/lib/onboarding/onboarding-draft";

const isIOS = Platform.OS === "ios";

const colors = {
  ink: "#041820",
  mint: "#00C691",
  mintDeep: "#008564",
  paper: "#FAFFFC",
  muted: "rgba(4, 24, 32, 0.58)",
  faint: "rgba(4, 24, 32, 0.4)",
  danger: "#D7263D",
  field: "rgba(4, 24, 32, 0.05)",
  fieldBorder: "rgba(4, 24, 32, 0.1)",
  mintWash: "rgba(0, 198, 145, 0.12)",
};

const COUNT_UP_STEPS = 26;
const COUNT_UP_INTERVAL_MS = 26;

/** Animates a number from 0 to `target` with an ease-out curve. */
function useCountUp(target: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    let frame = 0;
    const id = setInterval(() => {
      frame += 1;
      const t = frame / COUNT_UP_STEPS;
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (frame >= COUNT_UP_STEPS) {
        setValue(target);
        clearInterval(id);
      }
    }, COUNT_UP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [target]);

  return value;
}

function MetaIcon({
  name,
  glyph,
}: {
  name: SymbolViewProps["name"];
  glyph: string;
}) {
  if (isIOS) {
    return (
      <SymbolView
        name={name}
        tintColor={colors.muted}
        size={13}
        resizeMode="scaleAspectFit"
        style={{ height: 13, width: 13 }}
      />
    );
  }
  return <Text style={{ color: colors.muted, fontSize: 12 }}>{glyph}</Text>;
}

function EventCard({ event, index }: { event: NearbyEvent; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(420 + index * 90)
        .duration(520)
        .springify()
        .damping(16)}
      style={styles.card}
    >
      <View style={styles.cardIcon}>
        <Text style={styles.cardEmoji}>{event.emoji}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.categoryChip}>
          <Text style={styles.categoryChipText}>{event.category}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MetaIcon name="clock" glyph="🕒" />
            <Text style={styles.metaText}>{event.whenLabel}</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <MetaIcon name="location" glyph="📍" />
            <Text style={styles.metaText}>{event.distanceKm} km</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <MetaIcon name="person.2.fill" glyph="👥" />
            <Text style={styles.metaText}>{event.attendees}</Text>
          </View>
        </View>
        <Text style={styles.cardVenue} numberOfLines={1}>
          {event.venue}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function AhaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveOnboarding } = useAuth();
  const { profile, location, interests } = useOnboardingDraft();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // The Aha moment needs location + interests; without them the final submit
  // would fail validation. Send the user back if they reached this directly.
  useEffect(() => {
    if (!location || interests.length === 0) {
      router.replace("/onboarding/location");
    }
  }, [location, interests.length, router]);

  const events = useMemo(
    () => nearbyEventsMock(location, interests),
    [location, interests],
  );
  const displayCount = useCountUp(events.length);

  const placeLabel = location?.label ?? location?.city ?? "Twojej okolicy";
  const footerPad = Math.max(insets.bottom, 16);

  const onStart = async () => {
    if (!location || interests.length === 0 || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Single final onboarding submit with everything + completed: true.
      // On success the navigation guard routes to /home.
      await saveOnboarding({ profile, location, interests, completed: true });
    } catch (error) {
      if (error instanceof AuthError && error.fieldErrors) {
        setSubmitError("Nie udało się dokończyć rejestracji. Sprawdź dane.");
      } else if (error instanceof AuthError) {
        setSubmitError(error.detail ?? error.message);
      } else {
        setSubmitError("Brak połączenia z serwerem. Spróbuj ponownie.");
      }
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 28,
            paddingBottom: footerPad + 96,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Animated.View
            entering={ZoomIn.duration(560).springify().damping(11)}
          >
            <LinearGradient
              colors={[colors.mint, colors.mintDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badge}
            >
              <Text style={styles.badgeNumber}>{displayCount}</Text>
              {isIOS ? (
                <SymbolView
                  name="sparkles"
                  tintColor="#FFFFFF"
                  size={26}
                  resizeMode="scaleAspectFit"
                  style={styles.badgeSpark}
                />
              ) : (
                <Text style={styles.badgeSparkGlyph}>✨</Text>
              )}
            </LinearGradient>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(180).duration(500)}
            style={styles.eyebrow}
          >
            WSZYSTKO GOTOWE
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(260).duration(500)}
            style={styles.title}
          >
            Wydarzenia czekają w {placeLabel}
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(340).duration(500)}
            style={styles.subtitle}
          >
            Wybraliśmy je pod {interests.length}{" "}
            {interests.length === 1 ? "zainteresowanie" : "zainteresowania/-ń"},
            które Cię kręcą. Zobacz, co się dzieje obok.
          </Animated.Text>
        </View>

        <Animated.Text
          entering={FadeIn.delay(420).duration(400)}
          style={styles.sectionLabel}
        >
          W POBLIŻU CIEBIE
        </Animated.Text>

        <View style={styles.list}>
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(520).duration(500)}
        style={[styles.footer, { paddingBottom: footerPad }]}
      >
        <LinearGradient
          colors={["rgba(250,255,252,0)", colors.paper]}
          style={styles.footerFade}
          pointerEvents="none"
        />
        {submitError ? (
          <Text style={styles.submitError}>{submitError}</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pokaż mi wydarzenia"
          disabled={submitting}
          onPress={onStart}
          style={({ pressed }) => [
            styles.cta,
            submitting && styles.ctaDisabled,
            pressed && !submitting && styles.pressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text style={styles.ctaText}>Pokaż mi wydarzenia</Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
  },
  hero: {
    alignItems: "center",
  },
  badge: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 999,
    height: 140,
    justifyContent: "center",
    width: 140,
    shadowColor: colors.mint,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 26,
    ...(isIOS ? null : { elevation: 14 }),
  },
  badgeNumber: {
    color: "#FFFFFF",
    fontFamily: isIOS ? "Georgia" : "serif",
    fontSize: 58,
    fontWeight: "700",
    letterSpacing: -1,
  },
  badgeSpark: {
    height: 26,
    position: "absolute",
    right: 24,
    top: 26,
    width: 26,
  },
  badgeSparkGlyph: {
    fontSize: 22,
    position: "absolute",
    right: 24,
    top: 24,
  },
  eyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginTop: 28,
  },
  title: {
    color: colors.ink,
    fontFamily: isIOS ? "Georgia" : "serif",
    fontSize: 30,
    fontWeight: "400",
    letterSpacing: -0.6,
    marginTop: 10,
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  sectionLabel: {
    color: colors.faint,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 14,
    marginTop: 32,
  },
  list: {
    gap: 12,
  },
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: colors.fieldBorder,
    borderCurve: "continuous",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 14,
    padding: 14,
    shadowColor: "#041820",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    ...(isIOS ? null : { elevation: 2 }),
  },
  cardIcon: {
    alignItems: "center",
    backgroundColor: colors.mintWash,
    borderCurve: "continuous",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  cardEmoji: {
    fontSize: 26,
  },
  cardBody: {
    flex: 1,
    gap: 5,
  },
  categoryChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.mintWash,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  categoryChipText: {
    color: colors.mintDeep,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: isIOS ? -0.2 : 0,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  metaItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  metaText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  metaDot: {
    backgroundColor: colors.faint,
    borderRadius: 999,
    height: 3,
    width: 3,
  },
  cardVenue: {
    color: colors.faint,
    fontSize: 13,
  },
  footer: {
    backgroundColor: colors.paper,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 10,
    position: "absolute",
    right: 0,
  },
  footerFade: {
    height: 28,
    left: 0,
    position: "absolute",
    right: 0,
    top: -28,
  },
  submitError: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  cta: {
    alignItems: "center",
    backgroundColor: colors.mint,
    borderCurve: "continuous",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 56,
    shadowColor: colors.mint,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    ...(isIOS ? null : { elevation: 12 }),
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: isIOS ? -0.2 : 0,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
