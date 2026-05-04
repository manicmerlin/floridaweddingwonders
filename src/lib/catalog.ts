// Server-only catalog data layer. RSC + route handlers + sitemap consume
// these. Reads via the anon-key public client; public-SELECT RLS lets the
// queries through.
//
// IMPORTANT: every function returns the existing TS shapes from src/types
// (Venue, Vendor, DressShop) so the rest of the app doesn't need to know
// the catalog now lives in Postgres. The DB→TS mappers handle the gap.
//
// All functions are async — using them in a client component is a build
// error (you can't await in render). That's the implicit guard against
// accidental client-side imports.

import { createSupabasePublicClient } from './supabaseServer';
import { compareByTier } from './tierFeatures';
import type {
  Venue,
  Vendor,
  DressShop,
  VenueImage,
  DressShopImage,
  VendorImage,
} from '../types';

// ---------------------------------------------------------------------------
// Email synthesis (backward compat with Phase 1 inquiry flow)
// ---------------------------------------------------------------------------

/**
 * Mirrors src/lib/inquiryValidation.ts's expected shape. When a venue has no
 * real email on file, we synthesize the same `info@<slug>.com` form the
 * inquiry route's auto-detection knows about, so that route correctly diverts
 * the lead to the fallback inbox without needing a code change.
 */
function synthesizeVenueEmail(name: string): string {
  const slug = (name || 'venue')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `info@${slug}.com`;
}

// ---------------------------------------------------------------------------
// Mappers — DB row -> existing TS type
// ---------------------------------------------------------------------------

function mapVenueImages(images: unknown): VenueImage[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((img, i) => ({
      id: String(img.id ?? `img-${i}`),
      url: String(img.url ?? ''),
      alt: String(img.alt ?? ''),
      isPrimary: Boolean(img.isPrimary ?? i === 0),
      type: 'image' as const,
    }));
}

function mapDressShopImages(images: unknown): DressShopImage[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((img, i) => ({
      id: String(img.id ?? `img-${i}`),
      url: String(img.url ?? ''),
      alt: String(img.alt ?? ''),
      isPrimary: Boolean(img.isPrimary ?? i === 0),
    }));
}

function mapVendorImages(images: unknown): VendorImage[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((img, i) => ({
      id: String(img.id ?? `img-${i}`),
      url: String(img.url ?? ''),
      alt: String(img.alt ?? ''),
      isPrimary: Boolean(img.isPrimary ?? i === 0),
    }));
}

interface VenueRow {
  id: string;
  legacy_id: string | null;
  slug: string;
  tier: 'starter' | 'growth' | 'scale';
  tier_expires_at: string | null;
  name: string;
  description: string | null;
  city: string | null;
  region: string | null;
  state: string;
  capacity_min: number | null;
  capacity_max: number | null;
  capacity_text: string | null;
  size_category: string | null;
  venue_type: string | null;
  price_min: number | null;
  price_text: string | null;
  amenities: unknown;
  tags: unknown;
  images: unknown;
  ceremony_and_reception: boolean | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_email_real: boolean;
  contact_website: string | null;
  gallery_url: string | null;
  address_street: string | null;
  address_zip: string | null;
  coordinates: { lat?: number; lng?: number } | null;
  external_reviews: unknown;
  last_image_update: string | null;
  created_at: string;
  updated_at: string;
}

function rowToVenue(row: VenueRow): Venue {
  const realEmail = row.contact_email_real && row.contact_email ? row.contact_email : null;
  const email = realEmail ?? synthesizeVenueEmail(row.name);

  const venueType = (row.venue_type as Venue['venueType']) || 'ballroom';

  const amenities = Array.isArray(row.amenities) ? (row.amenities as string[]) : [];
  const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];

  // Phase 1 / Phase 0 mockData wrote randomised review numbers per render.
  // Now those are stable null values from the DB, but the existing UI
  // expects the field to exist with safe defaults.
  const externalReviews =
    row.external_reviews && typeof row.external_reviews === 'object'
      ? (row.external_reviews as Venue['externalReviews'])
      : undefined;

  return {
    id: row.legacy_id ?? row.id,
    slug: row.slug,
    uuid: row.id,
    tier: row.tier,
    tierExpiresAt: row.tier_expires_at,
    name: row.name,
    description: row.description ?? '',
    venueType,
    address: {
      street: row.address_street ?? '',
      city: row.city ?? '',
      state: row.state || 'FL',
      zipCode: row.address_zip ?? '',
      coordinates:
        row.coordinates &&
        typeof row.coordinates.lat === 'number' &&
        typeof row.coordinates.lng === 'number'
          ? { lat: row.coordinates.lat, lng: row.coordinates.lng }
          : undefined,
    },
    capacity: {
      min: row.capacity_min ?? 50,
      max: row.capacity_max ?? 150,
    },
    pricing: {
      startingPrice: row.price_min ?? 0,
      packages: [],
    },
    amenities,
    tags,
    images: mapVenueImages(row.images),
    contact: {
      email,
      phone: row.contact_phone ?? '',
      website: row.contact_website ?? undefined,
    },
    owner: {
      id: `owner-${row.legacy_id ?? row.id}`,
      name: '',
      email: '',
      isPremium: false,
    },
    availability: [],
    reviews: { rating: 0, count: 0, reviews: [] },
    externalReviews,
    claimStatus: 'unclaimed',
  } satisfies Venue;
}

