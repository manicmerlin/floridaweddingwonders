// Hardcoded Florida-cities → nearest-covered-region map.
//
// The site covers South Florida only (Miami-Dade, Broward, Palm Beach,
// Florida Keys, plus Naples/Marco/Fort Myers on the Gulf side). When a
// couple searches for a city we don't cover (St. Pete, Orlando, etc.),
// we want to nudge them toward the closest area we DO cover instead of
// dropping them on a "0 results" wall.
//
// No API, no geocoding — just a small lookup table built around the
// realistic search terms a Florida couple would type. Update this when
// the catalog footprint expands.

import { REGIONS, type RegionDef } from './hyperlocal';

/** Slugify-style normalize: lowercase, strip punctuation, collapse spaces. */
export function normalizeQuery(input: string): string {
  return input
    .toLowerCase()
    .trim()
    // Common abbreviations: "st" / "saint", "ft" / "fort"
    .replace(/\bsaint\b/g, 'st')
    .replace(/\bfort\b/g, 'ft')
    // Strip punctuation (periods in "st.", commas, apostrophes, etc.)
    .replace(/[.,'"`/\\]/g, '')
    // Collapse non-alphanum runs to single space
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalize a city to its slug-style form (kebab). */
export function citySlug(input: string): string {
  return normalizeQuery(input).replace(/\s+/g, '-');
}

interface ProximitySuggestion {
  /** Human-readable name of the off-coverage area the user typed. */
  searchedFor: string;
  /** Short note we show — "we focus on South Florida" framing. */
  note: string;
  /** Which covered regions to suggest, with rationale. */
  suggestedRegions: Array<{
    region: RegionDef;
    why: string;
  }>;
}

interface RawEntry {
  /** Aliases that should match the query — already normalized via normalizeQuery. */
  aliases: string[];
  /** Region slugs (from src/lib/hyperlocal.ts REGIONS) to suggest. */
  regionSlugs: string[];
  /** Per-region rationale shown beneath each chip. */
  rationale: Record<string, string>;
  /** Override the search-name display label. */
  displayName: string;
  /** Override the note. */
  note?: string;
}

// Each entry: aliases (normalized) → suggested covered regions + rationale.
// As of Tier 1 expansion, the directory covers South Florida + West Florida
// + Northeast Florida + Central Florida + the Panhandle. This map now only
// catches the remaining off-coverage gaps: Daytona, Tallahassee, Gainesville,
// Ocala, The Villages.
const RAW_ENTRIES: RawEntry[] = [
  {
    displayName: 'Daytona Beach',
    aliases: ['daytona', 'daytona beach', 'new smyrna beach'],
    regionSlugs: ['northeast-florida', 'central-florida'],
    rationale: {
      'northeast-florida': 'Closest covered area — St. Augustine is about 1 hour north.',
      'central-florida': 'Orlando area is about 1 hour west.',
    },
    note: "We don't cover Daytona directly yet — these are the closest areas we do cover.",
  },
  {
    displayName: 'Tallahassee',
    aliases: ['tallahassee'],
    regionSlugs: ['panhandle', 'tampa-bay'],
    rationale: {
      panhandle: 'Closest covered area — about 1.5 hours west to Apalachicola.',
      'tampa-bay': 'About 4 hours south on the Gulf side.',
    },
    note: "We don't cover Tallahassee directly yet.",
  },
  {
    displayName: 'Gainesville',
    aliases: ['gainesville'],
    regionSlugs: ['northeast-florida', 'central-florida'],
    rationale: {
      'northeast-florida': 'Closest covered area — about 1.5 hours east to St. Augustine.',
      'central-florida': 'About 2 hours south to Orlando area.',
    },
    note: "Gainesville isn't a covered region yet.",
  },
  {
    displayName: 'Ocala / The Villages',
    aliases: ['ocala', 'the villages', 'leesburg'],
    regionSlugs: ['central-florida', 'tampa-bay'],
    rationale: {
      'central-florida': 'Closest covered area — Mount Dora is about 30-45 minutes south.',
      'tampa-bay': 'About 1.5 hours southwest.',
    },
    note: "We don't cover north-central Florida directly yet.",
  },
];

// Build the lookup index once.
const PROXIMITY_INDEX = new Map<string, ProximitySuggestion>();
for (const entry of RAW_ENTRIES) {
  const suggestion: ProximitySuggestion = {
    searchedFor: entry.displayName,
    note: entry.note ?? "We don't cover this area directly — here's what's closest.",
    suggestedRegions: entry.regionSlugs
      .map((slug) => ({
        region: REGIONS.find((r) => r.slug === slug)!,
        why: entry.rationale[slug] ?? '',
      }))
      .filter((s) => !!s.region),
  };
  for (const alias of entry.aliases) {
    PROXIMITY_INDEX.set(normalizeQuery(alias), suggestion);
  }
}

/**
 * Look up an off-coverage Florida search query. Returns suggested covered
 * regions, or null if the query doesn't match any known off-coverage city
 * (in which case the caller should fall back to a generic "no matches"
 * panel).
 */
export function lookupProximitySuggestion(query: string): ProximitySuggestion | null {
  const norm = normalizeQuery(query);
  if (!norm) return null;
  // Exact normalized match first
  const exact = PROXIMITY_INDEX.get(norm);
  if (exact) return exact;
  // Then any alias contained in the query (handles "st pete fl" matching
  // "st pete"). Array-based iteration to avoid TS downlevel-iteration flag.
  const entries = Array.from(PROXIMITY_INDEX.entries());
  for (const [alias, sugg] of entries) {
    if (norm.includes(alias) || alias.includes(norm)) return sugg;
  }
  return null;
}

/**
 * Fuzzy-match a free-text query against a city string. Returns true when
 * the normalized forms align, including alias substitutions like
 * "st pete" → "st petersburg".
 */
export function fuzzyMatchesCity(query: string, city: string): boolean {
  const q = normalizeQuery(query);
  const c = normalizeQuery(city);
  if (!q || !c) return false;
  return c.includes(q) || q.includes(c);
}
