/**
 * Robots.txt for Florida Wedding Wonders
 * 
 * Controls search engine crawling behavior
 * Located at: /robots.txt
 */

import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/login',
          '/register',
          '/guest/',
          '/venue-owner/',
          '/favorites',
          '/*?*', // Disable query parameters for now
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/login',
          '/register',
          '/guest/',
          '/venue-owner/',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}
