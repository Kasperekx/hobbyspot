import { usePathname, useRouter } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth/auth-context";

/**
 * Central navigation guard. Keeps the visible route in sync with auth state:
 * - signedOut            -> only landing/login/register are allowed
 * - signedIn, onboarding not finished -> forced into /onboarding/*
 * - signedIn, onboarding finished      -> the app (/home)
 *
 * This is what answers "valid token but onboarding unfinished": the user is
 * redirected back into the onboarding flow from anywhere, including app launch.
 */
export function useProtectedRoute() {
  const { status, onboardingComplete } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    const inOnboarding = pathname.startsWith("/onboarding");
    const inAuth = pathname === "/login" || pathname === "/register";
    const isLanding = pathname === "/";
    const inApp = pathname === "/home";

    if (status === "signedOut") {
      if (inOnboarding || inApp) router.replace("/");
      return;
    }

    if (!onboardingComplete) {
      if (!inOnboarding) router.replace("/onboarding/profile");
      return;
    }

    if (inAuth || inOnboarding || isLanding) router.replace("/home");
  }, [status, onboardingComplete, pathname, router]);
}
