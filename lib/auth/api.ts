import type {
  AuthCredentials,
  AuthSession,
  AuthUser,
  FieldErrors,
  OnboardingPayload,
} from "./types";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

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
  const response = await fetch(`${BASE_URL}/api/users/register`, {
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
  const response = await fetch(`${BASE_URL}/api/users/log-in`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ user: credentials }),
  });
  const body = await parseJson(response);

  if (response.ok) return body.data as AuthSession;
  throw buildError(response.status, body);
}

export async function meRequest(token: string): Promise<AuthUser> {
  const response = await fetch(`${BASE_URL}/api/users/me`, {
    method: "GET",
    headers: headers(token),
  });
  const body = await parseJson(response);

  if (response.ok) return body.data.user as AuthUser;
  throw buildError(response.status, body);
}

export async function completeOnboardingRequest(
  token: string,
  payload: OnboardingPayload,
): Promise<AuthUser> {
  const response = await fetch(`${BASE_URL}/api/users/me/onboarding`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ user: payload }),
  });
  const body = await parseJson(response);

  if (response.ok) return body.data.user as AuthUser;
  throw buildError(response.status, body);
}

export async function logOutRequest(token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/users/log-out`, {
    method: "DELETE",
    headers: headers(token),
  });

  if (response.status === 204 || response.ok) return;
  throw buildError(response.status, await parseJson(response));
}
