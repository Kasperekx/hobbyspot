import type { OnboardingLocation } from "@/lib/auth/types";

export type NearbyEvent = {
  id: string;
  title: string;
  emoji: string;
  category: string;
  interestSlug: string;
  whenLabel: string;
  distanceKm: number;
  venue: string;
  attendees: number;
};

type Template = { title: string; emoji: string; venue: string };

const CATEGORY_LABEL: Record<string, string> = {
  dog_walks: "Psy i spacery",
  running: "Bieganie",
  cycling: "Rower",
  board_games: "Planszówki",
  photography: "Fotografia",
};

const TEMPLATES: Record<string, Template[]> = {
  dog_walks: [
    { title: "Poranny spacer z psami", emoji: "🐕", venue: "Park nad rzeką" },
    { title: "Psie love – wspólne wyjście", emoji: "🦴", venue: "Psi wybieg" },
  ],
  running: [
    { title: "Easy run 5 km o zachodzie", emoji: "🏃", venue: "Bulwary" },
    { title: "Sobotni parkrun", emoji: "⏱️", venue: "Park miejski" },
  ],
  cycling: [
    { title: "Rajd rowerowy po okolicy", emoji: "🚴", venue: "Rynek" },
    { title: "Wieczorna przejażdżka", emoji: "🚲", venue: "Ścieżka nad rzeką" },
  ],
  board_games: [
    { title: "Wieczór planszówek", emoji: "🎲", venue: "Kawiarnia Meeple" },
    { title: "Turniej Catan", emoji: "🧩", venue: "Klub gier" },
  ],
  photography: [
    { title: "Spacer fotograficzny", emoji: "📷", venue: "Stare Miasto" },
    { title: "Street photo walk", emoji: "🌆", venue: "Centrum" },
  ],
};

const FALLBACK: Template[] = [
  { title: "Spotkanie lokalnej społeczności", emoji: "✨", venue: "Centrum" },
];

const WHEN = [
  "Dziś 18:00",
  "Jutro 10:00",
  "Jutro 19:30",
  "Sob 9:00",
  "Sob 17:00",
  "Niedz 11:00",
];

const MAX_EVENTS = 6;

/**
 * Returns mock "nearby events" for the onboarding Aha-moment.
 *
 * NOTE: Placeholder data. Events are built from the user's selected interests
 * and city so they feel relevant, and values are deterministic (stable across
 * re-renders). Replace this with a real events endpoint later; callers keep the
 * same `NearbyEvent[]` shape.
 */
export function nearbyEventsMock(
  location: OnboardingLocation | null,
  interestSlugs: string[],
): NearbyEvent[] {
  const cityPart = location?.city ?? location?.label ?? null;
  const slugs = interestSlugs.length ? interestSlugs : Object.keys(TEMPLATES);

  const events: NearbyEvent[] = [];
  let i = 0;

  for (const slug of slugs) {
    const templates = TEMPLATES[slug] ?? FALLBACK;
    for (const template of templates) {
      const distanceKm = Math.round((0.4 + ((i * 7) % 50) / 10) * 10) / 10;
      const attendees = 4 + ((i * 13) % 36);
      events.push({
        id: `${slug}-${i}`,
        title: template.title,
        emoji: template.emoji,
        category: CATEGORY_LABEL[slug] ?? "Wydarzenie",
        interestSlug: slug,
        whenLabel: WHEN[i % WHEN.length],
        distanceKm,
        venue: cityPart ? `${template.venue}, ${cityPart}` : template.venue,
        attendees,
      });
      i++;
    }
  }

  return events.slice(0, MAX_EVENTS);
}
