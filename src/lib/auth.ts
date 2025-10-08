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
    // Check localStorage for authentication
    const isAuthenticated = localStorage.getItem('isSuperAdmin') === 'true' || localStorage.getItem('isAuthenticated') === 'true';
    const userEmail = localStorage.getItem('userEmail');

    if (!isAuthenticated || !userEmail) {
      return { user: null, isAuthenticated: false };
    }

    const user = VENUE_OWNERS.find(owner => owner.email === userEmail);
    
    if (user) {
      return { user, isAuthenticated: true };
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
  if (typeof window === 'undefined') {
    console.log('isSuperAdmin: window undefined (SSR)');
    return false;
  }
  
  // Check localStorage directly for super admin status
  const isSuperAdminFlag = localStorage.getItem('isSuperAdmin') === 'true';
  const userEmail = localStorage.getItem('userEmail');
  
  console.log('isSuperAdmin check:', { isSuperAdminFlag, userEmail });
  
  if (isSuperAdminFlag && userEmail) {
    const user = VENUE_OWNERS.find(owner => owner.email === userEmail && owner.role === 'super_admin');
    console.log('Found user:', user);
    return !!user;
  }
  
  console.log('isSuperAdmin: returning false');
  return false;
}

export function loginAsVenueOwner(email: string, venueId?: string): boolean {
  // Check for super admin first
  const superAdmin = VENUE_OWNERS.find(o => o.email === email && o.role === 'super_admin');
  if (superAdmin) {
    // Set localStorage for super admin
    localStorage.setItem('isSuperAdmin', 'true');
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', email);
    
    // Also set cookies for server-side middleware
    document.cookie = 'venue-owner-auth=authenticated; path=/; max-age=86400';
    document.cookie = `venue-owner-email=${encodeURIComponent(email)}; path=/; max-age=86400`;
    return true;
  }

  // Check for specific venue owner
  const owner = VENUE_OWNERS.find(o => o.email === email && (venueId ? o.venueId === venueId : true));
  
  if (owner) {
    // Set localStorage for regular venue owner
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isSuperAdmin', 'false');
    
    // Also set cookies for server-side middleware
    document.cookie = 'venue-owner-auth=authenticated; path=/; max-age=86400';
    document.cookie = `venue-owner-email=${encodeURIComponent(email)}; path=/; max-age=86400`;
    return true;
  }
  
  return false;
}

export function logout(): void {
  // Clear localStorage
  localStorage.removeItem('isSuperAdmin');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('user');
  
  // Clear cookies
  document.cookie = 'venue-owner-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  document.cookie = 'venue-owner-email=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  
  // Sign out from Supabase
  if (typeof window !== 'undefined') {
    import('@supabase/supabase-js').then(({ createClient }) => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aflrmpkolumpjhpaxblz.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmbHJtcGtvbHVtcGpocGF4Ymx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0MjcyMTIsImV4cCI6MjA0MjAwMzIxMn0.y7cCU7LNcanterUpMPU6j5rO_hWJlgEYF3z9FRw00LU'
      );
      supabase.auth.signOut();
    });
  }
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
