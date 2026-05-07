export interface VenueMedia {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
  type: 'image' | 'video';
  thumbnailUrl?: string; // For videos, this is the generated thumbnail
  duration?: number; // For videos, duration in seconds
}

// Legacy interface for backward compatibility
export interface VenueImage extends VenueMedia {
  type: 'image';
}

export interface Venue {
  // `id` carries the legacy numeric id ("1".."129") for localStorage compat
  // (saved-venues, deleted-venues, photo storage). The Supabase UUID lives
  // in `uuid`. URLs are built from `slug`.
  id: string;
  slug: string;
  uuid?: string;
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
  tags?: string[];
  // Phase 3A — paid tier ('starter' | 'growth' | 'scale'). Drives badges,
  // listing sort, and per-tier feature flags (see src/lib/tierFeatures.ts).
  tier?: 'starter' | 'growth' | 'scale';
  tierExpiresAt?: string | null;
  // True iff there's an active row in venue_ownerships for this venue.
  // Drives the "show watercolor placeholder until claimed" rule on cards
  // and detail-page hero. Set by decorateVenuesWithClaims() in catalog.ts;
  // undefined when the caller didn't decorate (treat as unclaimed/safe).
  isClaimed?: boolean;
  images?: VenueImage[]; // Legacy field for images only
  media?: VenueMedia[]; // New field for mixed media (images + videos)
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
  externalReviews?: {
    google?: {
      placeId?: string;
      rating?: number;
      reviewCount?: number;
      url?: string;
    };
    yelp?: {
      businessId?: string;
      rating?: number;
      reviewCount?: number;
      url?: string;
    };
    theKnot?: {
      rating?: number;
      reviewCount?: number;
      url?: string;
    };
    weddingWire?: {
      rating?: number;
      reviewCount?: number;
      url?: string;
    };
  };
  owner: {
    id: string;
    name: string;
    email: string;
    isPremium: boolean;
  };
  /** ISO timestamp from venues.updated_at. Surfaced as a "Last updated"
   *  trust signal on venue detail. Populated by rowToVenue in catalog.ts. */
  updatedAt?: string;
  /** Track 2 — sub-neighborhood label (e.g. "South Beach", "Hyde Park").
   *  Free-form text — the dropdown derives options from the live data set
   *  scoped by the selected city/region. Optional; many venues stay null
   *  where assignment isn't confident. */
  neighborhood?: string;
  /** Track 2 — Florida-Ready preparedness fields. All optional. The
   *  detail-page panel renders only when ≥1 is populated. Owners self-
   *  populate via the dashboard (Phase 4); seeded data leaves these null. */
  generatorBackup?: boolean;
  acTentAvailable?: boolean;
  indoorFallbackCapacity?: number;
  stormPolicyText?: string;
  claimStatus: 'unclaimed' | 'pending' | 'claimed' | 'rejected';
  claimedBy?: {
    userId: string;
    email: string;
    claimedAt: string;
    approvedAt?: string;
    approvedBy?: string;
  };
  claimHistory?: Array<{
    userId: string;
    email: string;
    claimedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    processedAt?: string;
    processedBy?: string;
    notes?: string;
  }>;
}

export interface LeadQualificationData {
  fullName: string;
  email: string;
  phoneNumber: string;
  eventType: string;
  guestCount: number;
  preferredDate: string;
  dateFlexibility: string;
  venuebudget: string;
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
  leadQualification?: LeadQualificationData; // Pre-qualifying data for venue seekers
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
  // legacy_id (kebab string from JSON) for compat. UUID in `uuid`.
  id: string;
  slug: string;
  uuid?: string;
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

// ---------------------------------------------------------------------------
// Suit Shops — sibling category to DressShop. Same shape, different shop_type
// vocabulary (bespoke/tuxedo-rental/suit-boutique/made-to-measure/formalwear).
// ---------------------------------------------------------------------------

export interface SuitShopImage {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
}

export interface SuitShop {
  id: string;
  slug: string;
  uuid?: string;
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
  shopType:
    | 'bespoke-tailor'
    | 'tuxedo-rental'
    | 'suit-boutique'
    | 'made-to-measure'
    | 'formalwear';
  specialties: string[];
  tags?: string[];
  images?: SuitShopImage[];
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
    [key: string]: string;
  };
  services: string[];
  brands: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SuitShopFilters {
  location?: string;
  shopType?: SuitShop['shopType'];
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

// Venue claiming interfaces
export interface VenueClaim {
  id: string;
  venueId: string;
  venueName: string;
  userId: string;
  userEmail: string;
  userName: string;
  businessName?: string;
  businessType?: string;
  phoneNumber?: string;
  businessAddress?: string;
  relationshipToVenue?: string;
  status: 'pending' | 'approved' | 'denied';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  adminNotes?: string;
  businessProof?: {
    document: string;
    documentType: 'business_license' | 'tax_id' | 'lease_agreement' | 'other';
    uploadedAt: string;
  };
}

export interface ClaimSubmission {
  venueId: string;
  userEmail: string;
  userName: string;
  businessName: string;
  businessType: string;
  businessProof?: File;
  additionalNotes?: string;
}

export interface Vendor {
  // legacy_id (kebab string from JSON) for compat. UUID in `uuid`.
  id: string;
  slug: string;
  uuid?: string;
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
