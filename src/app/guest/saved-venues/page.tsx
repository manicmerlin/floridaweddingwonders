'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import VenueCard from '../../../components/VenueCard';
import { FavoritesManager, SavedVenue } from '../../../lib/favorites';
import { mockVenues } from '../../../lib/mockData';
import { Venue } from '../../../types';

export default function SavedVenuesPage() {
  const [user, setUser] = useState<any>(null);
  const [savedVenues, setSavedVenues] = useState<SavedVenue[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Load saved venues
    const savedVenuesList = FavoritesManager.getSavedVenues(parsedUser.email);
    setSavedVenues(savedVenuesList);

    // Get full venue data for saved venues
    const venueDetails: Venue[] = [];
    savedVenuesList.forEach(saved => {
      const venueData = mockVenues.find(v => v.id === saved.venueId);
      if (venueData) {
        venueDetails.push(venueData);
      }
    });
    
    setVenues(venueDetails);
    setLoading(false);
  }, [router]);

  const handleRemoveVenue = (venueId: string) => {
    if (!user) return;
    
    FavoritesManager.removeSavedVenue(user.email, venueId);
    setSavedVenues(prev => prev.filter(v => v.venueId !== venueId));
    setVenues(prev => prev.filter(v => v.id !== venueId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view your saved venues</h2>
            <Link href="/login" className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Saved Venues</h1>
              <p className="text-gray-600">
                Venues you've saved for your special day ({savedVenues.length} venue{savedVenues.length !== 1 ? 's' : ''})
              </p>
            </div>
            <Link
              href="/venues" 
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Browse More Venues
            </Link>
          </div>
        </div>

        {/* Content */}
        {venues.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-pink-100 rounded-full mb-6">
              <span className="text-4xl">💕</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No saved venues yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start browsing venues and save the ones you love by clicking the heart icon. 
              They'll appear here so you can easily compare and revisit them.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/venues"
                className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition"
              >
                Browse Venues
              </Link>
              <Link
                href="/guest/dashboard"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Venue Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {venues.map((venue) => (
                <div key={venue.id} className="relative">
                  <VenueCard venue={venue} showFavorites={false} />
                  {/* Remove button overlay */}
                  <button
                    onClick={() => handleRemoveVenue(venue.id)}
                    className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition z-10"
                    title="Remove from saved venues"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Action Section */}
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to Contact Venues?</h3>
              <p className="text-gray-600 mb-6">
                Now that you've saved some venues, make sure your profile is complete to send qualified inquiries.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!user.leadQualification ? (
                  <Link
                    href="/guest/complete-profile"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Complete My Profile
                  </Link>
                ) : (
                  <span className="inline-flex items-center text-green-600 font-medium">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Profile Complete
                  </span>
                )}
                <Link
                  href="/guest/dashboard"
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
