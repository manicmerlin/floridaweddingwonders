import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo';
import {
  getAllVenueSlugs,
  getAllVendorSlugs,
  getAllDressShopSlugs,
} from '@/lib/catalog';

export const dynamic = 'force-dynamic';

/**
 * Sitemap built from the catalog. Includes static pages plus every venue,
 * vendor, and dress-shop slug URL with their last-updated timestamp.
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

  const [venues, vendors, dressShops] = await Promise.all([
    getAllVenueSlugs(),
    getAllVendorSlugs(),
    getAllDressShopSlugs(),
  ]);

  const venuePages: MetadataRoute.Sitemap = venues.map((v) => ({
    url: `${baseUrl}/venues/${v.slug}`,
    lastModified: v.updated_at || now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
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

  return [...staticPages, ...venuePages, ...vendorPages, ...dressShopPages];
}
