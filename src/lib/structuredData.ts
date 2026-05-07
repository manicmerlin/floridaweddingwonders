// JSON-LD builders for schema.org markup. Pure server-safe — no I/O.
//
// Used by listing detail pages (LocalBusiness/Place for venues, Service for
// vendors, Store for dress shops), and listing index pages (BreadcrumbList +
// ItemList). Output is dropped into a <script type="application/ld+json">
// tag that the page renders server-side so Googlebot indexes it on first
// crawl with no JS execution.
//
// Helpers strip null/undefined/empty fields so the emitted JSON only carries
// what the catalog actually has.

import type { Venue, Vendor, DressShop, SuitShop } from '../types';

const SITE = 'https://floridaweddingwonders.com';

function pruneEmpty<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      const sub = pruneEmpty(v as Record<string, unknown>);
      if (Object.keys(sub).length > 0) out[k] = sub;
      continue;
    }
    out[k] = v;
  }
  return out as T;
}

function venueImageUrls(venue: Venue): string[] {
  return (venue.images ?? [])
    .map((img) => (typeof img === 'string' ? img : (img as any).url))
    .filter((u): u is string => typeof u === 'string' && u.length > 0);
}

function priceRangeBucket(min?: number): string | undefined {
  if (!min || min <= 0) return undefined;
  if (min < 2000) return '$';
  if (min < 8000) return '$$';
  if (min < 20000) return '$$$';
  return '$$$$';
}

// ---------------------------------------------------------------------------
// LocalBusiness for venues
// ---------------------------------------------------------------------------

export function venueLocalBusinessLD(venue: Venue) {
  const images = venueImageUrls(venue);
  const url = `${SITE}/venues/${venue.slug || venue.id}`;
  const geo = venue.address.coordinates;

  return pruneEmpty({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': url,
    name: venue.name,
    description: venue.description || undefined,
    url,
    image: images.length > 0 ? images : undefined,
    telephone: venue.contact.phone || undefined,
    email: venue.contact.email || undefined,
    sameAs: venue.contact.website ? [venue.contact.website] : undefined,
    priceRange: priceRangeBucket(venue.pricing?.startingPrice),
    address: pruneEmpty({
      '@type': 'PostalAddress',
      streetAddress: venue.address.street,
      addressLocality: venue.address.city,
      addressRegion: venue.address.state || 'FL',
      postalCode: venue.address.zipCode,
      addressCountry: 'US',
    }),
    geo: geo
      ? pruneEmpty({
          '@type': 'GeoCoordinates',
          latitude: geo.lat,
          longitude: geo.lng,
        })
      : undefined,
    // Aggregate rating block emitted only when we have non-zero numbers
    // (catalog currently has 0/0 for everything — no review system yet).
    aggregateRating:
      venue.reviews && venue.reviews.count > 0
        ? pruneEmpty({
            '@type': 'AggregateRating',
            ratingValue: venue.reviews.rating,
            reviewCount: venue.reviews.count,
          })
        : undefined,
  });
}

// ---------------------------------------------------------------------------
// Service for vendors
// ---------------------------------------------------------------------------

export function vendorServiceLD(vendor: Vendor) {
  const url = `${SITE}/vendors/${vendor.slug || vendor.id}`;
  const images = (vendor.images ?? [])
    .map((img) => img.url)
    .filter((u): u is string => typeof u === 'string' && u.length > 0);

  return pruneEmpty({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': url,
    name: vendor.name,
    description: vendor.description || undefined,
    url,
    serviceType: vendor.category,
    provider: pruneEmpty({
      '@type': 'LocalBusiness',
      name: vendor.businessName || vendor.name,
      telephone: vendor.contact.phone || undefined,
      email: vendor.contact.email || undefined,
      address: pruneEmpty({
        '@type': 'PostalAddress',
        addressLocality: vendor.address.city,
        addressRegion: vendor.address.state || 'FL',
        addressCountry: 'US',
      }),
      sameAs: vendor.contact.website ? [vendor.contact.website] : undefined,
    }),
    areaServed: vendor.address.serviceArea?.length
      ? vendor.address.serviceArea.map((area) => ({
          '@type': 'Place',
          name: area,
        }))
      : undefined,
    image: images.length > 0 ? images : undefined,
  });
}

// ---------------------------------------------------------------------------
// Store / LocalBusiness for dress shops
// ---------------------------------------------------------------------------

export function dressShopStoreLD(shop: DressShop) {
  const url = `${SITE}/dress-shops/${shop.slug || shop.id}`;
  const images = (shop.images ?? [])
    .map((img) => img.url)
    .filter((u): u is string => typeof u === 'string' && u.length > 0);

  return pruneEmpty({
    '@context': 'https://schema.org',
    '@type': 'BridalShop',
    '@id': url,
    name: shop.name,
    description: shop.description || undefined,
    url,
    image: images.length > 0 ? images : undefined,
    telephone: shop.contact.phone || undefined,
    email: shop.contact.email || undefined,
    sameAs: shop.contact.website ? [shop.contact.website] : undefined,
    priceRange: priceRangeBucket(shop.priceRange?.min),
    address: pruneEmpty({
      '@type': 'PostalAddress',
      streetAddress: shop.address.street,
      addressLocality: shop.address.city,
      addressRegion: shop.address.state || 'FL',
      postalCode: shop.address.zipCode,
      addressCountry: 'US',
    }),
    geo: shop.address.coordinates
      ? pruneEmpty({
          '@type': 'GeoCoordinates',
          latitude: shop.address.coordinates.lat,
          longitude: shop.address.coordinates.lng,
        })
      : undefined,
  });
}

