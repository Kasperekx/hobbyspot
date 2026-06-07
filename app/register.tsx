import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRegisterForm } from "@/hooks/use-register-form";

const isIOS = Platform.OS === "ios";

const colors = {
  ink: "#041820",
  mint: "#00C691",
  mintDeep: "#008564",
  paper: "#FAFFFC",
  muted: "rgba(4, 24, 32, 0.58)",
  danger: "#D7263D",
  field: "rgba(4, 24, 32, 0.05)",
  fieldBorder: "rgba(4, 24, 32, 0.1)",
  divider: "rgba(4, 24, 32, 0.1)",
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

function Field({
  label,
  error,
  ...inputProps
}: { label: string; error?: string } & React.ComponentProps<
  typeof TextInput
>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.muted}
        {...inputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    email,
    password,
    errors,
    submitting,
    onEmailChange,
    onPasswordChange,
    submit,
  } = useRegisterForm();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={isIOS ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + 12,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Wróć"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            {isIOS ? (
              <Icon name="chevron.left" color={colors.ink} size={17} />
            ) : (
              <Text style={styles.backGlyph}>←</Text>
            )}
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Załóż konto</Text>
            <Text style={styles.subtitle}>
              Dołącz i zacznij robić to, co kochasz.
            </Text>
          </View>

          <View style={styles.form}>
            <Field
              label="Email"
              value={email}
              onChangeText={onEmailChange}
              error={errors.email}
              placeholder="ty@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!submitting}
            />

            <Field
              label="Hasło"
              value={password}
              onChangeText={onPasswordChange}
              error={errors.password}
              placeholder="Minimum 12 znaków"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
              editable={!submitting}
              onSubmitEditing={submit}
              returnKeyType="go"
            />
          </View>

          {errors.form ? (
            <Text style={styles.formError}>{errors.form}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Załóż konto"
            disabled={submitting}
            onPress={submit}
            style={({ pressed }) => [
              styles.cta,
              submitting && styles.ctaDisabled,
              pressed && !submitting && styles.pressed,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Text style={styles.ctaText}>Załóż konto</Text>
            )}
          </Pressable>

          <Text style={styles.terms}>
            Rejestrując się, akceptujesz{" "}
            <Text style={styles.termsLink}>Regulamin</Text> oraz{" "}
            <Text style={styles.termsLink}>Politykę prywatności</Text>.
          </Text>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>lub</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kontynuuj z Apple"
            style={({ pressed }) => [
              styles.social,
              styles.socialApple,
              pressed && styles.pressed,
            ]}
          >
            <Icon name="apple.logo" color="#FFFFFF" size={18} />
            <Text style={styles.socialAppleText}>Kontynuuj z Apple</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kontynuuj z Google"
            style={({ pressed }) => [
              styles.social,
              styles.socialGoogle,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.googleMark}>G</Text>
            <Text style={styles.socialGoogleText}>Kontynuuj z Google</Text>
          </Pressable>

          <View style={styles.spacer} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Masz już konto? </Text>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.footerLink}>Zaloguj się</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.field,
    borderColor: colors.fieldBorder,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  backGlyph: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 22,
  },
  header: {
    marginTop: 28,
  },
  title: {
    color: colors.ink,
    fontFamily: isIOS ? "Georgia" : "serif",
    fontSize: 34,
    fontWeight: "400",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: isIOS ? -0.2 : 0,
    marginTop: 6,
  },
  form: {
    gap: 16,
    marginTop: 32,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: isIOS ? -0.08 : 0,
  },
  input: {
    backgroundColor: colors.field,
    borderColor: colors.fieldBorder,
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 1,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 2,
  },
  formError: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
  },
  cta: {
    alignItems: "center",
    backgroundColor: colors.mint,
    borderCurve: "continuous",
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 28,
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
  terms: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
    textAlign: "center",
  },
  termsLink: {
    color: colors.mintDeep,
    fontWeight: "600",
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginVertical: 22,
  },
  dividerLine: {
    backgroundColor: colors.divider,
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  social: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 54,
  },
  socialApple: {
    backgroundColor: colors.ink,
  },
  socialAppleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: isIOS ? -0.2 : 0,
  },
  socialGoogle: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.fieldBorder,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
  },
  googleMark: {
    color: "#4285F4",
    fontSize: 18,
    fontWeight: "700",
  },
  socialGoogleText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: isIOS ? -0.2 : 0,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  footerText: {
    color: colors.muted,
    fontSize: 14,
  },
  footerLink: {
    color: colors.mintDeep,
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
