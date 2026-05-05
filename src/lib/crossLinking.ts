// Helpers for the venue ↔ vendor cross-linking sections rendered on
// detail pages. Both queries are server-side, in-memory after a single
// catalog fetch — the catalog is small (~130 venues, ~86 vendors) so a
// scan is faster than another round trip.

import type { Venue, Vendor } from '../types';

/** Lower-case a city for comparison. Empty string when missing. */
function norm(city: string | null | undefined): string {
  return (city ?? '').toLowerCase().trim();
}

/**
 * Vendors who serve a given city. Match on:
 *   1. vendor.address.city == city, OR
 *   2. city ∈ vendor.address.serviceArea (JSONB array of kebab city names)
 *
 * Both are case-insensitive.
 */
export function vendorsServingCity(vendors: Vendor[], city: string): Vendor[] {
  const target = norm(city);
  if (!target) return [];
  return vendors.filter((v) => {
    if (norm(v.address.city) === target) return true;
    const area = (v.address.serviceArea ?? []).map((s) => norm(s));
    return area.includes(target) || area.includes(target.replace(/\s+/g, '-'));
  });
}

/**
 * Venues in a given city. Strict city match — service-area logic is
 * vendor-specific (vendors travel; venues are fixed).
 */
export function venuesInCity(venues: Venue[], city: string): Venue[] {
  const target = norm(city);
  if (!target) return [];
  return venues.filter((v) => norm(v.address.city) === target);
}

/**
 * Diversify a list by a key — first pass takes one per unique key, then
 * fills from the remainder. Used so a "Wedding pros who serve Miami"
 * section doesn't dump six photographers when there are also florists,
 * caterers, and planners available.
 */
export function diversifyByKey<T>(
  items: T[],
  keyOf: (item: T) => string,
  limit: number
): T[] {
  const out: T[] = [];
  const seenKeys = new Set<string>();
  for (const item of items) {
    const key = keyOf(item);
    if (seenKeys.has(key)) continue;
    out.push(item);
    seenKeys.add(key);
    if (out.length >= limit) return out;
  }
  for (const item of items) {
    if (out.includes(item)) continue;
    out.push(item);
    if (out.length >= limit) return out;
  }
  return out;
}
