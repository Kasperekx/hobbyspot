import * as Location from "expo-location";
import { useState } from "react";

import type { OnboardingLocation } from "@/lib/auth/types";

const DEFAULT_SEARCH_RADIUS_METERS = 5000;

type LocationStepState = {
  location: OnboardingLocation | null;
  detecting: boolean;
  searching: boolean;
  error: string | null;
  /** True after a GPS permission denial, so the UI can prompt manual entry. */
  permissionDenied: boolean;
};

/**
 * Builds an `OnboardingLocation` from coordinates, enriching it with a
 * human-readable city/country via reverse geocoding when possible.
 */
async function buildLocation(
  latitude: number,
  longitude: number,
  source: OnboardingLocation["source"],
): Promise<OnboardingLocation> {
  let city: string | null = null;
  let countryCode: string | null = null;

  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (place) {
      city = place.city ?? place.subregion ?? place.region ?? null;
      countryCode = place.isoCountryCode ?? null;
    }
  } catch {
    // Reverse geocoding is best-effort; coordinates alone are enough to save.
  }

  return {
    latitude,
    longitude,
    city,
    country_code: countryCode,
    label: city,
    search_radius_meters: DEFAULT_SEARCH_RADIUS_METERS,
    source,
  };
}

/**
 * Encapsulates the onboarding location step: GPS permission + current position,
 * and manual city geocoding. Keeps the screen focused on rendering.
 */
export function useLocationStep() {
  const [state, setState] = useState<LocationStepState>({
    location: null,
    detecting: false,
    searching: false,
    error: null,
    permissionDenied: false,
  });

  const useCurrentLocation = async () => {
    setState((prev) => ({
      ...prev,
      detecting: true,
      error: null,
      permissionDenied: false,
    }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setState((prev) => ({
          ...prev,
          detecting: false,
          permissionDenied: true,
          error: "Brak zgody na lokalizację. Wybierz miasto ręcznie.",
        }));
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const location = await buildLocation(
        position.coords.latitude,
        position.coords.longitude,
        "gps",
      );
      setState((prev) => ({ ...prev, detecting: false, location }));
    } catch {
      setState((prev) => ({
        ...prev,
        detecting: false,
        error: "Nie udało się pobrać lokalizacji. Spróbuj ponownie.",
      }));
    }
  };

  const searchCity = async (query: string) => {
    const city = query.trim();
    if (!city) return;

    setState((prev) => ({ ...prev, searching: true, error: null }));

    try {
      const [match] = await Location.geocodeAsync(city);
      if (!match) {
        setState((prev) => ({
          ...prev,
          searching: false,
          error: "Nie znaleziono takiego miejsca. Spróbuj inaczej.",
        }));
        return;
      }

      const location = await buildLocation(
        match.latitude,
        match.longitude,
        "manual",
      );
      // Keep what the user typed as the label when reverse geocoding is empty.
      setState((prev) => ({
        ...prev,
        searching: false,
        location: { ...location, label: location.label ?? city, city: location.city ?? city },
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        searching: false,
        error: "Nie udało się wyszukać miasta. Spróbuj ponownie.",
      }));
    }
  };

  return {
    ...state,
    useCurrentLocation,
    searchCity,
  };
}
