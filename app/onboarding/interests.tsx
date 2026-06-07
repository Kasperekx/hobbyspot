import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useInterests } from "@/hooks/use-interests";
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
const CURRENT_STEP = 3;

/** Maps the MVP catalog slugs to an SF Symbol (iOS) and emoji fallback. */
const ICON_BY_SLUG: Record<string, { name: SymbolViewProps["name"]; glyph: string }> = {
  dog_walks: { name: "pawprint.fill", glyph: "🐕" },
  running: { name: "figure.run", glyph: "🏃" },
  cycling: { name: "bicycle", glyph: "🚴" },
  board_games: { name: "dice.fill", glyph: "🎲" },
  photography: { name: "camera.fill", glyph: "📷" },
};

const FALLBACK_ICON = { name: "star.fill" as SymbolViewProps["name"], glyph: "✨" };

function TileIcon({ slug, color }: { slug: string; color: string }) {
  const icon = ICON_BY_SLUG[slug] ?? FALLBACK_ICON;
  if (isIOS) {
    return (
      <SymbolView
        name={icon.name}
        tintColor={color}
        size={26}
        resizeMode="scaleAspectFit"
        style={{ height: 26, width: 26 }}
      />
    );
  }
  return <Text style={{ fontSize: 24 }}>{icon.glyph}</Text>;
}

export default function InterestsSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { interests: catalog, loading, error, reload } = useInterests();
  const { interests: draftInterests, setInterests } = useOnboardingDraft();

  const [selected, setSelected] = useState<string[]>(draftInterests);

  const toggle = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug],
    );
  };

  const canContinue = selected.length > 0;

  const onContinue = () => {
    if (!canContinue) return;
    setInterests(selected);
    router.push("/onboarding/discovering");
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
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
          <Text style={styles.title}>Co Cię kręci?</Text>
          <Text style={styles.subtitle}>
            Wybierz co najmniej jedno hobby. Pokażemy Ci wydarzenia, które do
            Ciebie pasują.
          </Text>
        </View>

        <View style={styles.body}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.mintDeep} />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>
                Nie udało się wczytać listy zainteresowań.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={reload}
                style={({ pressed }) => [
                  styles.retry,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.retryText}>Spróbuj ponownie</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.grid}>
              {catalog.map((interest) => {
                const isSelected = selected.includes(interest.slug);
                return (
                  <Pressable
                    key={interest.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={interest.name}
                    onPress={() => toggle(interest.slug)}
                    style={({ pressed }) => [
                      styles.tile,
                      isSelected && styles.tileSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <TileIcon
                      slug={interest.slug}
                      color={isSelected ? colors.mintDeep : colors.ink}
                    />
                    <Text
                      style={[
                        styles.tileName,
                        isSelected && styles.tileNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {interest.name}
                    </Text>
                    {interest.description ? (
                      <Text style={styles.tileDesc} numberOfLines={2}>
                        {interest.description}
                      </Text>
                    ) : null}
                    {isSelected ? (
                      <View style={styles.check}>
                        {isIOS ? (
                          <SymbolView
                            name="checkmark"
                            tintColor="#FFFFFF"
                            size={12}
                            resizeMode="scaleAspectFit"
                            style={{ height: 12, width: 12 }}
                          />
                        ) : (
                          <Text style={styles.checkGlyph}>✓</Text>
                        )}
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
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
          <Text style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}>
            {selected.length > 0
              ? `Dalej (${selected.length})`
              : "Wybierz hobby"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.paper,
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
    marginTop: 28,
  },
  centered: {
    alignItems: "center",
    gap: 16,
    paddingVertical: 48,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tile: {
    backgroundColor: colors.field,
    borderColor: colors.fieldBorder,
    borderCurve: "continuous",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    minHeight: 116,
    padding: 16,
    width: "47.8%",
  },
  tileSelected: {
    backgroundColor: "rgba(0, 198, 145, 0.1)",
    borderColor: colors.mint,
  },
  tileName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  tileNameSelected: {
    color: colors.mintDeep,
  },
  tileDesc: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  check: {
    alignItems: "center",
    backgroundColor: colors.mintDeep,
    borderRadius: 999,
    height: 22,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 12,
    width: 22,
  },
  checkGlyph: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  errorText: {
    color: colors.danger,
    fontSize: 15,
    textAlign: "center",
  },
  retry: {
    backgroundColor: colors.field,
    borderColor: colors.fieldBorder,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  retryText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
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
