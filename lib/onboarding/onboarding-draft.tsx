import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/lib/auth/auth-context";
import type { OnboardingLocation, OnboardingProfile } from "@/lib/auth/types";

const EMPTY_PROFILE: OnboardingProfile = {
  avatar_url: null,
  full_name: null,
  birth_date: null,
};

type OnboardingDraftValue = {
  profile: OnboardingProfile;
  location: OnboardingLocation | null;
  /** Selected interest slugs. */
  interests: string[];
  setProfile: (profile: OnboardingProfile) => void;
  setLocation: (location: OnboardingLocation) => void;
  setInterests: (interests: string[]) => void;
};

const OnboardingDraftContext = createContext<OnboardingDraftValue | null>(null);

/**
 * Holds the in-progress onboarding selections (profile, location, interests)
 * while the user moves through the steps, so the final step can submit them in
 * a single PATCH. Seeded once from the server onboarding state for returning,
 * not-yet-completed users.
 */
export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const { onboarding } = useAuth();

  const [profile, setProfile] = useState<OnboardingProfile>(
    onboarding?.profile ?? EMPTY_PROFILE,
  );
  const [location, setLocation] = useState<OnboardingLocation | null>(
    onboarding?.location ?? null,
  );
  const [interests, setInterests] = useState<string[]>(
    onboarding?.interests.map((interest) => interest.slug) ?? [],
  );

  const value = useMemo<OnboardingDraftValue>(
    () => ({
      profile,
      location,
      interests,
      setProfile,
      setLocation,
      setInterests,
    }),
    [profile, location, interests],
  );

  return (
    <OnboardingDraftContext.Provider value={value}>
      {children}
    </OnboardingDraftContext.Provider>
  );
}

export function useOnboardingDraft(): OnboardingDraftValue {
  const context = useContext(OnboardingDraftContext);
  if (!context) {
    throw new Error(
      "useOnboardingDraft must be used within an OnboardingDraftProvider",
    );
  }
  return context;
}
