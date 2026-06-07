export type AuthUser = {
  id: string;
  email: string;
  avatar_url: string | null;
  full_name: string | null;
  birth_date: string | null;
  confirmed_at: string | null;
  onboarding_completed: boolean;
};

/** Payload for PATCH /api/users/me/onboarding. `birth_date` must be `YYYY-MM-DD`. */
export type OnboardingPayload = {
  avatar_url: string | null;
  full_name: string;
  birth_date: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

/**
 * Maps backend field names to their validation messages, e.g.
 * `{ email: ["must have the @ sign and no spaces"] }`.
 */
export type FieldErrors = Record<string, string[]>;
