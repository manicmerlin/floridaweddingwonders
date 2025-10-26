/**
 * SEO Utilities for Florida Wedding Wonders
 * 
 * Provides reusable metadata generators, structured data,
 * and Open Graph configurations for all pages.
 */

import { Metadata } from 'next';

// ============================================================================
// SITE CONFIGURATION
// ============================================================================

export const SITE_CONFIG = {
  name: 'Florida Wedding Wonders',
  domain: 'floridaweddingwonders.com',
  url: 'https://floridaweddingwonders.com',
  description: 'Discover Florida\'s most beautiful wedding venues, trusted vendors, and elegant bridal shops. Find your perfect wedding venue in the Sunshine State.',
  locale: 'en_US',
  type: 'website',
  twitter: '@flweddingwonder',
  facebook: 'floridaweddingwonders',
  instagram: 'floridaweddingwonders',
};

// ============================================================================
// METADATA GENERATORS
// ============================================================================

/**
 * Generate metadata for home page
 */
export function generateHomeMetadata(): Metadata {
  return {
    title: 'Florida Wedding Wonders - Premier Wedding Venues in Florida',
    description: 'Discover Florida\'s most beautiful wedding venues, trusted vendors, and elegant bridal shops. From beachfront ceremonies to historic estates, find your perfect wedding venue in the Sunshine State.',
    keywords: [
      'Florida wedding venues',
      'wedding venues Florida',
      'South Florida wedding venues',
      'beach wedding venues Florida',
      'Miami wedding venues',
      'Orlando wedding venues',
      'Tampa wedding venues',
      'Florida wedding venues by the beach',
      'wedding planning Florida',
      'destination wedding Florida',
    ],
    openGraph: {
      title: 'Florida Wedding Wonders - Premier Wedding Venues in Florida',
      description: 'Discover Florida\'s most beautiful wedding venues, trusted vendors, and elegant bridal shops.',
      url: SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: `${SITE_CONFIG.url}/images/og-home.jpg`,
          width: 1200,
          height: 630,
          alt: 'Florida Wedding Wonders - Beautiful wedding venues across Florida',
        },
      ],
      locale: SITE_CONFIG.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Florida Wedding Wonders - Premier Wedding Venues in Florida',
      description: 'Discover Florida\'s most beautiful wedding venues, trusted vendors, and elegant bridal shops.',
      images: [`${SITE_CONFIG.url}/images/og-home.jpg`],
      creator: SITE_CONFIG.twitter,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: SITE_CONFIG.url,
    },
  };
}

/**
 * Generate metadata for venues listing page
 */
export function generateVenuesListingMetadata(): Metadata {
  return {
    title: 'Wedding Venues in Florida | Florida Wedding Wonders',
    description: 'Browse hundreds of stunning wedding venues across Florida. From Miami to Orlando, find beachfront resorts, historic estates, gardens, and more for your perfect wedding day.',
    keywords: [
      'Florida wedding venues',
      'wedding venues near me',
      'South Florida venues',
      'beach wedding venues',
      'garden wedding venues Florida',
      'historic wedding venues Florida',
      'outdoor wedding venues Florida',
      'wedding reception venues',
    ],
    openGraph: {
      title: 'Wedding Venues in Florida | Florida Wedding Wonders',
      description: 'Browse hundreds of stunning wedding venues across Florida.',
      url: `${SITE_CONFIG.url}/venues`,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: `${SITE_CONFIG.url}/images/og-venues.jpg`,
          width: 1200,
          height: 630,
          alt: 'Beautiful wedding venues in Florida',
        },
      ],
      locale: SITE_CONFIG.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Wedding Venues in Florida',
      description: 'Browse hundreds of stunning wedding venues across Florida.',
      images: [`${SITE_CONFIG.url}/images/og-venues.jpg`],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/venues`,
    },
  };
}

/**
 * Generate metadata for individual venue page
 */
export function generateVenueMetadata(venue: {
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  priceRange?: string;
  images?: string[];
  amenities?: string[];
}): Metadata {
  const description = venue.description 
    ? venue.description.substring(0, 160)
    : `${venue.name} - Beautiful wedding venue in ${venue.location || 'Florida'}. ${venue.capacity ? `Capacity: ${venue.capacity} guests.` : ''} Book your dream wedding today!`;

  const title = `${venue.name} - Wedding Venue in ${venue.location || 'Florida'}`;
  
  const image = venue.images?.[0] || `${SITE_CONFIG.url}/images/venue-placeholder.jpg`;

  return {
    title,
    description,
    keywords: [
      venue.name,
      `${venue.name} wedding venue`,
      `wedding venues in ${venue.location}`,
      `${venue.location} wedding venues`,
      'Florida wedding venues',
      ...(venue.amenities || []),
    ],
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/venues/${encodeURIComponent(venue.name.toLowerCase().replace(/\s+/g, '-'))}`,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${venue.name} - Wedding venue in ${venue.location}`,
        },
      ],
      locale: SITE_CONFIG.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generate metadata for vendors page
 */
export function generateVendorsMetadata(): Metadata {
  return {
    title: 'Wedding Vendors in Florida | Photographers, Caterers & More',
    description: 'Find trusted wedding vendors in Florida. Browse photographers, caterers, DJs, florists, and all the professionals you need for your perfect wedding day.',
    keywords: [
      'Florida wedding vendors',
      'wedding photographers Florida',
      'wedding caterers Florida',
      'wedding DJs Florida',
      'wedding florists Florida',
      'wedding planners Florida',
      'wedding vendors near me',
    ],
    openGraph: {
      title: 'Wedding Vendors in Florida | Florida Wedding Wonders',
      description: 'Find trusted wedding vendors in Florida.',
      url: `${SITE_CONFIG.url}/vendors`,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: `${SITE_CONFIG.url}/images/og-vendors.jpg`,
          width: 1200,
          height: 630,
          alt: 'Wedding vendors in Florida',
        },
      ],
      locale: SITE_CONFIG.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Wedding Vendors in Florida',
      description: 'Find trusted wedding vendors in Florida.',
      images: [`${SITE_CONFIG.url}/images/og-vendors.jpg`],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/vendors`,
    },
  };
}