interface VendorRow {
  id: string;
  legacy_id: string | null;
  slug: string;
  name: string;
  business_name: string | null;
  description: string | null;
  category: string;
  subcategory: string | null;
  city: string | null;
  state: string;
  service_area: unknown;
  contact_phone: string | null;
  contact_email: string | null;
  contact_email_real: boolean;
  contact_website: string | null;
  social_media: unknown;
  images: unknown;
  specialties: unknown;
  tags: unknown;
  price_range: string | null;
  created_at: string;
  updated_at: string;
}

function rowToVendor(row: VendorRow): Vendor {
  const serviceArea = Array.isArray(row.service_area) ? (row.service_area as string[]) : [];
  const specialties = Array.isArray(row.specialties) ? (row.specialties as string[]) : [];
  const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
  const social = (row.social_media as Vendor['contact']['socialMedia']) || undefined;

  return {
    id: row.legacy_id ?? row.id,
    slug: row.slug,
    uuid: row.id,
    name: row.name,
    businessName: row.business_name ?? undefined,
    description: row.description ?? '',
    category: row.category as Vendor['category'],
    subcategory: row.subcategory ?? undefined,
    address: {
      city: row.city ?? '',
      state: row.state || 'FL',
      serviceArea,
    },
    priceRange: { min: 0, max: 0 },
    specialties,
    tags,
    images: mapVendorImages(row.images),
    contact: {
      email: row.contact_email ?? '',
      phone: row.contact_phone ?? '',
      website: row.contact_website ?? undefined,
      socialMedia: social,
    },
    owner: {
      id: `owner-${row.legacy_id ?? row.id}`,
      name: '',
      isPremium: false,
    },
    availability: {},
    services: [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  } satisfies Vendor;
}

interface DressShopRow {
  id: string;
  legacy_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  shop_type: string | null;
  city: string | null;
  state: string;
  address_street: string | null;
  address_zip: string | null;
  coordinates: { lat?: number; lng?: number } | null;
  price_min: number | null;
  price_max: number | null;
  specialties: unknown;
  tags: unknown;
  images: unknown;
  brands: unknown;
  services: unknown;
  hours: unknown;
  contact_phone: string | null;
  contact_email: string | null;
  contact_email_real: boolean;
  contact_website: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

function rowToDressShop(row: DressShopRow): DressShop {
  const specialties = Array.isArray(row.specialties) ? (row.specialties as string[]) : [];
  const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
  const brands = Array.isArray(row.brands) ? (row.brands as string[]) : [];
  const services = Array.isArray(row.services) ? (row.services as string[]) : [];
  const hours =
    row.hours && typeof row.hours === 'object'
      ? (row.hours as Record<string, string>)
      : {};

  return {
    id: row.legacy_id ?? row.id,
    slug: row.slug,
    uuid: row.id,
    name: row.name,
    description: row.description ?? '',
    address: {
      street: row.address_street ?? '',
      city: row.city ?? '',
      state: row.state || 'FL',
      zipCode: row.address_zip ?? '',
      coordinates:
        row.coordinates &&
        typeof row.coordinates.lat === 'number' &&
        typeof row.coordinates.lng === 'number'
          ? { lat: row.coordinates.lat, lng: row.coordinates.lng }
          : undefined,
    },
    priceRange: {
      min: row.price_min ?? 0,
      max: row.price_max ?? 0,
    },
    shopType: (row.shop_type as DressShop['shopType']) || 'boutique',
    specialties,
    tags,
    images: mapDressShopImages(row.images),
    contact: {
      email: row.contact_email ?? '',
      phone: row.contact_phone ?? '',
      website: row.contact_website ?? undefined,
    },
    owner: {
      id: `owner-${row.legacy_id ?? row.id}`,
      name: '',
      isPremium: row.is_premium,
    },
    hours,
    services,
    brands,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  } satisfies DressShop;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const VENUE_SELECT = '*';
const VENDOR_SELECT = '*';
const DRESS_SHOP_SELECT = '*';

export interface VenueFilters {
  city?: string;
  venueType?: Venue['venueType'];
  search?: string;
}

/**
 * Returns the set of venue UUIDs that have an active ownership record.
 * "Claimed" = at least one row in venue_ownerships joined with an active
 * venue_owner. The owner_id FK is to venue_owners (which has a status
 * column); the join is permissive — if we can't read venue_owners due to
 * RLS or a missing FK, we still treat the existence of the ownership row
 * as a claim, since RLS is defense-in-depth and a stale ownership row
 * implies a real claim happened.
 */
export async function getClaimedVenueIds(): Promise<Set<string>> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('venue_ownerships')
    .select('venue_id, venue_owners(status)');
  if (error) {
    // Don't fail the page on this — log and degrade to "no claims yet,"
    // which means everyone shows watercolor (the safe default for the
    // "show until claimed" rule).
    console.error('getClaimedVenueIds error:', error.message);
    return new Set();
  }
  const claimed = new Set<string>();
  for (const row of data ?? []) {
    const ownerStatus = (row as { venue_owners?: { status?: string } | null }).venue_owners?.status;
    // status undefined when join fails; treat as active per the comment above.
    if (ownerStatus === undefined || ownerStatus === 'active') {
      const vid = (row as { venue_id?: string }).venue_id;
      if (vid) claimed.add(vid);
    }
  }
  return claimed;
}

/**
 * Annotate a list of venues with `isClaimed`. Pass-through helper called
 * from page.tsx so the listing query stays in catalog.ts and pages don't
 * need to know about the venue_ownerships table.
 */
export async function decorateVenuesWithClaims(venues: Venue[]): Promise<Venue[]> {
  const claimedIds = await getClaimedVenueIds();
  return venues.map((v) => ({ ...v, isClaimed: v.uuid ? claimedIds.has(v.uuid) : false }));
}

export async function getVenues(opts: {
  filters?: VenueFilters;
  limit?: number;
  offset?: number;
} = {}): Promise<Venue[]> {
  const supabase = createSupabasePublicClient();
  let q = supabase.from('venues').select(VENUE_SELECT).order('name', { ascending: true });
  if (opts.filters?.city) q = q.eq('city', opts.filters.city);
  if (opts.filters?.venueType) q = q.eq('venue_type', opts.filters.venueType);
  if (opts.limit) q = q.limit(opts.limit);
  if (opts.offset && opts.limit) q = q.range(opts.offset, opts.offset + opts.limit - 1);
  const { data, error } = await q;
  if (error) {
    console.error('getVenues error:', error);
    return [];
  }
  const rows = (data ?? []) as VenueRow[];
  let venues = rows.map(rowToVenue);
  // Search filtered post-fetch — Postgres full-text on small set isn't worth
  // the index cost yet. <200 rows, in-memory is faster than another query.
  if (opts.filters?.search) {
    const q2 = opts.filters.search.toLowerCase();
    venues = venues.filter(
      (v) =>
        v.name.toLowerCase().includes(q2) ||
        v.description.toLowerCase().includes(q2) ||
        v.address.city.toLowerCase().includes(q2)
    );
  }
  // Paid tiers first (scale > growth > starter), then alpha within tier.
  // Phase 3A — see src/lib/tierFeatures.ts for the weights.
  venues.sort(compareByTier);
  return venues;
}

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('venues')
    .select(VENUE_SELECT)
    .eq('slug', slug)
    .maybeSingle();
  if (error) {
    console.error('getVenueBySlug error:', error);
    return null;
  }
  return data ? rowToVenue(data as VenueRow) : null;
}

export async function getVenueByLegacyId(legacyId: string): Promise<Venue | null> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('venues')
    .select(VENUE_SELECT)
    .eq('legacy_id', legacyId)
    .maybeSingle();
  if (error) {
    console.error('getVenueByLegacyId error:', error);
    return null;
  }
  return data ? rowToVenue(data as VenueRow) : null;
}

