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
// Naples + Marco + Fort Myers are within our footprint already, so we route
// Gulf-coast queries to those rather than to Miami.
const RAW_ENTRIES: RawEntry[] = [
  {
    displayName: 'St. Petersburg',
    aliases: ['st petersburg', 'st pete', 'st pete fl', 'saint petersburg', 'st petersberg'],
    regionSlugs: ['naples', 'fort-myers'],
    rationale: {
      naples: 'Closest covered area on the Gulf side — about 2 hours south.',
      'fort-myers': 'Also Gulf-side, slightly closer than Naples.',
    },
    note: "We focus on South Florida — we don't have venues in the Tampa Bay area yet.",
  },
  {
    displayName: 'Tampa',
    aliases: ['tampa', 'tampa bay', 'tampa fl'],
    regionSlugs: ['naples', 'fort-myers'],
    rationale: {
      naples: 'Closest covered area on the Gulf side — about 2 hours south.',
      'fort-myers': 'Also Gulf-side, slightly closer than Naples.',
    },
    note: "We focus on South Florida — we don't have venues in the Tampa Bay area yet.",
  },
  {
    displayName: 'Clearwater',
    aliases: ['clearwater', 'clearwater beach'],
    regionSlugs: ['naples', 'fort-myers'],
    rationale: {
      naples: 'Closest covered area on the Gulf side — about 2.5 hours south.',
      'fort-myers': 'Also Gulf-side, slightly closer than Naples.',
    },
    note: "We focus on South Florida — Clearwater is outside our coverage today.",
  },
  {
    displayName: 'Sarasota',
    aliases: ['sarasota', 'siesta key'],
    regionSlugs: ['naples', 'fort-myers'],
    rationale: {
      naples: 'Closest covered area on the Gulf side — about 90 minutes south.',
      'fort-myers': 'Also Gulf-side, similar drive.',
    },
    note: "We don't cover Sarasota directly yet — these Gulf-coast areas are nearest.",
  },
  {
    displayName: 'Bradenton',
    aliases: ['bradenton', 'anna maria island'],
    regionSlugs: ['naples', 'fort-myers'],
    rationale: {
      naples: 'Closest covered area on the Gulf side.',
      'fort-myers': 'Also Gulf-side.',
    },
    note: "We don't cover Bradenton directly yet — these Gulf-coast areas are nearest.",
  },
  {
    displayName: 'Orlando',
    aliases: ['orlando', 'orlando fl', 'lake buena vista', 'kissimmee', 'disney', 'walt disney world'],
    regionSlugs: ['palm-beach', 'fort-lauderdale'],
    rationale: {
      'palm-beach': 'Closest covered area on the east coast — about 2.5 hours south.',
      'fort-lauderdale': 'Slightly further south but a deeper venue catalog.',
    },
    note: "We focus on South Florida — we don't cover Central Florida or theme-park weddings yet.",
  },
  {
    displayName: 'Jacksonville',
    aliases: ['jacksonville', 'jacksonville fl', 'jax'],
    regionSlugs: ['palm-beach'],
    rationale: {
      'palm-beach': 'Closest covered area — but still ~4 hours south.',
    },
    note: "We focus on South Florida — Jacksonville is well outside our coverage.",
  },
  {
    displayName: 'St. Augustine',
    aliases: ['st augustine', 'saint augustine'],
    regionSlugs: ['palm-beach'],
    rationale: {
      'palm-beach': 'Closest covered area — about 3 hours south.',
    },
    note: "We focus on South Florida — St. Augustine is outside our coverage today.",
  },
  {
    displayName: 'Daytona Beach',
    aliases: ['daytona', 'daytona beach', 'new smyrna beach'],
    regionSlugs: ['palm-beach'],
    rationale: {
      'palm-beach': 'Closest covered area on the east coast.',
    },
    note: "We don't cover the Daytona area yet.",
  },
  {
    displayName: 'Pensacola',
    aliases: ['pensacola', 'destin', 'panama city', 'panama city beach', 'fort walton beach', '30a'],
    regionSlugs: ['naples'],
    rationale: {
      naples: 'Closest covered area on the Gulf — but still a long drive from the Panhandle.',
    },
    note: "We focus on South Florida — the Panhandle is well outside our coverage.",
  },
  {
    displayName: 'Tallahassee',
    aliases: ['tallahassee'],
    regionSlugs: ['naples', 'palm-beach'],
    rationale: {
      naples: 'Closest covered area on the Gulf side.',
      'palm-beach': 'Closest on the east coast.',
    },
    note: "We focus on South Florida — Tallahassee is well outside our coverage.",
  },
  {
    displayName: 'Gainesville',
    aliases: ['gainesville'],
    regionSlugs: ['palm-beach', 'naples'],
    rationale: {
      'palm-beach': 'Closest east-coast area we cover.',
      naples: 'Closest Gulf-side area we cover.',
    },
    note: "We focus on South Florida — Gainesville is well outside our coverage.",
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
