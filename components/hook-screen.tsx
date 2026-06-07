import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const heroImage = require("@/assets/images/hook-background.png");
const logoImage = require("@/assets/images/hobbyspot-logo.png");

const isIOS = Platform.OS === "ios";

const colors = {
  ink: "#041820",
  mint: "#00C691",
  mintDeep: "#008564",
  paper: "#FAFFFC",
  muted: "rgba(4, 24, 32, 0.58)",
  glass: "rgba(255, 255, 255, 0.14)",
  glassBorder: "rgba(255, 255, 255, 0.2)",
  handle: "rgba(4, 24, 32, 0.16)",
};

function Icon({
  name,
  color,
  size = 16,
}: {
  name: SymbolViewProps["name"];
  color: string;
  size?: number;
}) {
  if (!isIOS) return null;

  return (
    <SymbolView
      name={name}
      tintColor={color}
      size={size}
      resizeMode="scaleAspectFit"
      style={{ height: size, width: size }}
    />
  );
}

export default function HookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const compact = width < 380;
  const drawerHeight = Math.round(height * (compact ? 0.5 : 0.46));

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <Image
        source={heroImage}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={700}
      />

      <LinearGradient
        colors={[
          "rgba(2, 15, 20, 0.25)",
          "rgba(2, 15, 20, 0.05)",
          "rgba(2, 15, 20, 0.78)",
        ]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.nav, { paddingTop: insets.top + 14 }]}>
        <View style={styles.brandMark}>
          <Image
            source={logoImage}
            style={styles.logo}
            contentFit="contain"
            transition={200}
          />
          <Text style={styles.brandName}>Hobbyspot</Text>
        </View>

        <View style={styles.locationChip}>
          <Icon name="location.fill" color="#FFFFFF" size={12} />
          <Text style={styles.locationText}>Warszawa</Text>
        </View>
      </View>

      <View
        style={[
          styles.drawer,
          {
            minHeight: drawerHeight,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.drawerBody}>
          <Text style={styles.eyebrow}>prawdziwe plany w pobliżu</Text>

          <Text style={[styles.title, compact && styles.titleCompact]}>
            Poznawaj inyych robiąc to co lubisz
          </Text>

          <Text style={styles.subtitle}>
            Poznaj ludzi z Twoją pasją i róbcie razem realne rzeczy.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zacznij"
          onPress={() => router.push("/login")}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <Text style={styles.ctaText}>Zacznij</Text>
          <Icon name="arrow.right" color={colors.ink} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.ink,
    flex: 1,
  },
  nav: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  brandMark: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  logo: {
    backgroundColor: colors.paper,
    borderCurve: "continuous",
    borderRadius: 15,
    height: 38,
    width: 38,
  },
  brandName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: isIOS ? -0.28 : 0,
  },
  locationChip: {
    alignItems: "center",
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  locationText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: isIOS ? -0.08 : 0,
  },
  drawer: {
    backgroundColor: colors.paper,
    borderCurve: "continuous",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    bottom: 0,
    left: 0,
    paddingHorizontal: 28,
    paddingTop: 14,
    position: "absolute",
    right: 0,
    shadowColor: "#000000",
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    ...(isIOS ? null : { elevation: 24 }),
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.handle,
    borderRadius: 999,
    height: 5,
    marginBottom: 22,
    width: 44,
  },
  drawerBody: {
    flex: 1,
    gap: 12,
    justifyContent: "center",
  },
  eyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontFamily: isIOS ? "Georgia" : "serif",
    fontSize: 44,
    fontWeight: "400",
    letterSpacing: -0.8,
    lineHeight: 46,
  },
  titleCompact: {
    fontSize: 36,
    lineHeight: 38,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: "400",
    letterSpacing: isIOS ? -0.2 : 0,
    lineHeight: 26,
  },
  cta: {
    alignItems: "center",
    backgroundColor: colors.mint,
    borderCurve: "continuous",
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 22,
    minHeight: 56,

    shadowColor: "#008564",
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    ...(isIOS ? null : { elevation: 5 }),
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
