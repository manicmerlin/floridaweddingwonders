/**
 * Catalog migration script
 *
 * Reads the JSON files in src/data/ and upserts the rows into Supabase
 * (venues, vendors, dress_shops). Idempotent on legacy_id — re-running
 * never duplicates and never re-rolls slugs that have already been chosen.
 *
 * USAGE
 *
 *   # Surface what we'd write without touching Supabase:
 *   npx tsx scripts/migrate-catalog.ts --dry-run
 *
 *   # Actually run against Supabase (requires service role):
 *   npx tsx scripts/migrate-catalog.ts
 *
 * REQUIREMENTS
 *
 *   .env.local must have:
 *     NEXT_PUBLIC_SUPABASE_URL=...
 *     SUPABASE_SERVICE_ROLE_KEY=...   (NOT the anon key — needs RLS bypass)
 *
 * IDEMPOTENCY MODEL
 *
 *   Slugs are stable. Existing rows keep their slug forever, even if the
 *   row is updated with a new name/city. Only NEW legacy_ids get freshly
 *   generated slugs.
 *
 *   Upsert key is `legacy_id`. Re-running with the same JSON is a no-op
 *   (well, the updated_at column ticks but the data is unchanged).
 *
 * LOG
 *
 *   Every run appends to ./migration.log with:
 *   - timestamp
 *   - per-table counts (inserted, updated, skipped)
 *   - every slug generated this run, with any dedup resolution
 */

