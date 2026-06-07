import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  completeOnboardingRequest,
  logInRequest,
  logOutRequest,
  meRequest,
  registerRequest,
} from "./api";
import { clearToken, loadToken, saveToken } from "./storage";
import type {
  AuthCredentials,
  AuthSession,
  AuthUser,
  OnboardingPayload,
} from "./types";

type AuthStatus = "loading" | "signedIn" | "signedOut";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  onboardingComplete: boolean;
  register: (credentials: AuthCredentials) => Promise<AuthSession>;
  logIn: (credentials: AuthCredentials) => Promise<AuthSession>;
  logOut: () => Promise<void>;
  completeOnboarding: (payload: OnboardingPayload) => Promise<AuthUser>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const stored = await loadToken();
      if (!stored) {
        if (active) setStatus("signedOut");
        return;
      }

      try {
        const me = await meRequest(stored);
        if (!active) return;
        setToken(stored);
        setUser(me);
        setStatus("signedIn");
      } catch {
        await clearToken();
        if (!active) return;
        setStatus("signedOut");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const applySession = useCallback(async (session: AuthSession) => {
    await saveToken(session.token);
    setToken(session.token);
    // `/me` is the source of truth for `onboarding_completed`, so resolve the
    // full user before flipping to signedIn — this prevents a returning user
    // from briefly being routed into onboarding.
    let resolvedUser = session.user;
    try {
      resolvedUser = await meRequest(session.token);
    } catch {
      // Fall back to the session user if /me is briefly unavailable.
    }
    setUser(resolvedUser);
    setStatus("signedIn");
  }, []);

  const register = useCallback(
    async (credentials: AuthCredentials) => {
      const session = await registerRequest(credentials);
      await applySession(session);
      return session;
    },
    [applySession],
  );

  const logIn = useCallback(
    async (credentials: AuthCredentials) => {
      const session = await logInRequest(credentials);
      await applySession(session);
      return session;
    },
    [applySession],
  );

  const logOut = useCallback(async () => {
    if (token) {
      try {
        await logOutRequest(token);
      } catch {
        // Revoke failures should not block local sign-out.
      }
    }
    await clearToken();
    setToken(null);
    setUser(null);
    setStatus("signedOut");
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const me = await meRequest(token);
      setUser(me);
    } catch {
      // Keep the current session; a transient /me failure is non-fatal here.
    }
  }, [token]);

  // Persists the onboarding profile and marks onboarding complete server-side.
  // Returns the updated user (with `onboarding_completed: true`).
  const completeOnboarding = useCallback(
    async (payload: OnboardingPayload) => {
      if (!token) throw new Error("Not authenticated");
      const updated = await completeOnboardingRequest(token, payload);
      setUser(updated);
      return updated;
    },
    [token],
  );

  const onboardingComplete = user?.onboarding_completed === true;

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      token,
      onboardingComplete,
      register,
      logIn,
      logOut,
      completeOnboarding,
      refreshUser,
    }),
    [
      status,
      user,
      token,
      onboardingComplete,
      register,
      logIn,
      logOut,
      completeOnboarding,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
