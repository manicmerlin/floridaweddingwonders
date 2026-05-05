// Search shorthand resolver — turns the casual variants couples actually
// type ("st pete", "panhandle", "30a", "ft myers", "fll") into one of three
// concrete navigation outcomes:
//
//   { type: 'region',       region: <region-slug> }       → redirect to /venues/in/<region>
//   { type: 'city',         city:   <canonical-city> }    → filter listing by exact city
//   { type: 'neighborhood', neighborhood: <label>,        → filter by neighborhood (within region)
//                           region?: <region-slug> }
//
// Why a separate module from cityProximity.ts: that file's normalizeQuery +
// fuzzyMatchesCity already handle "st pete" → "St. Petersburg" via substring
// fuzzy. The shorthand layer adds the explicit aliases that fuzzy can't
// resolve — airport codes ("fll", "kw"), regional nicknames ("panhandle",
// "first coast", "suncoast"), and neighborhood shorthand ("sobe", "the
// grove", "30a").
//
// Resolution order in callers: shorthand → fuzzy substring → cityProximity
// off-coverage suggestion. Each layer only fires when the previous one
// returns nothing.

import { REGIONS, type RegionDef } from './hyperlocal';
import { normalizeQuery as baseNormalize } from './cityProximity';

// Re-export normalizeQuery for callers — same function, single source of
// truth in cityProximity. Keeping the export here so consumers don't have
// to import from two places when they're already using shorthand.
export const normalizeQuery = baseNormalize;

export type RegionId = RegionDef['slug'];

export type ShorthandResolution =
  | { type: 'region'; region: RegionId }
  | { type: 'city'; city: string }
  | { type: 'neighborhood'; neighborhood: string; region?: RegionId };

interface AliasEntry {
  /** Pre-normalized aliases — normalizeQuery is applied at lookup, not here. */
  aliases: string[];
  /** What the alias resolves to. */
  result: ShorthandResolution;
}

// Order matters only insofar as we want longer / more-specific aliases to
// be tried before shorter ones in the substring-match phase. The exact
// match phase below uses a Map and is order-independent.
const ALIASES: AliasEntry[] = [
  // -----------------------------------------------------------------------
  // City variants — airport codes + spelling variants the existing fuzzy
  // can't resolve. "st pete" / "saint petersburg" already work via fuzzy
  // (they normalize to a substring of "st petersburg") so we don't list
  // them here — fuzzy is fine for those. Listed only the cases fuzzy misses.
  // -----------------------------------------------------------------------
  { aliases: ['fll', 'ft lauderdale', 'fort lauderdale'], result: { type: 'city', city: 'Fort Lauderdale' } },
  { aliases: ['kw', 'key west'],                          result: { type: 'city', city: 'Key West' } },
  { aliases: ['ft myers', 'fort myers'],                  result: { type: 'city', city: 'Fort Myers' } },
  { aliases: ['ami', 'anna maria', 'anna maria island'],  result: { type: 'city', city: 'Anna Maria Island' } },
  { aliases: ['marco', 'marco island'],                   result: { type: 'city', city: 'Marco Island' } },
  { aliases: ['amelia', 'amelia island'],                 result: { type: 'city', city: 'Amelia Island' } },

  // -----------------------------------------------------------------------
  // Neighborhood / sub-area shorthand. "sobe" / "south beach" map to the
  // South Beach neighborhood within Miami; the new Track 2 neighborhood
  // column lets us filter venues that have neighborhood='South Beach'
  // (Surfcomber, Miami Beach Botanical Garden as of v1).
  // "the grove" / "coconut grove" → Coconut Grove (neighborhood OR city —
  // same string in our schema, the listing filters on city contains for
  // the existing flow and on neighborhood= for the new dropdown).
  // -----------------------------------------------------------------------
  { aliases: ['sobe', 'south beach'],     result: { type: 'neighborhood', neighborhood: 'South Beach',     region: 'miami' } },
  { aliases: ['mid beach'],               result: { type: 'neighborhood', neighborhood: 'Mid Beach',       region: 'miami' } },
  { aliases: ['the grove'],               result: { type: 'neighborhood', neighborhood: 'Coconut Grove',   region: 'miami' } },
  { aliases: ['downtown st pete', 'downtown saint pete', 'downtown st petersburg'],
                                          result: { type: 'neighborhood', neighborhood: 'Downtown St. Pete', region: 'tampa-bay' } },

  // -----------------------------------------------------------------------
  // Regional aliases — these route to /venues/in/<region> via redirect.
  // The substring phase below also catches "tampa st pete", "gulf coast
  // south", etc. without listing every permutation.
  // -----------------------------------------------------------------------
  { aliases: ['panhandle', 'florida panhandle', 'emerald coast'],            result: { type: 'region', region: 'panhandle' } },
  { aliases: ['30a', '30 a'],                                                 result: { type: 'region', region: 'panhandle' } },
  { aliases: ['the keys', 'florida keys', 'keys', 'fl keys'],                 result: { type: 'region', region: 'florida-keys' } },
  { aliases: ['tampa bay', 'tampa st pete', 'tampa-st pete', 'tampa st petersburg'],
                                                                              result: { type: 'region', region: 'tampa-bay' } },
  { aliases: ['swfl', 'sw florida', 'southwest florida', 'gulf coast south'], result: { type: 'region', region: 'southwest-florida' } },
  { aliases: ['central florida', 'central fl', 'orlando area', 'i 4 corridor', 'i4 corridor'],
                                                                              result: { type: 'region', region: 'central-florida' } },
  { aliases: ['ne florida', 'northeast florida', 'first coast'],              result: { type: 'region', region: 'northeast-florida' } },
  { aliases: ['sarasota bradenton', 'sarasota-bradenton', 'suncoast'],        result: { type: 'region', region: 'sarasota-bradenton' } },
  { aliases: ['palm beach county', 'palm beaches'],                           result: { type: 'region', region: 'palm-beach' } },
  { aliases: ['broward', 'broward county'],                                   result: { type: 'region', region: 'fort-lauderdale' } },
  { aliases: ['miami dade', 'miami-dade', 'miami dade county'],               result: { type: 'region', region: 'miami' } },
];

