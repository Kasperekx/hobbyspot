import { StatusBar } from "expo-status-bar";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth/auth-context";

const isIOS = Platform.OS === "ios";

const colors = {
  ink: "#041820",
  mint: "#00C691",
  mintDeep: "#008564",
  paper: "#FAFFFC",
  muted: "rgba(4, 24, 32, 0.58)",
  field: "rgba(4, 24, 32, 0.05)",
  fieldBorder: "rgba(4, 24, 32, 0.1)",
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, logOut } = useAuth();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <StatusBar style="dark" />

      <Text style={styles.eyebrow}>HOBBYSPOT</Text>
      <Text style={styles.title}>Cześć!</Text>
      <Text style={styles.subtitle}>
        Jesteś zalogowany jako {user?.email ?? "—"}. Tu wyląduje główny ekran
        aplikacji.
      </Text>

      <View style={styles.spacer} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Wyloguj się"
        onPress={logOut}
        style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
      >
        <Text style={styles.logoutText}>Wyloguj się</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
    paddingBottom: 32,
    paddingHorizontal: 28,
  },
  eyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  title: {
    color: colors.ink,
    fontFamily: isIOS ? "Georgia" : "serif",
    fontSize: 40,
    fontWeight: "400",
    letterSpacing: -0.6,
    marginTop: 10,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 10,
  },
  spacer: {
    flex: 1,
  },
  logout: {
    alignItems: "center",
    backgroundColor: colors.field,
    borderColor: colors.fieldBorder,
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 54,
  },
  logoutText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