/**
 * Generate metadata for dress shops page
 */
export function generateDressShopsMetadata(): Metadata {
  return {
    title: 'Bridal Shops & Wedding Dress Boutiques in Florida',
    description: 'Discover elegant bridal shops and wedding dress boutiques across Florida. Find your dream wedding dress from top designers and experienced consultants.',
    keywords: [
      'bridal shops Florida',
      'wedding dress shops Florida',
      'bridal boutiques Florida',
      'wedding gowns Florida',
      'bridal dresses Miami',
      'bridal shops Orlando',
      'wedding dress boutiques',
    ],
    openGraph: {
      title: 'Bridal Shops & Wedding Dress Boutiques in Florida',
      description: 'Discover elegant bridal shops and wedding dress boutiques across Florida.',
      url: `${SITE_CONFIG.url}/dress-shops`,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: `${SITE_CONFIG.url}/images/og-dress-shops.jpg`,
          width: 1200,
          height: 630,
          alt: 'Bridal shops in Florida',
        },
      ],
      locale: SITE_CONFIG.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Bridal Shops in Florida',
      description: 'Discover elegant bridal shops and wedding dress boutiques across Florida.',
      images: [`${SITE_CONFIG.url}/images/og-dress-shops.jpg`],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/dress-shops`,
    },
  };
}

/**
 * Generate metadata for venue packages page
 */
export function generateVenuePackagesMetadata(): Metadata {
  return {
    title: 'Venue Owner Packages | List Your Wedding Venue in Florida',
    description: 'Promote your wedding venue to thousands of couples. Choose from flexible packages starting at just $45/month. Get discovered by engaged couples planning their Florida wedding.',
    keywords: [
      'list wedding venue',
      'wedding venue advertising',
      'promote wedding venue',
      'wedding venue marketing',
      'venue owner packages',
    ],
    openGraph: {
      title: 'Venue Owner Packages | Florida Wedding Wonders',
      description: 'Promote your wedding venue to thousands of couples.',
      url: `${SITE_CONFIG.url}/venue-packages`,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/venue-packages`,
    },
  };
}

// ============================================================================
// STRUCTURED DATA (JSON-LD)
// ============================================================================

/**
 * Generate Organization structured data
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/images/logo.png`,
    description: SITE_CONFIG.description,
    sameAs: [
      `https://twitter.com/${SITE_CONFIG.twitter.replace('@', '')}`,
      `https://facebook.com/${SITE_CONFIG.facebook}`,
      `https://instagram.com/${SITE_CONFIG.instagram}`,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'info@floridaweddingwonders.com',
    },
  };
}

/**
 * Generate WebSite structured data
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/venues?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate EventVenue structured data
 */
export function generateVenueSchema(venue: {
  id: string;
  name: string;
  description?: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  images?: string[];
  capacity?: number;
  priceRange?: string;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
}) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'EventVenue',
    name: venue.name,
    description: venue.description || `${venue.name} - Beautiful wedding venue in ${venue.location || 'Florida'}`,
    url: `${SITE_CONFIG.url}/venues/${venue.id}`,
    image: venue.images || [],
  };

  if (venue.address) {
    schema.address = {
      '@type': 'PostalAddress',
      addressLocality: venue.location,
      addressRegion: 'FL',
      addressCountry: 'US',
      streetAddress: venue.address,
    };
  }

  if (venue.latitude && venue.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: venue.latitude,
      longitude: venue.longitude,
    };
  }

  if (venue.phone) {
    schema.telephone = venue.phone;
  }

  if (venue.email) {
    schema.email = venue.email;
  }

  if (venue.capacity) {
    schema.maximumAttendeeCapacity = venue.capacity;
  }

  if (venue.priceRange) {
    schema.priceRange = venue.priceRange;
  }

  if (venue.amenities && venue.amenities.length > 0) {
    schema.amenityFeature = venue.amenities.map(amenity => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
    }));
  }

  return schema;
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate LocalBusiness structured data
 */
export function generateLocalBusinessSchema(business: {
  name: string;
  description: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  image?: string;
  priceRange?: string;
}) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    image: business.image,
    priceRange: business.priceRange || '$$',
  };

  if (business.address && business.city) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: business.city,
      addressRegion: 'FL',
      addressCountry: 'US',
    };
  }

  if (business.phone) {
    schema.telephone = business.phone;
  }

  if (business.email) {
    schema.email = business.email;
  }

  if (business.website) {
    schema.url = business.website;
  }

  return schema;
}
