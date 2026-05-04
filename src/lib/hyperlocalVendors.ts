// Vendor hyperlocal taxonomy + filter helpers — mirrors src/lib/hyperlocal.ts
// for the vendor side of the catalog.
//
// Routes that consume this file:
//   /vendors/category/[category]              — all vendors in a category
//   /vendors/in/[region]                       — all vendors in a region
//   /vendors/in/[region]/[category]            — region × category intersection
//
// Regions are reused from hyperlocal.ts — vendors and venues share the same
// city → region mapping (a Miami photographer is in the Miami region just
// like a Miami venue), so there's no point maintaining two lists.
//
// Categories are pulled directly from the DB enum. The Vendor type union in
// src/types is slightly out of sync with the DB (it lists `decorator`/`dj`/
// `band`/`other` but the DB actually has `rentals`); we match by string here
// so the route layer is unaffected by that.

import type { Vendor } from '../types';
import { REGIONS, type RegionDef, venueInRegion } from './hyperlocal';

export { REGIONS };
export type { RegionDef };

export interface VendorCategoryDef {
  /** URL slug — kebab-case. */
  slug: string;
  /** DB column value to match against `vendor.category`. */
  value: string;
  /** Title-case display name (singular). */
  name: string;
  /** Plural display label used in headings ("Wedding Photographers in Miami"). */
  pluralName: string;
  /** Lowercase noun used in body copy ("photographer", "wedding planner"). */
  bodyNoun: string;
  /** A short hand-written intro phrase that opens the description copy. */
  flavor: string;
}

export const VENDOR_CATEGORIES: VendorCategoryDef[] = [
  {
    slug: 'photographer',
    value: 'photographer',
    name: 'Photographer',
    pluralName: 'Photographers',
    bodyNoun: 'wedding photographer',
    flavor:
      'A great wedding photographer reads the room, anticipates moments, and delivers a gallery you actually want to live with for decades — not just for the gram',
  },
  {
    slug: 'videographer',
    value: 'videographer',
    name: 'Videographer',
    pluralName: 'Videographers',
    bodyNoun: 'wedding videographer',
    flavor:
      'Cinematic edits, drone footage, same-day teasers — the right videographer captures motion, sound, and atmosphere in a way photos can’t',
  },
  {
    slug: 'florist',
    value: 'florist',
    name: 'Florist',
    pluralName: 'Florists',
    bodyNoun: 'wedding florist',
    flavor:
      'Bouquets, arches, centerpieces, and ceremony installations — a Florida florist who knows how peonies handle 90% humidity is worth their weight in roses',
  },
  {
    slug: 'caterer',
    value: 'caterer',
    name: 'Caterer',
    pluralName: 'Caterers',
    bodyNoun: 'wedding caterer',
    flavor:
      'From tasting menus to family-style farm tables, the caterer sets the tone of your reception more than any other vendor — guests forget the playlist, never the meal',
  },
  {
    slug: 'baker',
    value: 'baker',
    name: 'Baker',
    pluralName: 'Cake Designers',
    bodyNoun: 'wedding cake designer',
    flavor:
      'Tiered showpieces, croquembouche, gluten-free everything, dessert tables that double as photo ops — Florida bakers know what holds up in the heat',
  },
  {
    slug: 'planner',
    value: 'planner',
    name: 'Planner',
    pluralName: 'Wedding Planners',
    bodyNoun: 'wedding planner',
    flavor:
      'Full-service, month-of, day-of — a planner is the difference between enjoying your wedding and managing it. Every couple we know who hired one says it was the single best line item',
  },
  {
    slug: 'rentals',
    value: 'rentals',
    name: 'Rentals',
    pluralName: 'Rental Companies',
    bodyNoun: 'rental supplier',
    flavor:
      'Tents, dance floors, lounge furniture, china, glassware, linens — the right rentals turn a raw venue into a finished room. Especially essential for outdoor Florida ceremonies',
  },
  {
    slug: 'transportation',
    value: 'transportation',
    name: 'Transportation',
    pluralName: 'Transportation Providers',
    bodyNoun: 'transportation provider',
    flavor:
      'Trolleys, party buses, vintage cars, and shuttle services that keep the bridal party on schedule and let guests skip the rideshare scramble',
  },
  {
    slug: 'officiant',
    value: 'officiant',
    name: 'Officiant',
    pluralName: 'Officiants',
    bodyNoun: 'wedding officiant',
    flavor:
      'Religious, secular, bilingual, brief, ceremonial — your officiant is the one person whose voice everyone hears, so it pays to find someone whose tone fits yours',
  },
  {
    slug: 'hair-makeup',
    value: 'hair-makeup',
    name: 'Hair & Makeup',
    pluralName: 'Hair & Makeup Artists',
    bodyNoun: 'hair and makeup artist',
    flavor:
      'On-location styling for the bridal party, airbrush makeup that survives a Florida ceremony, and a touch-up artist who stays through the first dance',
  },
  {
    slug: 'entertainment',
    value: 'entertainment',
    name: 'Entertainment',
    pluralName: 'Entertainment Providers',
    bodyNoun: 'entertainment provider',
    flavor:
      'DJs who read the floor, live bands that nail your first dance, photo booths, fire dancers, mariachis — entertainment is what guests remember',
  },
  {
    slug: 'lighting',
    value: 'lighting',
    name: 'Lighting',
    pluralName: 'Lighting Designers',
    bodyNoun: 'lighting designer',
    flavor:
      'String lights for tropical-garden ceremonies, gobos with your monogram, dance-floor washes, uplighting that flatters the architecture — lighting is the cheapest path to a high-end-looking reception',
  },
  {
    slug: 'stationery',
    value: 'stationery',
    name: 'Stationery',
    pluralName: 'Stationers',
    bodyNoun: 'wedding stationer',
    flavor:
      'Save-the-dates, invitations, programs, menus, place cards, signage — stationery is the first thing guests see and the last thing they keep',
  },
  {
    slug: 'jewelry',
    value: 'jewelry',
    name: 'Jewelry',
    pluralName: 'Jewelers',
    bodyNoun: 'wedding jeweler',
    flavor:
      'Custom rings, heirloom resets, day-of accessories, and the kind of insurance-grade documentation you actually want before the honeymoon',
  },
];