export async function getVendors(opts: {
  category?: string;
  search?: string;
  limit?: number;
} = {}): Promise<Vendor[]> {
  const supabase = createSupabasePublicClient();
  let q = supabase.from('vendors').select(VENDOR_SELECT).order('name', { ascending: true });
  if (opts.category) q = q.eq('category', opts.category);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) {
    console.error('getVendors error:', error);
    return [];
  }
  const rows = (data ?? []) as VendorRow[];
  let vendors = rows.map(rowToVendor);
  if (opts.search) {
    const q2 = opts.search.toLowerCase();
    vendors = vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q2) ||
        v.description.toLowerCase().includes(q2) ||
        v.address.city.toLowerCase().includes(q2)
    );
  }
  return vendors;
}

export async function getVendorBySlug(slug: string): Promise<Vendor | null> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('vendors')
    .select(VENDOR_SELECT)
    .eq('slug', slug)
    .maybeSingle();
  if (error) {
    console.error('getVendorBySlug error:', error);
    return null;
  }
  return data ? rowToVendor(data as VendorRow) : null;
}

export async function getVendorByLegacyId(legacyId: string): Promise<Vendor | null> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('vendors')
    .select(VENDOR_SELECT)
    .eq('legacy_id', legacyId)
    .maybeSingle();
  if (error) {
    console.error('getVendorByLegacyId error:', error);
    return null;
  }
  return data ? rowToVendor(data as VendorRow) : null;
}