// ---------------------------------------------------------------------------
// Breadcrumbs (used on every detail page)
// ---------------------------------------------------------------------------

export function breadcrumbLD(items: Array<{ name: string; href: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.href.startsWith('http') ? item.href : `${SITE}${item.href}`,
    })),
  };
}

// ---------------------------------------------------------------------------
// ItemList (used on listing index pages)
// ---------------------------------------------------------------------------

export function venueListLD(venues: Venue[], maxItems = 50) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Florida Wedding Venues',
    url: `${SITE}/venues`,
    numberOfItems: venues.length,
    itemListElement: venues.slice(0, maxItems).map((v, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${SITE}/venues/${v.slug || v.id}`,
      name: v.name,
    })),
  };
}

export function vendorListLD(vendors: Vendor[], maxItems = 50) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Florida Wedding Vendors',
    url: `${SITE}/vendors`,
    numberOfItems: vendors.length,
    itemListElement: vendors.slice(0, maxItems).map((v, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${SITE}/vendors/${v.slug || v.id}`,
      name: v.name,
    })),
  };
}

export function dressShopListLD(shops: DressShop[], maxItems = 50) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Florida Bridal Shops',
    url: `${SITE}/dress-shops`,
    numberOfItems: shops.length,
    itemListElement: shops.slice(0, maxItems).map((s, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${SITE}/dress-shops/${s.slug || s.id}`,
      name: s.name,
    })),
  };
}

export function suitShopListLD(shops: SuitShop[], maxItems = 50) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Florida Suit & Tuxedo Shops',
    url: `${SITE}/suit-shops`,
    numberOfItems: shops.length,
    itemListElement: shops.slice(0, maxItems).map((s, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${SITE}/suit-shops/${s.slug || s.id}`,
      name: s.name,
    })),
  };
}

export function suitShopStoreLD(shop: SuitShop) {
  const url = `${SITE}/suit-shops/${shop.slug || shop.id}`;
  const images = (shop.images ?? [])
    .map((img) => img.url)
    .filter((u): u is string => typeof u === 'string' && u.length > 0);

  return pruneEmpty({
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    '@id': url,
    name: shop.name,
    description: shop.description || undefined,
    url,
    image: images.length > 0 ? images : undefined,
    telephone: shop.contact.phone || undefined,
    email: shop.contact.email || undefined,
    sameAs: shop.contact.website ? [shop.contact.website] : undefined,
    priceRange: priceRangeBucket(shop.priceRange?.min),
    address: pruneEmpty({
      '@type': 'PostalAddress',
      streetAddress: shop.address.street,
      addressLocality: shop.address.city,
      addressRegion: shop.address.state || 'FL',
      postalCode: shop.address.zipCode,
      addressCountry: 'US',
    }),
    geo: shop.address.coordinates
      ? pruneEmpty({
          '@type': 'GeoCoordinates',
          latitude: shop.address.coordinates.lat,
          longitude: shop.address.coordinates.lng,
        })
      : undefined,
  });
}

// ---------------------------------------------------------------------------
// CollectionPage (used on /venues/in/[region], /venues/style/[type], etc.)
// ---------------------------------------------------------------------------

export function collectionPageLD(args: {
  name: string;
  description: string;
  path: string;
  venues: Venue[];
  maxItems?: number;
}) {
  const max = args.maxItems ?? 50;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: args.name,
    description: args.description,
    url: `${SITE}${args.path}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: args.venues.length,
      itemListElement: args.venues.slice(0, max).map((v, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE}/venues/${v.slug || v.id}`,
        name: v.name,
      })),
    },
  };
}

/** Same as collectionPageLD but emits /vendors/<slug> URLs. */
export function vendorCollectionPageLD(args: {
  name: string;
  description: string;
  path: string;
  vendors: Vendor[];
  maxItems?: number;
}) {
  const max = args.maxItems ?? 50;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: args.name,
    description: args.description,
    url: `${SITE}${args.path}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: args.vendors.length,
      itemListElement: args.vendors.slice(0, max).map((v, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE}/vendors/${v.slug || v.id}`,
        name: v.name,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Render helper — one place to safely serialize and inject
// ---------------------------------------------------------------------------

/**
 * Returns a string safe to drop into <script type="application/ld+json"
 * dangerouslySetInnerHTML={{ __html: ... }}>. Escapes `</` to prevent
 * an embedded close tag from breaking out of the script element.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/<\//g, '<\\/');
}
