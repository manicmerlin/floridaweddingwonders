import { Venue } from '../types';
import { sortVenuesByPhotos, hasUploadedPhotos } from './venueImages';

// Load South Florida wedding venues data from JSON with fallback
function loadVenueData(): any[] {
  try {
    const venuesJson = require('../data/venues.json');
    const venues = venuesJson.weddingVenues || [];
    console.log('✅ JSON loaded successfully, venues count:', venues.length);
    return venues;
  } catch (error) {
    console.warn('❌ Could not load venues.json:', error);
    // Fallback venue data
    return [
      {
        name: "The Breakers Palm Beach",
        location: "Palm Beach, FL",
        style: "Luxury oceanfront resort with elegant ballrooms and impeccable service",
        capacity: "50-400 guests",
        pricing: "$15,000+",
        tags: ["beachfront", "luxury", "ballroom"],
        website: "https://www.thebreakers.com"
      },
      {
        name: "Vizcaya Museum and Gardens",
        location: "Miami, FL", 
        style: "Historic Italian Renaissance villa with stunning formal gardens",
        capacity: "100-250 guests",
        pricing: "$12,000+",
        tags: ["historic", "garden", "outdoor"],
        website: "https://vizcaya.org"
      },
      {
        name: "Four Seasons Resort Palm Beach",
        location: "Palm Beach, FL",
        style: "Sophisticated beachfront luxury with ocean views",
        capacity: "75-300 guests", 
        pricing: "$18,000+",
        tags: ["beachfront", "luxury", "modern"],
        website: "https://www.fourseasons.com"
      }
    ];
  }
}

const venueData = loadVenueData();

// Transform real venue data to match our interface
function parseCapacity(capacityString: string): { min: number; max: number } {
  if (!capacityString || typeof capacityString !== 'string') {
    return { min: 50, max: 150 }; // default
  }
  
  const numbers = capacityString.match(/\d+/g);
  if (numbers && numbers.length >= 1) {
    if (numbers.length === 1) {
      const capacity = parseInt(numbers[0]);
      return { min: Math.floor(capacity * 0.5), max: capacity };
    } else {
      return { min: parseInt(numbers[0]), max: parseInt(numbers[numbers.length - 1]) };
    }
  }
  return { min: 50, max: 150 }; // default
}

function parsePrice(pricingString: string): number {
  if (!pricingString || typeof pricingString !== 'string') {
    return 5000; // default
  }
  
  const priceMatch = pricingString.match(/\$([0-9,]+)/);
  if (priceMatch) {
    return parseInt(priceMatch[1].replace(/,/g, ''));
  }
  return 5000; // default
}

function determineVenueType(tags: string[]): 'beach' | 'garden' | 'ballroom' | 'historic' | 'modern' | 'rustic' {
  if (!Array.isArray(tags)) {
    return 'ballroom'; // default
  }
  
  if (tags.includes('beachfront') || tags.includes('oceanfront')) return 'beach';
  if (tags.includes('garden') || tags.includes('outdoor')) return 'garden';
  if (tags.includes('ballroom')) return 'ballroom';
  if (tags.includes('historic')) return 'historic';
  if (tags.includes('modern')) return 'modern';
  if (tags.includes('rustic') || tags.includes('barn')) return 'rustic';
  return 'ballroom'; // default
}

// Real phone numbers for South Florida wedding venues
const venuePhoneNumbers: { [key: string]: string } = {
  'Hialeah Park Racing & Casino': '(786) 483-7460',
  'The Surfcomber Hotel': '(305) 532-7715',
  'MB Hotel': '(305) 532-2800',
  'Sea Watch on the Ocean': '(954) 781-2200',
  'Emeril Lagasse Foundation Innovation Kitchen': '(954) 377-5425',
  'Coastal Yacht Charters': '(954) 761-8777',
  'Vizcaya Museum & Gardens': '(305) 250-9133',
  'Ancient Spanish Monastery': '(305) 945-1461',
  'The Cooper Estate': '(305) 248-4727',
  'Curtiss Mansion': '(305) 379-4040',
  'Thalatta Estate': '(305) 238-5800',
  'Deering Estate': '(305) 235-1668',
  'Fairchild Tropical Botanic Garden': '(305) 667-1651',
  'Historic Walton House': '(305) 296-3344',
  'The Biltmore Hotel': '(855) 311-6903',
  'Four Seasons Resort Palm Beach': '(561) 582-2800',
  'The Breakers': '(561) 655-6611',
  'PGA National Resort & Spa': '(561) 627-2000',
  'Eau Palm Beach Resort & Spa': '(561) 533-6000',
  'Flagler Museum': '(561) 655-2833',
  'Norton Museum of Art': '(561) 832-5196',
  'Trump International Beach Resort': '(305) 692-5600',
  'The St. Regis Bal Harbour Resort': '(305) 993-3300',
  'The Setai Miami Beach': '(305) 520-6000',
  'Edition Miami Beach': '(786) 257-4500',
  'SLS Brickell': '(305) 239-1300',
  'JW Marriott Marquis Miami': '(305) 421-8600',
  'The Miami Beach EDITION': '(786) 257-4500',
  'W South Beach': '(305) 938-3000',
  'Fontainebleau Miami Beach': '(305) 538-2000',
  'The Ritz-Carlton Key Biscayne': '(305) 365-4500',
  'The Ritz-Carlton South Beach': '(786) 276-4000',
  'Conrad Miami': '(305) 503-6500',
  'InterContinental Miami': '(305) 577-1000',
  'Mandarin Oriental Miami': '(305) 913-8288',
  'Jungle Island': '(305) 400-7000',
  'The Alexander All Suite Oceanfront Resort': '(305) 865-6500',
  'Acqualina Resort & Residences': '(305) 918-8000',
  'The St. Regis Bal Harbour': '(305) 993-3300',
  'Eden Roc Miami Beach': '(305) 531-0000',
  'Nobu Hotel Miami Beach': '(305) 695-3232',
  'The Palms Hotel & Spa': '(305) 534-0505',
  'Royal Palm South Beach Miami': '(305) 604-5700',
  'Grand Beach Hotel Surfside': '(305) 865-7511',
  'The Confidante Miami Beach': '(305) 424-1234',
  'Dream South Beach': '(305) 673-4747',
  'Shore Club': '(305) 695-3100',
  'Casa Colonial Beach & Spa': '(305) 673-0003',
  'Hilton Bentley Miami/South Beach': '(305) 938-4600',
  'Patch of Heaven Sanctuary': '(305) 246-8920',
  'Redland Koi Gardens': '(305) 248-7750',
  'Schnebly Redland Winery': '(305) 242-1224',
  'Ever After Farms Tropical Grove Barn': '(305) 248-4200',
  'Villa Toscana Miami': '(305) 858-8007',
  'East Sister Rock Island': '(305) 743-7080'
};

