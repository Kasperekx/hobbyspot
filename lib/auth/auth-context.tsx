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
  logInRequest,
  logOutRequest,
  meRequest,
  registerRequest,
  updateOnboardingRequest,
} from "./api";
import { clearToken, loadToken, saveToken } from "./storage";
import type {
  AuthCredentials,
  AuthSession,
  AuthUser,
  OnboardingState,
  OnboardingUpdate,
} from "./types";

type AuthStatus = "loading" | "signedIn" | "signedOut";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  onboarding: OnboardingState | null;
  token: string | null;
  onboardingComplete: boolean;
  register: (credentials: AuthCredentials) => Promise<AuthSession>;
  logIn: (credentials: AuthCredentials) => Promise<AuthSession>;
  logOut: () => Promise<void>;
  saveOnboarding: (update: OnboardingUpdate) => Promise<OnboardingState>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
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
        setUser(me.user);
        setOnboarding(me.onboarding);
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
    // `/me` is the source of truth for onboarding state, so resolve the full
    // user before flipping to signedIn — this prevents a returning user from
    // briefly being routed into onboarding.
    let resolvedUser = session.user;
    let resolvedOnboarding = session.onboarding;
    try {
      const me = await meRequest(session.token);
      resolvedUser = me.user;
      resolvedOnboarding = me.onboarding;
    } catch {
      // Fall back to the session payload if /me is briefly unavailable.
    }
    setUser(resolvedUser);
    setOnboarding(resolvedOnboarding);
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
    setOnboarding(null);
    setStatus("signedOut");
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const me = await meRequest(token);
      setUser(me.user);
      setOnboarding(me.onboarding);
    } catch {
      // Keep the current session; a transient /me failure is non-fatal here.
    }
  }, [token]);

  // Persists a partial onboarding update (profile, location, and/or completed)
  // and returns the updated onboarding state.
  const saveOnboarding = useCallback(
    async (update: OnboardingUpdate) => {
      if (!token) throw new Error("Not authenticated");
      const updated = await updateOnboardingRequest(token, update);
      setOnboarding(updated);
      return updated;
    },
    [token],
  );

  const onboardingComplete = onboarding?.completed === true;

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      onboarding,
      token,
      onboardingComplete,
      register,
      logIn,
      logOut,
      saveOnboarding,
      refreshUser,
    }),
    [
      status,
      user,
      onboarding,
      token,
      onboardingComplete,
      register,
      logIn,
      logOut,
      saveOnboarding,
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
