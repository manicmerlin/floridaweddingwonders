'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Venue } from '@/types';

interface VenueClaimButtonProps {
  venue: Venue;
}

export default function VenueClaimButton({ venue }: VenueClaimButtonProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const authToken = document.cookie.includes('auth-token') || localStorage.getItem('venueOwnerAuth');
      setIsAuthenticated(!!authToken);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleClaimClick = () => {
    if (!isAuthenticated) {
      // Store the return URL to redirect back after login
      localStorage.setItem('returnUrl', `/venues/${venue.id}/claim`);
      router.push('/login');
    } else {
      router.push(`/venues/${venue.id}/claim`);
    }
  };

  // Don't show button if venue is already claimed
  if (venue.claimStatus === 'claimed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              This venue is claimed!
            </h3>
            <p className="text-sm text-green-700 mt-1">
              This venue is managed by the business owner.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="animate-pulse flex items-center">
          <div className="h-5 w-5 bg-gray-300 rounded mr-3"></div>
          <div className="h-4 bg-gray-300 rounded w-48"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Own or manage this venue?
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Claim your venue listing to manage photos, information, and respond to reviews.
            </p>
            <button
              onClick={handleClaimClick}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {!isAuthenticated ? 'Sign In to Claim' : 'Claim This Venue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
