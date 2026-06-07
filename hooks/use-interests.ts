import { useEffect, useState } from "react";

import { listInterestsRequest } from "@/lib/auth/api";
import type { Interest } from "@/lib/auth/types";

type InterestsState = {
  interests: Interest[];
  loading: boolean;
  error: boolean;
};

/** Loads the interest catalog (GET /api/interests) for the onboarding tiles. */
export function useInterests() {
  const [state, setState] = useState<InterestsState>({
    interests: [],
    loading: true,
    error: false,
  });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: false }));
    try {
      const interests = await listInterestsRequest();
      setState({ interests, loading: false, error: false });
    } catch {
      setState({ interests: [], loading: false, error: true });
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const interests = await listInterestsRequest();
        if (active) setState({ interests, loading: false, error: false });
      } catch {
        if (active) setState({ interests: [], loading: false, error: true });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { ...state, reload: load };
}
