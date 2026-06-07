export type AuthUser = {
  id: string;
  email: string;
  confirmed_at: string | null;
};

export type OnboardingProfile = {
  avatar_url: string | null;
  full_name: string | null;
  birth_date: string | null;
};

export type LocationSource = "manual" | "gps";

/** Default discovery location saved during onboarding. */
export type OnboardingLocation = {
  latitude: number;
  longitude: number;
  city?: string | null;
  country_code?: string | null;
  label?: string | null;
  search_radius_meters: number;
  source: LocationSource;
};

/** Catalog entry from GET /api/interests, used to render onboarding tiles. */
export type Interest = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
};

/** A user's selected interest as returned inside onboarding state. */
export type OnboardingInterest = {
  id: string;
  slug: string;
  name: string;
  notifications_enabled: boolean;
};

export type OnboardingState = {
  profile: OnboardingProfile;
  location: OnboardingLocation | null;
  interests: OnboardingInterest[];
  completed: boolean;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  onboarding: OnboardingState;
};

/** Account + onboarding returned by GET /api/users/me (no token). */
export type CurrentUser = {
  user: AuthUser;
  onboarding: OnboardingState;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

/**
 * Partial payload for PATCH /api/users/me/onboarding. Any subset of
 * `profile`, `location`, `interests`, `completed` may be sent. `interests` is
 * a list of slugs. `birth_date` must be `YYYY-MM-DD`. When `completed` is
 * `true`, the backend requires a saved location and at least one interest.
 */
export type OnboardingUpdate = {
  profile?: OnboardingProfile;
  location?: OnboardingLocation;
  interests?: string[];
  completed?: boolean;
};

/**
 * Maps backend field names to their validation messages, e.g.
 * `{ email: ["must have the @ sign and no spaces"] }`.
 */
export type FieldErrors = Record<string, string[]>;
