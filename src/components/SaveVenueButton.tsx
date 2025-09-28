'use client';

import React, { useState, useEffect } from 'react';
import { FavoritesManager } from '../lib/favorites';
import { Venue } from '../types';

interface SaveVenueButtonProps {
  venue: Venue;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const SaveVenueButton: React.FC<SaveVenueButtonProps> = ({ 
  venue, 
  className = '', 
  size = 'md',
  showText = false 
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsSaved(FavoritesManager.isVenueSaved(parsedUser.email, venue.id));
    }
  }, [venue.id]);

  const handleToggleSave = () => {
    if (!user) {
      // Save the current page to return to after login
      localStorage.setItem('returnUrl', window.location.pathname);
      window.location.href = '/login';
      return;
    }

    setIsLoading(true);
    
    try {
      const newSavedState = FavoritesManager.toggleVenue(user.email, venue);
      setIsSaved(newSavedState);
      
      // Show brief feedback
      if (newSavedState) {
        // Could add a toast notification here
        console.log(`Saved ${venue.name} to favorites`);
      } else {
        console.log(`Removed ${venue.name} from favorites`);
      }
    } catch (error) {
      console.error('Error toggling venue save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg'
  };

  const buttonClasses = `
    inline-flex items-center justify-center rounded-full border-2 transition-all duration-200
    ${isSaved 
      ? 'bg-pink-100 border-pink-500 text-pink-600 hover:bg-pink-200' 
      : 'bg-white border-gray-300 text-gray-400 hover:border-pink-300 hover:text-pink-500'
    }
    ${sizeClasses[size]}
    ${className}
    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 cursor-pointer'}
  `;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleSave}
        disabled={isLoading}
        className={buttonClasses}
        title={isSaved ? 'Remove from saved venues' : 'Save venue to favorites'}
        aria-label={isSaved ? 'Remove from saved venues' : 'Save venue to favorites'}
      >
        <svg
          className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`}
          fill={isSaved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
      
      {showText && (
        <span className="text-sm text-gray-600">
          {isSaved ? 'Saved' : 'Save'}
        </span>
      )}
    </div>
  );
};

export default SaveVenueButton;
