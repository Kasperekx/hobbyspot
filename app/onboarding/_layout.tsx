import { Stack } from "expo-router";

import { OnboardingDraftProvider } from "@/lib/onboarding/onboarding-draft";

export default function OnboardingLayout() {
  return (
    <OnboardingDraftProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Cross-fade the cinematic discovery and the Aha screen so the
            transition feels continuous rather than a slide. Gestures are
            locked on the cinematic so it can't be swiped away mid-sequence. */}
        <Stack.Screen
          name="discovering"
          options={{ animation: "fade", gestureEnabled: false }}
        />
        <Stack.Screen name="aha" options={{ animation: "fade" }} />
      </Stack>
    </OnboardingDraftProvider>
  );
}
