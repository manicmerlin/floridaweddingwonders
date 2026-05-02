// Phase 4 — hyperlocal landing pages.
//
// Defines the region/type taxonomy used by /venues/in/[region],
// /venues/style/[type], and /venues/in/[region]/[type]. Slugs are chosen
// based on what real couples actually search ("Miami wedding venues" not
// "Miami-Dade County wedding venues"), then we aggregate the catalog
// cities under each slug.
//
// All matching is done in-memory after the catalog query — total venue
// count is small (~130) and these pages are SSG'd.

import type { Venue } from '../types';

export interface RegionDef {
  slug: string;
  /** "Miami", "the Florida Keys" — used after "Wedding Venues in ___" */
  name: string;
  /** Used in body copy for descriptions, e.g. "Miami's wedding scene" */
  shortName: string;
  /** Lowercase city names that belong to this region. Source data uses
   *  city in `location.split(",")[0]`. */
  cities: string[];
  /** A short hand-written intro phrase that opens the description copy. */
  flavor: string;
}

export const REGIONS: RegionDef[] = [
  {
    slug: 'miami',
    name: 'Miami',
    shortName: 'Miami',
    cities: [
      'miami',
      'miami beach',
      'north miami beach',
      'south beach',
      'coconut grove',
      'coral gables',
      'downtown miami',
      'wynwood',
      'aventura',
      'key biscayne',
      'cutler bay',
      'palmetto bay',
      'miami springs',
      'hialeah',
      'homestead',
      'redland',
      'miami/fort lauderdale',
    ],
    flavor:
      'From Coconut Grove gardens to South Beach rooftops, Miami offers some of the most photogenic wedding venues in the country',
  },
  {
    slug: 'fort-lauderdale',
    name: 'Fort Lauderdale',
    shortName: 'Fort Lauderdale',
    cities: [
      'fort lauderdale',
      'hollywood',
      'sunrise',
      'pompano beach',
      'davie',
      'plantation',
      'deerfield beach',
      'weston',
      'parkland',
    ],
    flavor:
      'Broward County blends intracoastal waterfront, manicured estates, and convention-grade ballrooms — flexible options at every guest count',
  },
  {
    slug: 'florida-keys',
    name: 'the Florida Keys',
    shortName: 'the Keys',
    cities: [
      'key west',
      'islamorada',
      'key largo',
      'marathon',
      'stock island',
      'duck key',
    ],
    flavor:
      'A wedding in the Keys means turquoise water, pastel sunsets, and a guest list that arrives ready for sandals and rosé — the most distinctly Florida ceremony you can host',
  },
  {
    slug: 'palm-beach',
    name: 'Palm Beach',
    shortName: 'Palm Beach',
    cities: [
      'palm beach',
      'west palm beach',
      'palm beach gardens',
      'jupiter',
      'delray beach',
      'boca raton',
      'wellington',
      'manalapan',
      'riviera beach',
      'palm beach county',
    ],
    flavor:
      'Palm Beach County’s estate weddings, oceanfront resorts, and historic clubs are the closest Florida gets to a Hamptons aesthetic',
  },
  {
    slug: 'naples',
    name: 'Naples',
    shortName: 'Naples',
    cities: ['naples', 'marco island', 'bonita springs'],
    flavor:
      'Gulf-coast sunsets, beach-club elegance, and an unhurried Old Florida feel define the Naples wedding experience',
  },
  {
    slug: 'fort-myers',
    name: 'Fort Myers',
    shortName: 'Fort Myers',
    cities: [
      'fort myers',
      'fort myers beach',
      'sanibel island',
      'cape coral',
      'captiva island',
      'estero',
    ],
    flavor:
      'The Fort Myers area’s barrier islands and waterfront resorts trade Miami’s glamour for a quieter, family-friendly coastal wedding',
  },
];

export interface VenueTypeDef {
  slug: string;
  /** Internal Venue.venueType value */
  value: Venue['venueType'];
  /** "Beach", "Garden", "Historic" — Title Case */
  name: string;
  flavor: string;
}

