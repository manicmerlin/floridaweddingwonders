export interface VenueImage {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
  type?: 'image' | 'video'; // Add type to support both images and videos
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  venueType: 'beach' | 'garden' | 'ballroom' | 'historic' | 'modern' | 'rustic';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  capacity: {
    min: number;
    max: number;
  };
  pricing: {
    startingPrice: number;
    packages: any[];
  };
  amenities: string[];
  images?: VenueImage[];
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  availability: any[];
  reviews: {
    rating: number;
    count: number;
    reviews: any[];
  };
  owner: {
    id: string;
    name: string;
    email: string;
    isPremium: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'venue_owner' | 'admin' | 'guest';
  subscription: {
    type: 'free' | 'premium';
    expiresAt?: Date;
  };
  venues: string[]; // venue IDs (for venue owners)
  favorites: string[]; // venue IDs (for guests)
  profileComplete: boolean;
  emailVerified: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'venue_owner' | 'admin' | 'guest';
  isAuthenticated: boolean;
}

export interface DressShopImage {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
}

export interface DressShop {
  id: string;
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  priceRange: {
    min: number;
    max: number;
  };
  shopType: 'boutique' | 'department' | 'designer' | 'consignment' | 'vintage' | 'plus-size';
  specialties: string[];
  tags?: string[];
  images?: DressShopImage[];
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  owner: {
    id: string;
    name: string;
    isPremium: boolean;
  };
  hours: {
    [key: string]: string; // e.g., "monday": "9am-7pm"
  };
  services: string[];
  brands: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchFilters {
  location?: string;
  minCapacity?: number;
  maxCapacity?: number;
  venueType?: Venue['venueType'];
  maxPrice?: number;
  amenities?: string[];
}

export interface DressShopFilters {
  location?: string;
  shopType?: DressShop['shopType'];
  minPrice?: number;
  maxPrice?: number;
  specialties?: string[];
  brands?: string[];
}

export interface VendorImage {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  businessName?: string; // If different from name
  description: string;
  category: 'photographer' | 'videographer' | 'florist' | 'dj' | 'band' | 'caterer' | 'baker' | 'planner' | 'decorator' | 'transportation' | 'officiant' | 'hair-makeup' | 'entertainment' | 'other';
  subcategory?: string; // e.g., "wedding photographer", "corporate DJ"
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode?: string;
    serviceArea?: string[]; // Areas they serve
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  priceRange: {
    min: number;
    max: number;
    unit?: 'hour' | 'day' | 'event' | 'package'; // Pricing structure
  };
  specialties: string[];
  tags?: string[];
  images?: VendorImage[];
  portfolio?: {
    featuredImages: string[];
    videoReel?: string;
  };
  contact: {
    email: string;
    phone: string;
    website?: string;
    socialMedia?: {
      instagram?: string;
      facebook?: string;
      tiktok?: string;
      youtube?: string;
      pinterest?: string;
      twitter?: string;
    };
  };
  owner: {
    id: string;
    name: string;
    isPremium: boolean;
  };
  availability: {
    bookingLeadTime?: number; // Days in advance needed
    seasonalAvailability?: string[];
    weekendPremium?: number; // Percentage increase for weekends
  };
  services: string[];
  equipment?: string[]; // For DJs, photographers, etc.
  certifications?: string[];
  yearsInBusiness?: number;
  teamSize?: number;
  awards?: string[];
  reviews?: {
    averageRating: number;
    totalReviews: number;
    platforms: string[]; // "Google", "WeddingWire", "The Knot"
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorFilters {
  location?: string;
  category?: Vendor['category'];
  minPrice?: number;
  maxPrice?: number;
  specialties?: string[];
  serviceArea?: string;
}
