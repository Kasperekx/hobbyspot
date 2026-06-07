import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
const CURRENT_STEP = 1;

const MONTHS_PL = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];

const today = new Date();
const maxBirthDate = today;
const minBirthDate = new Date(1920, 0, 1);
const defaultBirthDate = new Date(
  today.getFullYear() - 18,
  today.getMonth(),
  today.getDate(),
);

function formatDate(date: Date) {
  return `${date.getDate()} ${MONTHS_PL[date.getMonth()]} ${date.getFullYear()}`;
}

/** Local-date safe ISO string (YYYY-MM-DD), avoids the UTC shift of toISOString(). */
function toISODate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses a `YYYY-MM-DD` string into a local Date, or null when invalid. */
function fromISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getAge(date: Date) {
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

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

export default function ProfileSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useOnboardingDraft();

  const [avatar, setAvatar] = useState<string | null>(profile.avatar_url);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [birthDate, setBirthDate] = useState<Date | null>(
    fromISODate(profile.birth_date),
  );
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(defaultBirthDate);

  const canContinue = fullName.trim().length > 1 && birthDate !== null;

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const openDatePicker = () => {
    const initial = birthDate ?? defaultBirthDate;

    if (isIOS) {
      setDraftDate(initial);
      setIosPickerOpen(true);
      return;
    }

    DateTimePickerAndroid.open({
      value: initial,
      mode: "date",
      display: "spinner",
      maximumDate: maxBirthDate,
      minimumDate: minBirthDate,
      onChange: (event: DateTimePickerEvent, date?: Date) => {
        if (event.type === "set" && date) {
          setBirthDate(date);
        }
      },
    });
  };

  const confirmIosDate = () => {
    setBirthDate(draftDate);
    setIosPickerOpen(false);
  };

  const onContinue = () => {
    if (!canContinue || !birthDate) return;

    // Store the profile in the onboarding draft; everything is submitted in a
    // single PATCH on the final ("Aha moment") step.
    setProfile({
      // avatar_url stays null until an upload endpoint exists; the local image
      // URI is not a hostable URL.
      avatar_url: null,
      full_name: fullName.trim(),
      birth_date: toISODate(birthDate),
    });
    router.push("/onboarding/location");
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
            <Text style={styles.title}>Stwórz swój profil</Text>
            <Text style={styles.subtitle}>
              Dodaj kilka szczegółów, aby inni mogli Cię rozpoznać.
            </Text>
          </View>

          <View style={styles.avatarWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dodaj zdjęcie profilowe"
              onPress={pickAvatar}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <LinearGradient
                colors={[colors.mint, colors.mintDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <View style={styles.avatarInner}>
                  {avatar ? (
                    <Image
                      source={{ uri: avatar }}
                      style={styles.avatarImage}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <Icon
                      name="person.fill"
                      glyph="👤"
                      color={colors.faint}
                      size={56}
                    />
                  )}
                </View>
              </LinearGradient>

              <View style={styles.cameraBadge}>
                <Icon
                  name={avatar ? "arrow.triangle.2.circlepath" : "camera.fill"}
                  glyph={avatar ? "↻" : "＋"}
                  color="#FFFFFF"
                  size={16}
                />
              </View>
            </Pressable>

            <Text style={styles.avatarHint}>
              {avatar ? "Zmień zdjęcie" : "Dodaj zdjęcie profilowe"}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Imię i nazwisko</Text>
              <TextInput
                style={styles.input}
                placeholder="np. Anna Kowalska"
                placeholderTextColor={colors.muted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="done"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Data urodzenia</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Wybierz datę urodzenia"
                onPress={openDatePicker}
                style={({ pressed }) => [
                  styles.input,
                  styles.dateInput,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.dateText,
                    !birthDate && styles.datePlaceholder,
                  ]}
                >
                  {birthDate ? formatDate(birthDate) : "Wybierz datę"}
                </Text>
                <Icon
                  name="calendar"
                  glyph="📅"
                  color={colors.muted}
                  size={18}
                />
              </Pressable>
              {birthDate && (
                <Text style={styles.ageHint}>
                  {getAge(birthDate)} lat — widoczne tylko dla Ciebie
                </Text>
              )}
            </View>
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

      {isIOS && (
        <Modal
          visible={iosPickerOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIosPickerOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIosPickerOpen(false)}
          />
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Pressable hitSlop={8} onPress={() => setIosPickerOpen(false)}>
                <Text style={styles.sheetCancel}>Anuluj</Text>
              </Pressable>
              <Text style={styles.sheetTitle}>Data urodzenia</Text>
              <Pressable hitSlop={8} onPress={confirmIosDate}>
                <Text style={styles.sheetDone}>Gotowe</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draftDate}
              mode="date"
              display="spinner"
              maximumDate={maxBirthDate}
              minimumDate={minBirthDate}
              locale="pl-PL"
              textColor={colors.ink}
              themeVariant="light"
              onChange={(_event, date) => date && setDraftDate(date)}
            />
          </View>
        </Modal>
      )}
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
  avatarWrap: {
    alignItems: "center",
    marginTop: 36,
  },
  avatarRing: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 999,
    height: 140,
    justifyContent: "center",
    padding: 4,
    width: 140,
    shadowColor: colors.mint,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    ...(isIOS ? null : { elevation: 10 }),
  },
  avatarInner: {
    alignItems: "center",
    backgroundColor: colors.field,
    borderRadius: 999,
    height: "100%",
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  cameraBadge: {
    alignItems: "center",
    backgroundColor: colors.mintDeep,
    borderColor: colors.paper,
    borderRadius: 999,
    borderWidth: 3,
    bottom: 2,
    height: 42,
    justifyContent: "center",
    position: "absolute",
    right: 2,
    width: 42,
  },
  avatarHint: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 14,
  },
  form: {
    gap: 16,
    marginTop: 36,
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
  dateInput: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateText: {
    color: colors.ink,
    fontSize: 16,
  },
  datePlaceholder: {
    color: colors.muted,
  },
  ageHint: {
    color: colors.faint,
    fontSize: 13,
    marginTop: 2,
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
  modalBackdrop: {
    backgroundColor: "rgba(4, 24, 32, 0.35)",
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  sheetCancel: {
    color: colors.muted,
    fontSize: 16,
  },
  sheetDone: {
    color: colors.mintDeep,
    fontSize: 16,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