import { readFileSync, appendFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

loadEnv({ path: resolve(process.cwd(), '.env.local') });
loadEnv(); // fall through to .env if .env.local missing

const DRY_RUN = process.argv.includes('--dry-run');
const PREVIEW_ONLY = process.argv.includes('--preview-slugs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient | null = null;
if (!DRY_RUN && !PREVIEW_ONLY) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    fail(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.\n' +
        'For a no-op preview run with --dry-run.'
    );
  }
  supabase = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const log: string[] = [];
function logline(s: string) {
  log.push(s);
  console.log(s);
}
function fail(msg: string): never {
  console.error('ERROR:', msg);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

/**
 * URL-safe kebab. Decomposes accents, lowercases, drops apostrophes, replaces
 * `&` with the word "and", maps everything else non-alphanumeric to `-`,
 * collapses runs, trims leading/trailing.
 *
 * Examples:
 *   "The St. Regis Bal Harbour"            → "the-st-regis-bal-harbour"
 *   "Schnebly Redland's Winery & Brewery"  → "schnebly-redlands-winery-and-brewery"
 *   "Cafés del Mar"                        → "cafes-del-mar"
 *   "The Foundry (Coral Gables)"           → "the-foundry-coral-gables"
 */
export function slugify(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Venue slug = kebab(name)-kebab(city). Names are usually distinctive enough
 * on their own, but appending the city avoids collisions across cities AND
 * gives a small SEO boost for "<venue> <city> wedding" queries.
 */
function venueSlugFor(name: string, city: string): string {
  const n = slugify(name);
  const c = slugify(city);
  if (!c || n.endsWith('-' + c) || n === c) return n;
  return `${n}-${c}`;
}

/** Vendors and dress shops already ship kebab-case ids. Run through slugify
 *  for safety in case any have unexpected chars. */
function entitySlugFor(name: string, city: string, existingId: string | undefined): string {
  if (existingId && /^[a-z0-9-]+$/.test(existingId)) return existingId;
  return venueSlugFor(name, city);
}

/**
 * Extract the city name from venues.json's free-text `location` field.
 * Most entries are "City, County" but a handful are full street addresses
 * ("100 E 32nd St, Hialeah, FL 33013"). Skip segments that look like street
 * addresses, ZIP codes, or state codes.
 */
function extractCityFromLocation(location: string | null | undefined): string {
  if (!location) return '';
  const parts = location.split(',').map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    if (/^\d/.test(p)) continue;                                // starts with digit (street# or zip)
    if (/\b(St|Ave|Rd|Blvd|Dr|Way|Ln|Pl|Hwy|Pkwy|Ct|Cir)\b/i.test(p)) continue; // street suffix
    if (/^[A-Z]{2}(\s+\d|$)/.test(p)) continue;                 // state code like "FL 33013"
    // Slashes in city like "Miami/Fort Lauderdale" — keep only the first half
    return p.split('/')[0].trim();
  }
  return parts[parts.length - 1] || '';
}

/** Resolve uniqueness by appending -2, -3, ... if needed. Mutates the set. */
function ensureUnique(slug: string, taken: Set<string>): string {
  if (!taken.has(slug)) {
    taken.add(slug);
    return slug;
  }
  for (let i = 2; i < 1000; i++) {
    const candidate = `${slug}-${i}`;
    if (!taken.has(candidate)) {
      taken.add(candidate);
      return candidate;
    }
  }
  throw new Error(`Slug uniqueness exhausted for "${slug}"`);
}

// ---------------------------------------------------------------------------
// JSON parsers (capacity / pricing / email-real)
// ---------------------------------------------------------------------------

function parseCapacity(text: string | null | undefined): {
  min: number | null;
  max: number | null;
} {
  // Phase 4 fix: the previous parser took numbers[0] as min and the LAST
  // captured number as max. For Hialeah Park's source text
  //   "Multiple venues: Ballroom (450 banquet/500 reception),
  //    Clubhouse (600 banquet/1,000 reception), ..., Director's Room (50 reception)"
  // that picked "450" as min and "50" as max → "450-50" rendered.
  // Compounding: "1,000" emitted "000" → parseInt("000")===0 polluting the array.
  //
  // New behavior:
  //   1. Strip commas so "1,000" reads as "1000" (single 4-digit number).
  //   2. Take min = Math.min, max = Math.max across all valid 2-5 digit captures.
  //   3. Single-number inputs keep the prior 0.5*n heuristic for min.
  if (!text || typeof text !== 'string') return { min: null, max: null };
  const stripped = text.replace(/,/g, '');
  const numbers = (stripped.match(/\d{2,5}/g) ?? [])
    .map((s) => parseInt(s, 10))
    .filter((n) => n > 0 && n <= 10000);
  if (numbers.length === 0) return { min: null, max: null };
  if (numbers.length === 1) {
    const n = numbers[0];
    return { min: Math.floor(n * 0.5), max: n };
  }
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

function parsePrice(text: string | null | undefined): number | null {
  if (!text || typeof text !== 'string') return null;
  const m = text.match(/\$\s*([0-9][0-9,]{2,})/);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ''), 10);
}

/** Replicates src/lib/inquiryValidation.ts at migration time. */
function isAutoGeneratedVenueEmail(email: string | null | undefined, venueName: string): boolean {
  if (!email) return false;
  const expected =
    'info@' +
    (venueName || 'venue').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') +
    '.com';
  return email.trim().toLowerCase() === expected;
}

function isProbablyRealEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Map JSON tags[] → venue_type bucket. Mirrors mockData.ts. */
function inferVenueType(
  tags: string[] | undefined
): 'beach' | 'garden' | 'ballroom' | 'historic' | 'modern' | 'rustic' {
  const t = tags || [];
  if (t.includes('beachfront') || t.includes('oceanfront') || t.includes('beach')) return 'beach';
  if (t.includes('garden') || t.includes('outdoor')) return 'garden';
  if (t.includes('ballroom')) return 'ballroom';
  if (t.includes('historic')) return 'historic';
  if (t.includes('modern')) return 'modern';
  if (t.includes('rustic') || t.includes('barn')) return 'rustic';
  return 'ballroom';
}

// ---------------------------------------------------------------------------
// Build rows from JSON
// ---------------------------------------------------------------------------

interface VenueRow {
  legacy_id: string;
  slug: string;
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
  amenities: string[];
  tags: string[];
  images: unknown[];
  ceremony_and_reception: boolean | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_email_real: boolean;
  contact_website: string | null;
  gallery_url: string | null;
  address_street: string | null;
  address_zip: string | null;
  coordinates: unknown;
  external_reviews: unknown;
  last_image_update: string | null;
}

function buildVenueRows(
  json: { weddingVenues: any[] },
  existingSlugByLegacyId: Map<string, string>
): VenueRow[] {
  const taken = new Set<string>(existingSlugByLegacyId.values());
  return json.weddingVenues
    .filter((v) => v && typeof v === 'object' && v.name)
    .map((v, idx): VenueRow => {
      const legacyId = String(idx + 1);
      const city = extractCityFromLocation(v.location);

      let slug = existingSlugByLegacyId.get(legacyId);
      if (!slug) {
        slug = ensureUnique(venueSlugFor(v.name, city), taken);
      }

      const cap = parseCapacity(v.capacity);
      // Note: the JSON has no email field. contact_email stays null at
      // migration time; the data layer (src/lib/catalog.ts) synthesizes
      // info@<slug>.com on read for backward compat with the inquiry form.
      // contact_email_real is FALSE so lead-routing diverts to the fallback
      // inbox. Phase 3 owner-dashboard data entry sets real emails + flips
      // the boolean.
      return {
        legacy_id: legacyId,
        slug,
        name: v.name,
        description: v.style || v.description || null,
        city: city || null,
        region: v.region || null,
        state: 'FL',
        capacity_min: cap.min,
        capacity_max: cap.max,
        capacity_text: typeof v.capacity === 'string' ? v.capacity : null,
        size_category: v.sizeCategory || null,
        venue_type: inferVenueType(v.tags),
        price_min: parsePrice(v.pricing),
        price_text: typeof v.pricing === 'string' ? v.pricing : null,
        amenities: Array.isArray(v.servicesAmenities) ? v.servicesAmenities : [],
        tags: Array.isArray(v.tags) ? v.tags : [],
        images: Array.isArray(v.images) ? v.images : [],
        ceremony_and_reception:
          typeof v.ceremonyAndReception === 'boolean' ? v.ceremonyAndReception : null,
        contact_phone: null,
        contact_email: null,
        contact_email_real: false,
        contact_website: v.website || null,
        gallery_url: v.gallery || null,
        address_street: v.address?.street || null,
        address_zip: v.address?.zipCode || null,
        coordinates: v.address?.coordinates || null,
        external_reviews: null,
        last_image_update: v.lastImageUpdate || null,
      };
    });
}

interface VendorRow {
  legacy_id: string;
  slug: string;
  name: string;
  business_name: string | null;
  description: string | null;
  category: string;
  subcategory: string | null;
  city: string | null;
  state: string;
  service_area: string[];
  contact_phone: string | null;
  contact_email: string | null;
  contact_email_real: boolean;
  contact_website: string | null;
  social_media: unknown;
  images: unknown[];
  specialties: string[];
  tags: string[];
  price_range: string | null;
}

function buildVendorRows(
  json: { weddingVendors: any[] },
  existingSlugByLegacyId: Map<string, string>
): VendorRow[] {
  const taken = new Set<string>(existingSlugByLegacyId.values());
  return json.weddingVendors
    .filter((v) => v && typeof v === 'object' && v.name)
    .map((v): VendorRow => {
      const legacyId = String(v.id || slugify(v.name));
      const city = v.address?.city || '';
      let slug = existingSlugByLegacyId.get(legacyId);
      if (!slug) {
        slug = ensureUnique(entitySlugFor(v.name, city, v.id), taken);
      }
      const email = v.contact?.email ?? null;
      return {
        legacy_id: legacyId,
        slug,
        name: v.name,
        business_name: v.businessName || null,
        description: v.description || null,
        category: v.category || 'other',
        subcategory: v.subcategory || null,
        city: city || null,
        state: v.address?.state || 'FL',
        service_area: Array.isArray(v.address?.serviceArea) ? v.address.serviceArea : [],
        contact_phone: v.contact?.phone || null,
        contact_email: email,
        contact_email_real: isProbablyRealEmail(email),
        contact_website: v.contact?.website || null,
        social_media: v.contact?.socialMedia || null,
        images: Array.isArray(v.images) ? v.images : [],
        specialties: Array.isArray(v.specialties) ? v.specialties : [],
        tags: Array.isArray(v.tags) ? v.tags : [],
        price_range: v.priceRange || null,
      };
    });
}

interface DressShopRow {
  legacy_id: string;
  slug: string;
  name: string;
  description: string | null;
  shop_type: string | null;
  city: string | null;
  state: string;
  address_street: string | null;
  address_zip: string | null;
  coordinates: unknown;
  price_min: number | null;
  price_max: number | null;
  specialties: string[];
  tags: string[];
  images: unknown[];
  brands: string[];
  services: string[];
  hours: unknown;
  contact_phone: string | null;
  contact_email: string | null;
  contact_email_real: boolean;
  contact_website: string | null;
  is_premium: boolean;
}

function buildDressShopRows(
  json: { weddingDressShops: any[] },
  existingSlugByLegacyId: Map<string, string>
): DressShopRow[] {
  const taken = new Set<string>(existingSlugByLegacyId.values());
  return json.weddingDressShops
    .filter((s) => s && typeof s === 'object' && s.name)
    .map((s): DressShopRow => {
      const legacyId = String(s.id || slugify(s.name));
      const city = s.address?.city || '';
      let slug = existingSlugByLegacyId.get(legacyId);
      if (!slug) {
        slug = ensureUnique(entitySlugFor(s.name, city, s.id), taken);
      }
      const email = s.contact?.email ?? null;
      return {
        legacy_id: legacyId,
        slug,
        name: s.name,
        description: s.description || null,
        shop_type: s.shopType || null,
        city: city || null,
        state: s.address?.state || 'FL',
        address_street: s.address?.street || null,
        address_zip: s.address?.zipCode || null,
        coordinates: s.address?.coordinates || null,
        price_min: s.priceRange?.min ?? null,
        price_max: s.priceRange?.max ?? null,
        specialties: Array.isArray(s.specialties) ? s.specialties : [],
        tags: Array.isArray(s.tags) ? s.tags : [],
        images: Array.isArray(s.images) ? s.images : [],
        brands: Array.isArray(s.brands) ? s.brands : [],
        services: Array.isArray(s.services) ? s.services : [],
        hours: s.hours || null,
        contact_phone: s.contact?.phone || null,
        contact_email: email,
        contact_email_real: isProbablyRealEmail(email),
        contact_website: s.contact?.website || null,
        is_premium: !!s.owner?.isPremium,
      };
    });
}

// ---------------------------------------------------------------------------
// Supabase IO
// ---------------------------------------------------------------------------

async function fetchExistingSlugs(table: string): Promise<Map<string, string>> {
  if (!supabase) return new Map();
  const { data, error } = await supabase
    .from(table)
    .select('legacy_id, slug');
  if (error) {
    fail(`Failed to read existing ${table} slugs: ${error.message}`);
  }
  return new Map((data ?? []).map((r: any) => [r.legacy_id, r.slug]));
}

async function upsertChunk<T>(table: string, rows: T[]) {
  if (!supabase) return;
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from(table)
      .upsert(chunk as any, { onConflict: 'legacy_id' });
    if (error) {
      fail(`Upsert failed on ${table} chunk ${i}-${i + CHUNK}: ${error.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  logline(`# Catalog migration  ${new Date().toISOString()}  ${DRY_RUN || PREVIEW_ONLY ? '(dry-run)' : '(WRITE MODE)'}`);

  const venuesJson = JSON.parse(
    readFileSync(resolve(process.cwd(), 'src/data/venues.json'), 'utf-8')
  );
  const vendorsJson = JSON.parse(
    readFileSync(resolve(process.cwd(), 'src/data/vendors.json'), 'utf-8')
  );
  const dressShopsJson = JSON.parse(
    readFileSync(resolve(process.cwd(), 'src/data/dressShops.json'), 'utf-8')
  );

  const existingVenuesSlugs = await fetchExistingSlugs('venues');
  const existingVendorsSlugs = await fetchExistingSlugs('vendors');
  const existingDressShopsSlugs = await fetchExistingSlugs('dress_shops');

  const venueRows = buildVenueRows(venuesJson, existingVenuesSlugs);
  const vendorRows = buildVendorRows(vendorsJson, existingVendorsSlugs);
  const dressShopRows = buildDressShopRows(dressShopsJson, existingDressShopsSlugs);

  logline('');
  logline(`venues:      ${venueRows.length} rows ready`);
  logline(`vendors:     ${vendorRows.length} rows ready`);
  logline(`dress_shops: ${dressShopRows.length} rows ready`);

  // Surface generated slugs (every row, every run)
  logline('');
  logline('-- venues slugs --');
  for (const r of venueRows) logline(`  ${r.legacy_id.padStart(3)}  ${r.slug}`);
  logline('-- vendors slugs --');
  for (const r of vendorRows) logline(`  ${r.legacy_id.padStart(28)}  ${r.slug}`);
  logline('-- dress_shops slugs --');
  for (const r of dressShopRows) logline(`  ${r.legacy_id.padStart(28)}  ${r.slug}`);

  if (DRY_RUN || PREVIEW_ONLY) {
    logline('');
    logline('Dry run only — no Supabase writes.');
  } else {
    logline('');
    logline('Writing to Supabase...');
    await upsertChunk('venues', venueRows);
    await upsertChunk('vendors', vendorRows);
    await upsertChunk('dress_shops', dressShopRows);
    logline('Done.');
  }

  appendFileSync(resolve(process.cwd(), 'migration.log'), log.join('\n') + '\n\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
