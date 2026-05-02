import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo';
import {
  getVenues,
  getAllVendorSlugs,
  getAllDressShopSlugs,
} from '@/lib/catalog';
import {
  REGIONS,
  VENUE_TYPES,
  combosWithCoverage,
  filterVenuesByRegion,
  filterVenuesByType,
} from '@/lib/hyperlocal';

export const dynamic = 'force-dynamic';

/**
 * Sitemap built from the catalog. Tier-aware priority on venues:
 *   scale  → 1.0  (lifetime paid + pro media)
 *   growth → 0.8  (annual paid)
 *   starter→ 0.6  (free)
 * Static pages cap at 0.9 for /venues / /vendors / /dress-shops indexes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/venues`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/vendors`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/dress-shops`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/venue-packages`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Pull venues with their tier so we can priority-rank by paid-status.
  // getAll*Slugs would return only slug+updated_at — we need tier here.
  const [venues, vendors, dressShops] = await Promise.all([
    getVenues(),
    getAllVendorSlugs(),
    getAllDressShopSlugs(),
  ]);

  const venuePriorityFor = (tier: string | undefined) => {
    if (tier === 'scale') return 1.0;
    if (tier === 'growth') return 0.8;
    return 0.6;
  };

  const venuePages: MetadataRoute.Sitemap = venues.map((v) => ({
    url: `${baseUrl}/venues/${v.slug}`,
    // We don't have updated_at on the Venue type yet — uses now() as a
    // safe-but-conservative lastmod. Once we surface updated_at, swap in.
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: venuePriorityFor(v.tier),
  }));
  const vendorPages: MetadataRoute.Sitemap = vendors.map((v) => ({
    url: `${baseUrl}/vendors/${v.slug}`,
    lastModified: v.updated_at || now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  const dressShopPages: MetadataRoute.Sitemap = dressShops.map((s) => ({
    url: `${baseUrl}/dress-shops/${s.slug}`,
    lastModified: s.updated_at || now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Hyperlocal landing pages — only emit pages that actually have venues.
  // priority is 0.7 because they're aggregator pages, just under venue
  // detail (0.6-1.0) but above the contact/about static pages.
  const regionPages: MetadataRoute.Sitemap = REGIONS
    .filter((r) => filterVenuesByRegion(venues, r).length > 0)
    .map((r) => ({
      url: `${baseUrl}/venues/in/${r.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  const typePages: MetadataRoute.Sitemap = VENUE_TYPES
    .filter((t) => filterVenuesByType(venues, t).length > 0)
    .map((t) => ({
      url: `${baseUrl}/venues/style/${t.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  const comboPages: MetadataRoute.Sitemap = combosWithCoverage(venues, 3).map(
    (c) => ({
      url: `${baseUrl}/venues/in/${c.region.slug}/${c.type.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    })
  );

  return [
    ...staticPages,
    ...venuePages,
    ...vendorPages,
    ...dressShopPages,
    ...regionPages,
    ...typePages,
    ...comboPages,
  ];
}
