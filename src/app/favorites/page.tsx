'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import VenueCard from '@/components/VenueCard';
import { mockVenues } from '@/lib/mockData';

export default function FavoritesPage() {
  const [favoriteVenues, setFavoriteVenues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      // Store return URL and redirect to login
      localStorage.setItem('returnUrl', '/favorites');
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Load favorite venues
    const favorites = localStorage.getItem('favorites');
    if (favorites) {
      try {
        const favoriteIds = JSON.parse(favorites);
        const favoriteVenuesList = mockVenues.filter(venue => 
          favoriteIds.includes(venue.id)
        );
        setFavoriteVenues(favoriteVenuesList);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }

    setIsLoading(false);
  }, [router]);

  const handleRemoveFavorite = (venueId: string) => {
    // Remove from localStorage
    const favorites = localStorage.getItem('favorites');
    if (favorites) {
      try {
        const favoriteIds = JSON.parse(favorites);
        const updatedIds = favoriteIds.filter((id: string) => id !== venueId);
        localStorage.setItem('favorites', JSON.stringify(updatedIds));
        
        // Update state
        setFavoriteVenues(prev => prev.filter(venue => venue.id !== venueId));
      } catch (error) {
        console.error('Error removing favorite:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              💖 My Saved Venues
            </h1>
            <p className="text-lg text-gray-600">
              {user?.name ? `Welcome back, ${user.name}!` : 'Your favorite venues'} You have {favoriteVenues.length} saved venue{favoriteVenues.length !== 1 ? 's' : ''}.
            </p>
          </div>

          {/* Favorites Grid */}
          {favoriteVenues.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-100 rounded-full mb-4">
                <span className="text-4xl">💝</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No Saved Venues Yet
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start exploring venues and click the heart icon to save your favorites here.
              </p>
              <button
                onClick={() => router.push('/venues')}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Venues
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteVenues.map((venue) => (
                <div key={venue.id} className="relative">
                  <VenueCard venue={venue} />
                  <button
                    onClick={() => handleRemoveFavorite(venue.id)}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-red-50 text-red-500 p-2 rounded-full shadow-lg transition z-10"
                    title="Remove from favorites"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tips Section */}
          {favoriteVenues.length > 0 && (
            <div className="mt-12 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                💡 Next Steps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl mb-2">📧</div>
                  <h4 className="font-semibold text-gray-900 mb-1">Contact Venues</h4>
                  <p className="text-sm text-gray-600">
                    Reach out to your favorites to check availability and pricing
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl mb-2">📅</div>
                  <h4 className="font-semibold text-gray-900 mb-1">Schedule Tours</h4>
                  <p className="text-sm text-gray-600">
                    Book venue tours to see them in person before deciding
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl mb-2">💰</div>
                  <h4 className="font-semibold text-gray-900 mb-1">Compare Options</h4>
                  <p className="text-sm text-gray-600">
                    Use your saved list to compare features and make the best choice
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
