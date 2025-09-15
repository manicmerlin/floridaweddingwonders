// Authentication and venue ownership utilities

export interface VenueOwnerAuth {
  id: string;
  email: string;
  venueId: string | 'all'; // 'all' for super admin
  isVerified: boolean;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  photoLimit: number;
  claimedAt: string;
  role: 'venue_owner' | 'super_admin';
}

export interface AuthSession {
  user: VenueOwnerAuth | null;
  isAuthenticated: boolean;
}

// Mock venue ownership data (in production, this would be in a database)
const VENUE_OWNERS: VenueOwnerAuth[] = [
  {
    id: 'super-admin-1',
    email: 'admin@floridaweddingwonders.com',
    venueId: 'all', // Can manage all venues
    isVerified: true,
    subscriptionTier: 'enterprise',
    photoLimit: 1000, // Unlimited essentially
    claimedAt: '2025-09-01T00:00:00Z',
    role: 'super_admin'
  },
  {
    id: 'owner-1',
    email: 'manager@curtissmansion.com',
    venueId: '11', // Curtiss Mansion
    isVerified: true,
    subscriptionTier: 'free',
    photoLimit: 2,
    claimedAt: '2025-09-10T10:00:00Z',
    role: 'venue_owner'
  },
  {
    id: 'owner-2', 
    email: 'owner@hialeahpark.com',
    venueId: '1', // Hialeah Park Racing & Casino
    isVerified: true,
    subscriptionTier: 'premium',
    photoLimit: 50,
    claimedAt: '2025-09-08T15:30:00Z',
    role: 'venue_owner'
  }
];

export function getCurrentUser(): AuthSession {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }

  try {
    // Check for venue owner authentication cookie
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => 
      cookie.trim().startsWith('venue-owner-auth=')
    );

    if (!authCookie) {
      return { user: null, isAuthenticated: false };
    }

    // Extract user ID from cookie (in production, this would be a JWT)
    const authValue = authCookie.split('=')[1];
    if (authValue === 'authenticated') {
      // For demo purposes, get user from email stored in another cookie
      const emailCookie = cookies.find(cookie => 
        cookie.trim().startsWith('venue-owner-email=')
      );
      
      if (emailCookie) {
        const email = decodeURIComponent(emailCookie.split('=')[1]);
        const user = VENUE_OWNERS.find(owner => owner.email === email);
        
        if (user) {
          return { user, isAuthenticated: true };
        }
      }
    }

    return { user: null, isAuthenticated: false };
  } catch (error) {
    console.error('Auth error:', error);
    return { user: null, isAuthenticated: false };
  }
}

export function canManageVenue(venueId: string): boolean {
  const { user, isAuthenticated } = getCurrentUser();
  
  if (!isAuthenticated || !user) {
    return false;
  }

  // Super admin can manage all venues
  if (user.role === 'super_admin' && user.venueId === 'all') {
    return true;
  }

  // Regular venue owner can only manage their specific venue
  return user.venueId === venueId && user.isVerified;
}

export function getPhotoLimit(venueId: string): number {
  const { user, isAuthenticated } = getCurrentUser();
  
  if (!isAuthenticated || !user) {
    return 0; // No access
  }

  // Super admin gets unlimited photos
  if (user.role === 'super_admin') {
    return user.photoLimit;
  }

  // Regular venue owner can only access their venue
  if (user.venueId !== venueId) {
    return 0; // No access to other venues
  }

  return user.photoLimit;
}

export function isSuperAdmin(): boolean {
  const { user, isAuthenticated } = getCurrentUser();
  return isAuthenticated && user?.role === 'super_admin' && user?.venueId === 'all';
}

export function loginAsVenueOwner(email: string, venueId: string): boolean {
  // Check for super admin first
  const superAdmin = VENUE_OWNERS.find(o => o.email === email && o.role === 'super_admin');
  if (superAdmin) {
    // Set authentication cookies for super admin
    document.cookie = 'venue-owner-auth=authenticated; path=/; max-age=86400'; // 24 hours
    document.cookie = `venue-owner-email=${encodeURIComponent(email)}; path=/; max-age=86400`;
    return true;
  }

  // Check for specific venue owner
  const owner = VENUE_OWNERS.find(o => o.email === email && o.venueId === venueId);
  
  if (owner) {
    // Set authentication cookies
    document.cookie = 'venue-owner-auth=authenticated; path=/; max-age=86400'; // 24 hours
    document.cookie = `venue-owner-email=${encodeURIComponent(email)}; path=/; max-age=86400`;
    return true;
  }
  
  return false;
}

export function logout(): void {
  document.cookie = 'venue-owner-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  document.cookie = 'venue-owner-email=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
}

export function upgradeSubscription(venueId: string, newTier: 'premium' | 'enterprise'): boolean {
  const { user } = getCurrentUser();
  
  if (!user || user.venueId !== venueId) {
    return false;
  }

  // In production, this would update the database
  const ownerIndex = VENUE_OWNERS.findIndex(o => o.id === user.id);
  if (ownerIndex !== -1) {
    VENUE_OWNERS[ownerIndex].subscriptionTier = newTier;
    VENUE_OWNERS[ownerIndex].photoLimit = newTier === 'premium' ? 50 : 100;
    return true;
  }
  
  return false;
}

// Get available venue owners for demo purposes
export function getAvailableVenueOwners(): Array<{ email: string; venueId: string; venueName: string }> {
  return [
    { email: 'admin@floridaweddingwonders.com', venueId: 'all', venueName: 'Super Admin (All Venues)' },
    { email: 'manager@curtissmansion.com', venueId: '11', venueName: 'Curtiss Mansion' },
    { email: 'owner@hialeahpark.com', venueId: '1', venueName: 'Hialeah Park Racing & Casino' },
  ];
}
