// Venue data interfaces for JSON format
export interface VenueImageData {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface VenueData {
  name: string;
  location: string;
  region: string;
  capacity: string;
  sizeCategory: string;
  style: string;
  tags: string[];
  pricing: string;
  servicesAmenities: string[];
  ceremonyAndReception: boolean;
  website?: string;
  gallery?: string;
  images?: VenueImageData[];
  lastImageUpdate?: string;
}

export interface VenuesDataFile {
  weddingVenues: VenueData[];
}

// Placeholder image configuration
export const PLACEHOLDER_IMAGE = {
  url: '/images/venue-placeholder.svg',
  alt: 'Wedding venue placeholder image',
  isPrimary: true,
  id: 'placeholder-primary'
};

// Venues that should keep their real images
export const VENUES_WITH_REAL_IMAGES = [
  'Ancient Spanish Monastery'
];

/**
 * Creates placeholder images for a venue
 */
export function createPlaceholderImages(venueName: string): VenueImageData[] {
  return [
    {
      id: 'placeholder-primary',
      url: '/images/venue-placeholder.svg',
      alt: `${venueName} - Wedding venue placeholder`,
      isPrimary: true
    },
    {
      id: 'placeholder-1',
      url: '/images/venue-placeholder.svg',
      alt: `${venueName} - Ceremony space`,
      isPrimary: false
    },
    {
      id: 'placeholder-2',
      url: '/images/venue-placeholder.svg',
      alt: `${venueName} - Reception area`,
      isPrimary: false
    },
    {
      id: 'placeholder-3',
      url: '/images/venue-placeholder.svg',
      alt: `${venueName} - Venue details`,
      isPrimary: false
    }
  ];
}

/**
 * Checks if a venue should use placeholder images
 */
export function shouldUsePlaceholder(venueName: string): boolean {
  return !VENUES_WITH_REAL_IMAGES.includes(venueName);
}

/**
 * Determines if a venue has uploaded photos (non-placeholder images)
 */
export function hasUploadedPhotos(venue: VenueData): boolean {
  if (!venue.images || venue.images.length === 0) return false;
  
  // Check if any image is not a placeholder
  return venue.images.some(img => 
    !img.url.includes('venue-placeholder.svg') && 
    !img.url.includes('placeholder')
  );
}

/**
 * Sorts venues with uploaded photos first, then alphabetically
 */
export function sortVenuesByPhotos(venues: VenueData[]): VenueData[] {
  return [...venues].sort((a, b) => {
    const aHasPhotos = hasUploadedPhotos(a);
    const bHasPhotos = hasUploadedPhotos(b);
    
    // If one has photos and the other doesn't, prioritize the one with photos
    if (aHasPhotos && !bHasPhotos) return -1;
    if (!aHasPhotos && bHasPhotos) return 1;
    
    // If both have the same photo status, sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Updates a venue to use placeholder images (unless it should keep real images)
 */
export function updateVenueImages(venue: VenueData): VenueData {
  if (!shouldUsePlaceholder(venue.name)) {
    // Keep original images for venues that should have real images
    return venue;
  }
  
  return {
    ...venue,
    images: createPlaceholderImages(venue.name),
    lastImageUpdate: new Date().toISOString()
  };
}