export async function getDressShops(opts: {
  shopType?: string;
  search?: string;
  limit?: number;
} = {}): Promise<DressShop[]> {
  const supabase = createSupabasePublicClient();
  let q = supabase.from('dress_shops').select(DRESS_SHOP_SELECT).order('name', { ascending: true });
  if (opts.shopType) q = q.eq('shop_type', opts.shopType);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) {
    console.error('getDressShops error:', error);
    return [];
  }
  const rows = (data ?? []) as DressShopRow[];
  let shops = rows.map(rowToDressShop);
  if (opts.search) {
    const q2 = opts.search.toLowerCase();
    shops = shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q2) ||
        s.description.toLowerCase().includes(q2) ||
        s.address.city.toLowerCase().includes(q2)
    );
  }
  return shops;
}

export async function getDressShopBySlug(slug: string): Promise<DressShop | null> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('dress_shops')
    .select(DRESS_SHOP_SELECT)
    .eq('slug', slug)
    .maybeSingle();
  if (error) {
    console.error('getDressShopBySlug error:', error);
    return null;
  }
  return data ? rowToDressShop(data as DressShopRow) : null;
}

export async function getDressShopByLegacyId(legacyId: string): Promise<DressShop | null> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('dress_shops')
    .select(DRESS_SHOP_SELECT)
    .eq('legacy_id', legacyId)
    .maybeSingle();
  if (error) {
    console.error('getDressShopByLegacyId error:', error);
    return null;
  }
  return data ? rowToDressShop(data as DressShopRow) : null;
}

/**
 * Live row counts for homepage stat block. `head: true` skips returning
 * rows; only the count comes back. Three queries run in parallel.
 */
export async function getSiteStatsLive(): Promise<{
  venues: number;
  vendors: number;
  dressShops: number;
}> {
  const supabase = createSupabasePublicClient();
  const [venues, vendors, dressShops] = await Promise.all([
    supabase.from('venues').select('*', { count: 'exact', head: true }),
    supabase.from('vendors').select('*', { count: 'exact', head: true }),
    supabase.from('dress_shops').select('*', { count: 'exact', head: true }),
  ]);
  return {
    venues: venues.count ?? 0,
    vendors: vendors.count ?? 0,
    dressShops: dressShops.count ?? 0,
  };
}

/**
 * Lightweight slug list for sitemap / static-params generation. Avoids
 * pulling full row payloads.
 */
export async function getAllVenueSlugs(): Promise<{ slug: string; legacy_id: string | null; updated_at: string }[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('venues')
    .select('slug, legacy_id, updated_at');
  if (error) return [];
  return (data ?? []) as any;
}

export async function getAllVendorSlugs(): Promise<{ slug: string; legacy_id: string | null; updated_at: string }[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('vendors')
    .select('slug, legacy_id, updated_at');
  if (error) return [];
  return (data ?? []) as any;
}

export async function getAllDressShopSlugs(): Promise<{ slug: string; legacy_id: string | null; updated_at: string }[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('dress_shops')
    .select('slug, legacy_id, updated_at');
  if (error) return [];
  return (data ?? []) as any;
}