export const VENUE_TYPES: VenueTypeDef[] = [
  {
    slug: 'beach',
    value: 'beach',
    name: 'Beach',
    flavor:
      'Sand-aisle ceremonies, sunset receptions, and the kind of unforced romance that makes guests forget the heat',
  },
  {
    slug: 'garden',
    value: 'garden',
    name: 'Garden',
    flavor:
      'Mature trees, manicured lawns, and orchid-filled greenhouses — a garden venue makes the florist’s job easy and the photographer’s easier',
  },
  {
    slug: 'ballroom',
    value: 'ballroom',
    name: 'Ballroom',
    flavor:
      'Climate-controlled, capacity-scalable, and dressed up exactly the way you imagine — the format that always works',
  },
  {
    slug: 'historic',
    value: 'historic',
    name: 'Historic',
    flavor:
      'Restored mansions, century-old hotels, and grand civic buildings — venues with a story already half-written',
  },
  {
    slug: 'modern',
    value: 'modern',
    name: 'Modern',
    flavor:
      'Industrial-chic spaces, glass-walled penthouses, and minimalist galleries for couples who want their decor to be the design',
  },
  {
    slug: 'rustic',
    value: 'rustic',
    name: 'Rustic',
    flavor:
      'Barns, ranches, and farm tables under string lights — the warmest option when you want guests dancing in their boots',
  },
];

export function getRegionBySlug(slug: string): RegionDef | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

export function getVenueTypeBySlug(slug: string): VenueTypeDef | undefined {
  return VENUE_TYPES.find((t) => t.slug === slug);
}

export function regionSlugs(): string[] {
  return REGIONS.map((r) => r.slug);
}

export function venueTypeSlugs(): string[] {
  return VENUE_TYPES.map((t) => t.slug);
}

/** Match a venue against a region by lowercased city. */
export function venueInRegion(venue: Venue, region: RegionDef): boolean {
  const city = (venue.address.city || '').toLowerCase().trim();
  if (!city) return false;
  return region.cities.includes(city);
}

export function filterVenuesByRegion(venues: Venue[], region: RegionDef): Venue[] {
  return venues.filter((v) => venueInRegion(v, region));
}

export function filterVenuesByType(
  venues: Venue[],
  type: VenueTypeDef
): Venue[] {
  return venues.filter((v) => v.venueType === type.value);
}

export function filterVenuesByRegionAndType(
  venues: Venue[],
  region: RegionDef,
  type: VenueTypeDef
): Venue[] {
  return venues.filter(
    (v) => venueInRegion(v, region) && v.venueType === type.value
  );
}

/**
 * Returns the (region, type) combos with at least `minCount` venues.
 * Used by sitemap and generateStaticParams to skip empty/sparse pages.
 */
export function combosWithCoverage(
  venues: Venue[],
  minCount = 3
): { region: RegionDef; type: VenueTypeDef; count: number }[] {
  const out: { region: RegionDef; type: VenueTypeDef; count: number }[] = [];
  for (const region of REGIONS) {
    for (const type of VENUE_TYPES) {
      const count = filterVenuesByRegionAndType(venues, region, type).length;
      if (count >= minCount) out.push({ region, type, count });
    }
  }
  return out;
}

/** Top venue types within a region, used in body copy ("Top types: ..."). */
export function topTypesInRegion(
  venues: Venue[],
  region: RegionDef,
  k = 3
): { type: VenueTypeDef; count: number }[] {
  const list = filterVenuesByRegion(venues, region);
  const counts = new Map<string, number>();
  for (const v of list) {
    counts.set(v.venueType, (counts.get(v.venueType) ?? 0) + 1);
  }
  return VENUE_TYPES
    .map((t) => ({ type: t, count: counts.get(t.value) ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, k);
}

/**
 * Average starting-price band across a venue list, used in landing-page copy.
 * Returns nulls when too few venues have a price set.
 */
export function priceBandFromVenues(venues: Venue[]): {
  min: number;
  max: number;
} | null {
  const prices = venues
    .map((v) => v.pricing.startingPrice)
    .filter((n): n is number => typeof n === 'number' && n > 0);
  if (prices.length < 3) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function formatPriceBand(band: { min: number; max: number }): string {
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
  return `${fmt(band.min)}–${fmt(band.max)}`;
}
