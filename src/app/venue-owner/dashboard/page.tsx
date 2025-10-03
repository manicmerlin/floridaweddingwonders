'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockVenues } from '../../../lib/mockData';
import { Venue } from '../../../types';
import Image from 'next/image';
import Link from 'next/link';

// Helper function to check if a venue has been deleted
async function isVenueDeleted(venueId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check database first
    const { isVenueDeletedInDatabase } = await import('@/lib/supabaseDeletedVenues');
    const deletedInDb = await isVenueDeletedInDatabase(venueId);
    if (deletedInDb) return true;
    
    // Fallback to localStorage
    const deletedVenuesKey = 'deleted-venues';
    const deletedVenues = JSON.parse(localStorage.getItem(deletedVenuesKey) || '[]');
    return deletedVenues.includes(venueId);
  } catch (error) {
    console.error('Error checking if venue is deleted:', error);
    // Fallback to localStorage only
    try {
      const deletedVenuesKey = 'deleted-venues';
      const deletedVenues = JSON.parse(localStorage.getItem(deletedVenuesKey) || '[]');
      return deletedVenues.includes(venueId);
    } catch {
      return false;
    }
  }
}

export default function VenueOwnerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [ownedVenues, setOwnedVenues] = useState<string[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'owned' | 'claim' | 'claims' | 'deleted'>('owned');
  const [isLoading, setIsLoading] = useState(true);
  const [userClaims, setUserClaims] = useState<any[]>([]);
  const [deletedVenues, setDeletedVenues] = useState<any[]>([]);
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
            // Super admin can manage all venues - filter out deleted venues
            const activeVenues = [];
            for (const v of mockVenues) {
              const deleted = await isVenueDeleted(v.id);
              if (!deleted) activeVenues.push(v);
            }
            const allVenueIds = activeVenues.map(v => v.id);
            setOwnedVenues(allVenueIds);
            setVenues(activeVenues);
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback to regular venue owner auth
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Load owned venues from localStorage and filter out deleted ones
          const userVenues = localStorage.getItem(`owned-venues-${parsedUser.id}`) || '[]';
          const ownedIds = JSON.parse(userVenues);
          const activeOwnedIds = [];
          for (const id of ownedIds) {
            const deleted = await isVenueDeleted(id);
            if (!deleted) activeOwnedIds.push(id);
          }
          setOwnedVenues(activeOwnedIds);
        }
        
        // Filter out deleted venues from all venues
        const activeVenues = [];
        for (const v of mockVenues) {
          const deleted = await isVenueDeleted(v.id);
          if (!deleted) activeVenues.push(v);
        }
        setVenues(activeVenues);
        
        // Load user claims if authenticated
        if (userData || user) {
          loadUserClaims();
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadUserClaims = async () => {
      try {
        const response = await fetch('/api/claims');
        if (response.ok) {
          const result = await response.json();
          // Filter claims for the current user
          const userSpecificClaims = result.claims?.filter((claim: any) => 
            claim.userEmail === user?.email || claim.userId === user?.id
          ) || [];
          setUserClaims(userSpecificClaims);
        }
      } catch (error) {
        console.error('Failed to load user claims:', error);
      }
    };

    const loadDeletedVenues = async () => {
      try {
        const { getDeletedVenues } = await import('@/lib/supabaseDeletedVenues');
        const deleted = await getDeletedVenues();
        setDeletedVenues(deleted);
        console.log('Loaded deleted venues:', deleted);
      } catch (error) {
        console.error('Failed to load deleted venues:', error);
        // Fallback to localStorage
        try {
          const localDeleted = JSON.parse(localStorage.getItem('deleted-venues') || '[]');
          const deletedData = localDeleted.map((id: string) => {
            const venue = mockVenues.find(v => v.id === id);
            return {
              id: `local-${id}`,
              venue_id: id,
              venue_name: venue?.name || 'Unknown Venue',
              deleted_at: new Date().toISOString(),
              deleted_by: 'unknown'
            };
          });
          setDeletedVenues(deletedData);
        } catch (localError) {
          console.error('Failed to load from localStorage:', localError);
        }
      }
    };
    
    // Load deleted venues
    loadDeletedVenues();
    
    // Add a small delay to ensure localStorage is ready
    setTimeout(checkAuth, 100);
  }, [user?.email, user?.id]);

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
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{venues.length}</div>
            <div className="text-gray-600">Total Venues</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {venues.filter(v => v.claimStatus === 'claimed').length}
            </div>
            <div className="text-gray-600">Claimed</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">
              {venues.filter(v => v.claimStatus === 'pending').length}
            </div>
            <div className="text-gray-600">Pending Claims</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-600">
              {venues.filter(v => v.claimStatus === 'unclaimed').length}
            </div>
            <div className="text-gray-600">Unclaimed</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'owned', name: 'My Venues', icon: '🏛️', count: ownedVenues.length },
                { id: 'claims', name: 'My Claims', icon: '📋', count: userClaims.length },
                { id: 'claim', name: 'Claim Venues', icon: '🔍', count: venues.length - ownedVenues.length },
                { id: 'deleted', name: 'Deleted Venues', icon: '🗑️', count: deletedVenues.length }
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

            {/* My Claims Tab */}
            {activeTab === 'claims' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">My Venue Claims</h2>
                  <p className="text-gray-600">
                    Track the status of your venue claim requests.
                  </p>
                </div>

                {userClaims.length > 0 ? (
                  <div className="space-y-4">
                    {userClaims.map((claim) => (
                      <div key={claim.id} className="bg-white border rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{claim.venueName}</h3>
                            <p className="text-sm text-gray-600">Claim ID: {claim.id}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              claim.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : claim.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {claim.status === 'pending' ? 'Under Review' :
                               claim.status === 'approved' ? 'Approved' :
                               'Denied'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-500">Submitted:</span>
                            <div className="font-medium">
                              {new Date(claim.submittedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                          {claim.reviewedAt && (
                            <div>
                              <span className="text-gray-500">Reviewed:</span>
                              <div className="font-medium">
                                {new Date(claim.reviewedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {claim.notes && (
                          <div className="mb-3">
                            <span className="text-gray-500 text-sm">Your Notes:</span>
                            <p className="text-gray-700 text-sm mt-1">{claim.notes}</p>
                          </div>
                        )}

                        {claim.adminNotes && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <span className="text-blue-700 font-medium text-sm">Admin Response:</span>
                            <p className="text-blue-700 text-sm mt-1">{claim.adminNotes}</p>
                          </div>
                        )}

                        {claim.status === 'pending' && (
                          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-yellow-800 text-sm">
                                Your claim is being reviewed. We'll email you when there's an update.
                              </span>
                            </div>
                          </div>
                        )}

                        {claim.status === 'approved' && (
                          <div className="mt-4 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-green-800 text-sm">
                                Congratulations! Your claim has been approved.
                              </span>
                            </div>
                            <Link
                              href={`/venues/${claim.venueId}/manage`}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium transition"
                            >
                              Manage Venue
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-6xl text-gray-400 mb-4">📋</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Claims Submitted</h3>
                    <p className="text-gray-600 mb-4">You haven't submitted any venue claims yet.</p>
                    <button
                      onClick={() => setActiveTab('claim')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
                    >
                      Claim Your First Venue
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

            {/* Deleted Venues Tab */}
            {activeTab === 'deleted' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">🗑️ Deleted Venues</h2>
                  <p className="text-gray-600">
                    View and restore recently deleted venues.
                  </p>
                </div>

                {deletedVenues.length > 0 ? (
                  <div className="space-y-4">
                    {deletedVenues.map((deleted) => (
                      <DeletedVenueCard
                        key={deleted.id}
                        deleted={deleted}
                        onRestore={async () => {
                          const { restoreVenue } = await import('@/lib/supabaseDeletedVenues');
                          const success = await restoreVenue(deleted.venue_id);
                          if (success) {
                            // Remove from localStorage
                            const localDeleted = JSON.parse(localStorage.getItem('deleted-venues') || '[]');
                            const updated = localDeleted.filter((id: string) => id !== deleted.venue_id);
                            localStorage.setItem('deleted-venues', JSON.stringify(updated));
                            
                            // Reload deleted venues
                            const { getDeletedVenues } = await import('@/lib/supabaseDeletedVenues');
                            const newDeleted = await getDeletedVenues();
                            setDeletedVenues(newDeleted);
                            
                            alert('Venue restored successfully!');
                            window.location.reload();
                          } else {
                            alert('Failed to restore venue.');
                          }
                        }}
                        onPermanentDelete={async () => {
                          const confirmed = confirm(
                            `⚠️ PERMANENT DELETE\n\n` +
                            `Are you sure you want to PERMANENTLY delete "${deleted.venue_name}"?\n\n` +
                            `This will:\n` +
                            `• Remove all photos from storage\n` +
                            `• Delete all venue data\n` +
                            `• Cannot be undone\n\n` +
                            `Continue?`
                          );
                          
                          if (!confirmed) return;
                          
                          const { permanentlyDeleteVenue } = await import('@/lib/supabaseDeletedVenues');
                          const success = await permanentlyDeleteVenue(deleted.venue_id);
                          if (success) {
                            // Remove from localStorage
                            const localDeleted = JSON.parse(localStorage.getItem('deleted-venues') || '[]');
                            const updated = localDeleted.filter((id: string) => id !== deleted.venue_id);
                            localStorage.setItem('deleted-venues', JSON.stringify(updated));
                            
                            // Reload deleted venues
                            const { getDeletedVenues } = await import('@/lib/supabaseDeletedVenues');
                            const newDeleted = await getDeletedVenues();
                            setDeletedVenues(newDeleted);
                            
                            alert('Venue permanently deleted.');
                          } else {
                            alert('Failed to permanently delete venue.');
                          }
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-6xl block mb-4">✨</span>
                    <p className="text-lg">No deleted venues</p>
                    <p className="text-sm mt-2">Deleted venues will appear here and can be restored.</p>
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
                venue.claimStatus === 'claimed' 
                  ? 'bg-green-100 text-green-800' 
                  : venue.claimStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {venue.claimStatus === 'claimed' ? 'Claimed' : 
                 venue.claimStatus === 'pending' ? 'Pending' : 'Unclaimed'}
              </span>
              <Link
                href={`/venues/${venue.id}/manage`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition"
              >
                Manage
              </Link>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-2">
            {venue.address.street}, {venue.address.city}, {venue.address.state}
          </p>
          
          {venue.claimStatus === 'claimed' && venue.claimedBy && (
            <p className="text-blue-600 text-sm mb-3">
              <span className="font-medium">Claimed by:</span> {venue.claimedBy.email}
              {venue.claimedBy.claimedAt && (
                <span className="text-gray-500 ml-2">
                  ({new Date(venue.claimedBy.claimedAt).toLocaleDateString()})
                </span>
              )}
            </p>
          )}
          
          {venue.claimStatus === 'pending' && venue.claimedBy && (
            <p className="text-yellow-600 text-sm mb-3">
              <span className="font-medium">Claim pending:</span> {venue.claimedBy.email}
            </p>
          )}
          
          {venue.claimStatus === 'unclaimed' && (
            <p className="text-gray-500 text-sm mb-3 italic">
              No claim submitted for this venue
            </p>
          )}
          
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

// Deleted Venue Card Component
function DeletedVenueCard({
  deleted,
  onRestore,
  onPermanentDelete
}: {
  deleted: any;
  onRestore: () => void;
  onPermanentDelete: () => void;
}) {
  return (
    <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl">🗑️</span>
            <h3 className="text-lg font-semibold text-gray-900">{deleted.venue_name}</h3>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              <span className="font-medium">Deleted:</span>{' '}
              {new Date(deleted.deleted_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p>
              <span className="font-medium">Venue ID:</span> {deleted.venue_id}
            </p>
            {deleted.reason && (
              <p>
                <span className="font-medium">Reason:</span> {deleted.reason}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <button
            onClick={onRestore}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition flex items-center space-x-1"
          >
            <span>♻️</span>
            <span>Restore</span>
          </button>
          <button
            onClick={onPermanentDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
          >
            Permanent Delete
          </button>
        </div>
      </div>

      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-start">
          <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-yellow-800 text-sm">
            Deleted venues are hidden from public view but can be restored. Use "Permanent Delete" to remove all data including photos.
          </span>
        </div>
      </div>
    </div>
  );
}
