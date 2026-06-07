import type {
  AuthCredentials,
  AuthSession,
  CurrentUser,
  FieldErrors,
  Interest,
  OnboardingState,
  OnboardingUpdate,
} from "./types";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

/** Abort requests that hang (e.g. unreachable backend) instead of spinning forever. */
const REQUEST_TIMEOUT_MS = 15000;

async function request(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Error thrown for any non-success auth response.
 * - `fieldErrors` is set for 422 validation responses.
 * - `detail` is set for responses like 401 `{ errors: { detail } }`.
 */
export class AuthError extends Error {
  status: number;
  fieldErrors?: FieldErrors;
  detail?: string;

  constructor(
    status: number,
    options: { message?: string; fieldErrors?: FieldErrors; detail?: string } = {},
  ) {
    super(options.message ?? options.detail ?? "Wystąpił błąd. Spróbuj ponownie.");
    this.name = "AuthError";
    this.status = status;
    this.fieldErrors = options.fieldErrors;
    this.detail = options.detail;
  }
}

async function parseJson(response: Response): Promise<any> {
  return response.json().catch(() => null);
}

function buildError(status: number, body: any): AuthError {
  const errors = body?.errors;
  if (errors && typeof errors === "object") {
    if (typeof errors.detail === "string") {
      return new AuthError(status, { detail: errors.detail });
    }
    return new AuthError(status, { fieldErrors: errors });
  }
  return new AuthError(status);
}

function headers(token?: string): Record<string, string> {
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

export async function registerRequest(
  credentials: AuthCredentials,
): Promise<AuthSession> {
  const response = await request("/api/users/register", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ user: credentials }),
  });
  const body = await parseJson(response);

  if (response.status === 201) return body.data as AuthSession;
  throw buildError(response.status, body);
}

export async function logInRequest(
  credentials: AuthCredentials,
): Promise<AuthSession> {
  const response = await request("/api/users/log-in", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ user: credentials }),
  });
  const body = await parseJson(response);

  if (response.ok) return body.data as AuthSession;
  throw buildError(response.status, body);
}

export async function listInterestsRequest(): Promise<Interest[]> {
  const response = await request("/api/interests", {
    method: "GET",
    headers: headers(),
  });
  const body = await parseJson(response);

  if (response.ok) return body.data as Interest[];
  throw buildError(response.status, body);
}

export async function meRequest(token: string): Promise<CurrentUser> {
  const response = await request("/api/users/me", {
    method: "GET",
    headers: headers(token),
  });
  const body = await parseJson(response);

  if (response.ok) return body.data as CurrentUser;
  throw buildError(response.status, body);
}

export async function updateOnboardingRequest(
  token: string,
  update: OnboardingUpdate,
): Promise<OnboardingState> {
  const response = await request("/api/users/me/onboarding", {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ onboarding: update }),
  });
  const body = await parseJson(response);

  if (response.ok) return body.data.onboarding as OnboardingState;
  throw buildError(response.status, body);
}

export async function logOutRequest(token: string): Promise<void> {
  const response = await request("/api/users/log-out", {
    method: "DELETE",
    headers: headers(token),
  });

  if (response.status === 204 || response.ok) return;
  throw buildError(response.status, await parseJson(response));
}