export function getVendorCategoryBySlug(slug: string): VendorCategoryDef | undefined {
  return VENDOR_CATEGORIES.find((c) => c.slug === slug);
}

export function vendorCategorySlugs(): string[] {
  return VENDOR_CATEGORIES.map((c) => c.slug);
}

/** Match a vendor against a region by lowercased city — same rule as venues. */
export function vendorInRegion(vendor: Vendor, region: RegionDef): boolean {
  // venueInRegion takes a Venue with `address.city`; Vendor has the same
  // shape so the duck-typed reuse works.
  return venueInRegion(vendor as unknown as Parameters<typeof venueInRegion>[0], region);
}

export function filterVendorsByRegion(vendors: Vendor[], region: RegionDef): Vendor[] {
  return vendors.filter((v) => vendorInRegion(v, region));
}

export function filterVendorsByCategory(
  vendors: Vendor[],
  category: VendorCategoryDef
): Vendor[] {
  return vendors.filter((v) => v.category === category.value);
}

export function filterVendorsByRegionAndCategory(
  vendors: Vendor[],
  region: RegionDef,
  category: VendorCategoryDef
): Vendor[] {
  return vendors.filter(
    (v) => vendorInRegion(v, region) && v.category === category.value
  );
}

/**
 * Top vendor categories within a region, used in body copy
 * ("Top categories: photography, planning, florals").
 */
export function topCategoriesInRegion(
  vendors: Vendor[],
  region: RegionDef,
  k = 3
): { category: VendorCategoryDef; count: number }[] {
  const list = filterVendorsByRegion(vendors, region);
  const counts = new Map<string, number>();
  for (const v of list) {
    counts.set(v.category, (counts.get(v.category) ?? 0) + 1);
  }
  return VENDOR_CATEGORIES
    .map((c) => ({ category: c, count: counts.get(c.value) ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, k);
}
