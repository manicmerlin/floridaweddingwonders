'use client';

import { useState } from 'react';
import { Venue } from '../types';

interface ReviewsSectionProps {
  venue: Venue;
}

interface ReviewPlatform {
  name: string;
  displayName: string;
  rating: number | null;
  reviewCount: number | null;
  url: string | null;
  icon: string;
  hasData: boolean;
}

export default function ReviewsSection({ venue }: ReviewsSectionProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Extract review data from venue
  const platforms: ReviewPlatform[] = [
    {
      name: 'google',
      displayName: 'Google Reviews',
      rating: venue.externalReviews?.google?.rating || null,
      reviewCount: venue.externalReviews?.google?.reviewCount || null,
      url: venue.externalReviews?.google?.url || null,
      icon: '🔍',
      hasData: !!(venue.externalReviews?.google?.reviewCount)
    }
  ];

  const handlePlatformClick = (platform: ReviewPlatform) => {
    if (platform.url) {
      window.open(platform.url, '_blank', 'noopener,noreferrer');
    }
  };

  const refreshReviews = async () => {
    setIsLoading(true);
    try {
      // Call API to refresh review data
      const response = await fetch(`/api/reviews/refresh?venueId=${venue.id}`);
      if (response.ok) {
        // Reload the page to show updated reviews
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to refresh reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Customer Reviews</h3>
        <button
          onClick={refreshReviews}
          disabled={isLoading}
          className="text-sm text-pink-600 hover:text-pink-700 disabled:opacity-50"
        >
          {isLoading ? '🔄 Updating...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Single Google Review Card */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          {platforms.map((platform, index) => (
            <div key={platform.name} className="text-center">
              {/* Platform Icon/Status */}
              <div
                onClick={() => handlePlatformClick(platform)}
                className={`
                  w-16 h-16 mx-auto rounded-lg flex items-center justify-center text-white text-xl font-semibold cursor-pointer transition-all duration-200 hover:scale-105 shadow-lg mb-4
                  ${platform.hasData 
                    ? 'bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600' 
                    : 'bg-gray-300 hover:bg-gray-400'
                  }
                  ${!platform.url ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span className="text-2xl">{platform.icon}</span>
              </div>

              {/* Platform Name */}
              <div className="text-center">
                <div className={`text-lg font-medium mb-2 ${platform.hasData ? 'text-gray-900' : 'text-gray-500'}`}>
                  {platform.displayName}
                </div>
                
                {/* Rating Info */}
                {platform.hasData && platform.reviewCount ? (
                  <div className="mb-3">
                    <div className="text-lg font-bold text-orange-600 mb-1">
                      {platform.reviewCount.toLocaleString()} reviews
                    </div>
                    <div className="text-sm text-gray-600">
                      View on Google
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <div className="text-lg text-gray-400">No reviews</div>
                    <div className="text-sm text-gray-400">yet</div>
                  </div>
                )}

                {/* Click indicator */}
                {platform.url && (
                  <div className="text-sm text-gray-400 opacity-75">
                    Click to view reviews
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Summary */}
      <div className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
              ⭐
            </div>
            <div>
              <div className="text-sm text-gray-600">Overall Venue Rating</div>
              <div className="text-lg font-semibold text-gray-900">
                {venue.reviews.rating.toFixed(1)} ⭐
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Based on {venue.reviews.count} internal reviews
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {platforms.filter(p => p.hasData).length > 0 ? 'External reviews available' : 'No external reviews yet'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