// Build the exact-match index. Each alias is normalized through the same
// function callers use, so "Saint Pete!" and "saint-pete" both match the
// same normalized "st pete" key.
const EXACT_INDEX = new Map<string, ShorthandResolution>();
for (const entry of ALIASES) {
  for (const alias of entry.aliases) {
    EXACT_INDEX.set(normalizeQuery(alias), entry.result);
  }
}

// Long-to-short alias list for substring matching, so "30a area" finds the
// "30a" alias without "30" being a stray match against unrelated tokens.
const SUBSTRING_INDEX: Array<{ key: string; result: ShorthandResolution }> =
  ALIASES.flatMap((e) =>
    e.aliases.map((a) => ({ key: normalizeQuery(a), result: e.result }))
  )
    .filter((x) => x.key.length >= 3) // avoid 2-char false positives
    .sort((a, b) => b.key.length - a.key.length);

/**
 * Resolve a free-text query into a region/city/neighborhood navigation
 * intent. Returns null when no shorthand matches — caller should fall
 * through to fuzzy matching and then to cityProximity off-coverage
 * suggestions. Spec is intentionally narrow: only the explicit aliases
 * win; partial English-language city names ("naples", "destin") are NOT
 * shorthand and should fall through to the regular substring filter.
 */
export function resolveShorthand(raw: string): ShorthandResolution | null {
  const norm = normalizeQuery(raw);
  if (!norm) return null;
  // 1) Exact normalized match — covers "st pete", "fll", "panhandle".
  const exact = EXACT_INDEX.get(norm);
  if (exact) return exact;
  // 2) Substring match — handles "i want to look at 30a venues" → "30a".
  // Iterates longest-first so the most specific alias wins (e.g.
  // "central florida" beats "florida" if both were aliases — they aren't,
  // but the principle keeps future additions safe).
  for (const { key, result } of SUBSTRING_INDEX) {
    if (norm.includes(key)) return result;
  }
  return null;
}
