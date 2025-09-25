'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockVenues } from '../../../lib/mockData';
import { Venue } from '../../../types';
import Image from 'next/image';
import Link from 'next/link';

export default function VenueOwnerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [ownedVenues, setOwnedVenues] = useState<string[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'owned' | 'claim'>('owned');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Import auth functions dynamically to avoid SSR issues
    const checkAuth = async () => {
      try {
        const { getCurrentUser, isSuperAdmin } = await import('@/lib/auth');
        
        // Check for super admin first
        if (isSuperAdmin()) {
          const { user: authUser } = getCurrentUser();
          if (authUser) {
            console.log('Super admin detected, setting user:', authUser);
            setUser({
              id: authUser.id,
              email: authUser.email,
              role: 'super_admin',
              isSuperAdmin: true
            });
            // Super admin can manage all venues - set all venue IDs as owned
            const allVenueIds = mockVenues.map(v => v.id);
            setOwnedVenues(allVenueIds);
            setVenues(mockVenues);
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback to regular venue owner auth
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Load owned venues from localStorage
          const userVenues = localStorage.getItem(`owned-venues-${parsedUser.id}`) || '[]';
          setOwnedVenues(JSON.parse(userVenues));
        }
        
        setVenues(mockVenues);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add a small delay to ensure localStorage is ready
    setTimeout(checkAuth, 100);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    document.cookie = 'venue-owner-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/login');
  };

  const claimVenue = (venueId: string) => {
    const newOwnedVenues = [...ownedVenues, venueId];
    setOwnedVenues(newOwnedVenues);
    
    // Save to localStorage
    if (user) {
      localStorage.setItem(`owned-venues-${user.id}`, JSON.stringify(newOwnedVenues));
    }

    alert(`Venue claimed successfully! You can now manage this venue from your dashboard.`);
  };

  const getOwnedVenues = () => {
    return venues.filter(venue => ownedVenues.includes(venue.id));
  };

  const getClaimableVenues = () => {
    return venues.filter(venue => 
      !ownedVenues.includes(venue.id) && 
      (venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       venue.address.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading venue dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in as a venue owner to access your dashboard.</p>
          <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">SoFlo Venues</Link>
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Venue Owner Portal
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">Hello, {user.name}!</span>
              <Link href="/venues" className="text-gray-700 hover:text-gray-900 font-medium">
                Browse All Venues
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Venue Owner Dashboard 🏛️</h1>
          <p className="text-gray-600">Manage your venue listings and grow your wedding business</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{ownedVenues.length}</div>
            <div className="text-gray-600">Owned Venues</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {getOwnedVenues().filter(v => v.availability.isAvailable).length}
            </div>
            <div className="text-gray-600">Available Venues</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {venues.length - ownedVenues.length}
            </div>
            <div className="text-gray-600">Claimable Venues</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'owned', name: 'My Venues', icon: '🏛️', count: ownedVenues.length },
                { id: 'claim', name: 'Claim Venues', icon: '🔍', count: venues.length - ownedVenues.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                  <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Owned Venues Tab */}
            {activeTab === 'owned' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Your Venues</h2>
                  <button
                    onClick={() => setActiveTab('claim')}
                    className="text-blue-600 hover:text-blue-700 font-medium transition"
                  >
                    Claim More Venues →
                  </button>
                </div>

                {ownedVenues.length > 0 ? (
                  <div className="grid gap-6">
                    {getOwnedVenues().map((venue) => (
                      <OwnedVenueCard key={venue.id} venue={venue} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-6xl text-gray-400 mb-4">🏛️</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Venues Yet</h3>
                    <p className="text-gray-600 mb-4">Claim your venue listing to start managing your wedding business!</p>
                    <button
                      onClick={() => setActiveTab('claim')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
                    >
                      Claim Your Venue
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Claim Venues Tab */}
            {activeTab === 'claim' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Claim Your Venue</h2>
                  <p className="text-gray-600 mb-4">
                    Find your venue in our directory and claim it to start managing your listing.
                  </p>
                  <input
                    type="text"
                    placeholder="Search for your venue by name or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-4">
                  {getClaimableVenues().slice(0, 10).map((venue) => (
                    <ClaimableVenueCard
                      key={venue.id}
                      venue={venue}
                      onClaim={claimVenue}
                    />
                  ))}
                </div>

                {getClaimableVenues().length === 0 && searchTerm && (
                  <div className="text-center py-8 text-gray-600">
                    No venues found matching "{searchTerm}". Try a different search term.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Owned Venue Card Component
function OwnedVenueCard({ venue }: { venue: Venue }) {
  const primaryImage = venue.images?.find(img => img.isPrimary) || venue.images?.[0];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
      <div className="flex gap-6">
        {/* Image */}
        <div className="relative w-32 h-24 flex-shrink-0">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt}
              fill
              className="object-cover rounded-lg"
              sizes="128px"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-2xl">🏛️</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                venue.availability.isAvailable 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {venue.availability.isAvailable ? 'Available' : 'Unavailable'}
              </span>
              <Link
                href={`/admin/venues/${venue.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition"
              >
                Manage
              </Link>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">
            {venue.address.street}, {venue.address.city}, {venue.address.state}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <div className="font-medium capitalize">{venue.venueType}</div>
            </div>
            <div>
              <span className="text-gray-500">Capacity:</span>
              <div className="font-medium">{venue.capacity.min}-{venue.capacity.max}</div>
            </div>
            <div>
              <span className="text-gray-500">Starting Price:</span>
              <div className="font-medium">${venue.pricing.startingPrice.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-500">Images:</span>
              <div className="font-medium">{venue.images?.length || 0} photos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Claimable Venue Card Component
function ClaimableVenueCard({ 
  venue, 
  onClaim 
}: {
  venue: Venue;
  onClaim: (venueId: string) => void;
}) {
  const primaryImage = venue.images?.find(img => img.isPrimary) || venue.images?.[0];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition">
      <div className="flex gap-4 items-center">
        {/* Image */}
        <div className="relative w-20 h-16 flex-shrink-0">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt}
              fill
              className="object-cover rounded"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-400 text-lg">🏛️</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{venue.name}</h4>
          <p className="text-sm text-gray-600">
            {venue.address.city}, {venue.address.state} • {venue.capacity.min}-{venue.capacity.max} guests
          </p>
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize mt-1">
            {venue.venueType}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Link
            href={`/venues/${venue.id}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition"
          >
            View →
          </Link>
          <button
            onClick={() => onClaim(venue.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
          >
            Claim Venue
          </button>
        </div>
      </div>
    </div>
  );
}