// Function to get phone number for venue or generate a realistic fallback
function getVenuePhone(venueName: string): string {
  // Check if we have a real phone number for this venue
  if (venuePhoneNumbers[venueName]) {
    return venuePhoneNumbers[venueName];
  }
  
  // Generate a realistic South Florida phone number (area codes: 305, 786, 954, 561)
  const areaCode = ['305', '786', '954', '561'][Math.floor(Math.random() * 4)];
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${exchange}-${number}`;
}

// Function to generate external reviews data for all venues
function getExternalReviews(venueName: string, index: number): any {
  // Generate Google reviews for all venues
  return {
    google: {
      placeId: `ChIJexample${index}`,
      rating: Number((3.8 + Math.random() * 1.2).toFixed(1)), // Ratings between 3.8-5.0
      reviewCount: Math.floor(Math.random() * 300) + 25, // Review counts between 25-325
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueName)}`
    }
  };
}

// Convert raw venue data to Venue objects
console.log('🔍 Processing venue data:', venueData.length, 'venues');

// Sort venues by photo status first (venues with uploaded photos at top)
const sortedVenueData = sortVenuesByPhotos(venueData);

export const mockVenues: Venue[] = sortedVenueData
  .filter((venue: any) => venue && typeof venue === 'object' && venue.name)
  .map((venue: any, index: number): Venue => {
    const venueObj = {
      id: (index + 1).toString(),
      name: venue.name || `Venue ${index + 1}`,
      description: venue.style || venue.description || 'Beautiful wedding venue',
      address: {
        street: venue.address?.street || '', // Not provided in source data
        city: venue.location && typeof venue.location === 'string' 
          ? venue.location.split(',')[0]?.trim() || 'Miami'
          : 'Miami',
        state: 'FL',
        zipCode: venue.address?.zipCode || '33101', // Default
      },
      capacity: parseCapacity(venue.capacity),
      pricing: {
        startingPrice: parsePrice(venue.pricing),
        currency: 'USD' as const,
        packages: []
      },
      amenities: venue.servicesAmenities || venue.amenities || [],
      venueType: determineVenueType(venue.tags || []),
      tags: venue.tags || [],
      images: venue.images || [],
      contact: {
        email: `info@${(venue.name || 'venue').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`,
        phone: getVenuePhone(venue.name),
        website: venue.website || undefined,
      },
      owner: {
        id: `owner${index + 1}`,
        name: `Venue Manager ${index + 1}`,
        email: `manager${index + 1}@venuemanagement.com`,
        isPremium: false, // No premium venues yet
      },
      availability: [],
      createdAt: new Date(2024, 0, index + 1),
      updatedAt: new Date(2024, 0, index + 1),
      reviews: {
        rating: Number((4.0 + Math.random() * 1.0).toFixed(1)), // 4.0 - 5.0
        count: Math.floor(Math.random() * 50) + 10, // 10-60 reviews
        reviews: []
      },
      externalReviews: getExternalReviews(venue.name, index), // All venues now get Google reviews
    };

    // Log which venues have uploaded photos for debugging
    const hasPhotos = hasUploadedPhotos(venue);
    if (hasPhotos) {
      console.log(`📸 ${venue.name} has uploaded photos - prioritized in listing`);
    }

    return venueObj;
  });

// Add some featured venues for the homepage (prioritize those with uploaded photos)
function hasRealPhotos(venue: Venue): boolean {
  if (!venue.images || venue.images.length === 0) return false;
  
  // Check if any image is not a placeholder
  return venue.images.some(img => 
    !img.url.includes('venue-placeholder.svg') && 
    !img.url.includes('placeholder')
  );
}

const venuesWithPhotos = mockVenues.filter(venue => hasRealPhotos(venue));
const venuesWithoutPhotos = mockVenues.filter(venue => !hasRealPhotos(venue));

export const featuredVenues = [
  ...venuesWithPhotos.slice(0, 4), // First 4 with photos
  ...venuesWithoutPhotos.slice(0, 2) // Then 2 without photos to make 6 total
].slice(0, 6);

console.log('✅ mockVenues loaded successfully:', mockVenues.length, 'venues');
console.log('✅ featuredVenues loaded:', featuredVenues.length, 'venues');
console.log(`📊 Photo prioritization: ${venuesWithPhotos.length} venues with photos, ${venuesWithoutPhotos.length} with placeholders`);
