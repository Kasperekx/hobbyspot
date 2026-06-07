import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useState } from "react";
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

import { useRouter } from "expo-router";

import { useLocationStep } from "@/hooks/use-location-step";
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
  track: "rgba(4, 24, 32, 0.08)",
};

const TOTAL_STEPS = 3;
const CURRENT_STEP = 2;

function Icon({
  name,
  glyph,
  color,
  size = 16,
}: {
  name: SymbolViewProps["name"];
  glyph: string;
  color: string;
  size?: number;
}) {
  if (isIOS) {
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

  return <Text style={{ color, fontSize: size * 0.9 }}>{glyph}</Text>;
}

export default function LocationSetupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setLocation } = useOnboardingDraft();
  const {
    location,
    detecting,
    searching,
    error,
    permissionDenied,
    useCurrentLocation,
    searchCity,
  } = useLocationStep();

  const [city, setCity] = useState("");

  const showManual = permissionDenied || location?.source === "manual";
  const canContinue = location !== null;

  const onContinue = () => {
    if (!location) return;
    // Store the location in the onboarding draft and move to the interests
    // step; everything is submitted together on the final step.
    setLocation(location);
    router.push("/onboarding/interests");
  };

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
          <View style={styles.topBar}>
            <View style={styles.progress}>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressSegment,
                    i < CURRENT_STEP && styles.progressSegmentActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.stepLabel}>
              KROK {CURRENT_STEP} Z {TOTAL_STEPS}
            </Text>
            <Text style={styles.title}>Gdzie szukać wydarzeń?</Text>
            <Text style={styles.subtitle}>
              Użyjemy Twojej lokalizacji, aby pokazywać wydarzenia w pobliżu.
            </Text>
          </View>

          <View style={styles.body}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Użyj mojej lokalizacji"
              disabled={detecting}
              onPress={useCurrentLocation}
              style={({ pressed }) => [
                styles.gpsButton,
                pressed && !detecting && styles.pressed,
              ]}
            >
              <LinearGradient
                colors={[colors.mint, colors.mintDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gpsIcon}
              >
                <Icon
                  name="location.fill"
                  glyph="📍"
                  color="#FFFFFF"
                  size={20}
                />
              </LinearGradient>
              <View style={styles.gpsTextWrap}>
                <Text style={styles.gpsTitle}>Użyj mojej lokalizacji</Text>
                <Text style={styles.gpsSubtitle}>
                  Najszybszy sposób, by zacząć
                </Text>
              </View>
              {detecting ? (
                <ActivityIndicator color={colors.mintDeep} />
              ) : (
                <Icon
                  name="chevron.right"
                  glyph="›"
                  color={colors.faint}
                  size={16}
                />
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>lub wybierz ręcznie</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Miasto lub okolica</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.input}
                  placeholder="np. Warszawa"
                  placeholderTextColor={colors.muted}
                  value={city}
                  onChangeText={setCity}
                  autoCapitalize="words"
                  returnKeyType="search"
                  onSubmitEditing={() => searchCity(city)}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Szukaj miasta"
                  disabled={searching || city.trim().length === 0}
                  onPress={() => searchCity(city)}
                  style={({ pressed }) => [
                    styles.searchButton,
                    (searching || city.trim().length === 0) &&
                      styles.searchButtonDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  {searching ? (
                    <ActivityIndicator color={colors.ink} />
                  ) : (
                    <Icon
                      name="magnifyingglass"
                      glyph="🔍"
                      color={colors.ink}
                      size={18}
                    />
                  )}
                </Pressable>
              </View>
              {showManual && !location ? (
                <Text style={styles.hint}>
                  Wpisz miasto, aby ustawić lokalizację ręcznie.
                </Text>
              ) : null}
            </View>

            {location ? (
              <View style={styles.selected}>
                <Icon
                  name="checkmark.circle.fill"
                  glyph="✓"
                  color={colors.mintDeep}
                  size={20}
                />
                <View style={styles.selectedTextWrap}>
                  <Text style={styles.selectedLabel}>
                    {location.label ?? location.city ?? "Wybrana lokalizacja"}
                  </Text>
                  <Text style={styles.selectedMeta}>
                    {location.source === "gps"
                      ? "Lokalizacja z urządzenia"
                      : "Wybrane ręcznie"}
                  </Text>
                </View>
              </View>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.spacer} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dalej"
            disabled={!canContinue}
            onPress={onContinue}
            style={({ pressed }) => [
              styles.cta,
              !canContinue && styles.ctaDisabled,
              pressed && canContinue && styles.pressed,
            ]}
          >
            <Text
              style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}
            >
              Dalej
            </Text>
          </Pressable>
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
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
  progress: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
  },
  progressSegment: {
    backgroundColor: colors.track,
    borderRadius: 999,
    flex: 1,
    height: 5,
  },
  progressSegmentActive: {
    backgroundColor: colors.mint,
  },
  header: {
    marginTop: 28,
  },
  stepLabel: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 10,
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
  body: {
    marginTop: 36,
  },
  gpsButton: {
    alignItems: "center",
    backgroundColor: colors.field,
    borderColor: colors.fieldBorder,
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 14,
    minHeight: 72,
    paddingHorizontal: 16,
  },
  gpsIcon: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  gpsTextWrap: {
    flex: 1,
  },
  gpsTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: isIOS ? -0.2 : 0,
  },
  gpsSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginVertical: 22,
  },
  dividerLine: {
    backgroundColor: colors.fieldBorder,
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "500",
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
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  input: {
    backgroundColor: colors.field,
    borderColor: colors.fieldBorder,
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: colors.track,
    borderCurve: "continuous",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  hint: {
    color: colors.faint,
    fontSize: 13,
    marginTop: 2,
  },
  selected: {
    alignItems: "center",
    backgroundColor: "rgba(0, 198, 145, 0.1)",
    borderCurve: "continuous",
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    padding: 16,
  },
  selectedTextWrap: {
    flex: 1,
  },
  selectedLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  selectedMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 16,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 24,
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
    backgroundColor: colors.track,
    shadowOpacity: 0,
    ...(isIOS ? null : { elevation: 0 }),
  },
  ctaText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: isIOS ? -0.2 : 0,
  },
  ctaTextDisabled: {
    color: colors.faint,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
