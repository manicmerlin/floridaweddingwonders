'use client';

import { Venue } from '../types';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { isSuperAdmin } from '@/lib/auth';
import SaveVenueButton from './SaveVenueButton';

interface VenueCardProps {
  venue: Venue;
  showFavorites?: boolean;
}

// Function to get color scheme based on venue type
const getVenueColors = (venueType: string) => {
  const colorSchemes = {
    beach: 'from-blue-400 to-cyan-400',
    garden: 'from-green-400 to-emerald-400', 
    ballroom: 'from-purple-400 to-pink-400',
    historic: 'from-orange-400 to-red-400',
    modern: 'from-gray-400 to-slate-400',
    rustic: 'from-amber-400 to-orange-400',
  };
  
  return colorSchemes[venueType as keyof typeof colorSchemes] || 'from-pink-400 to-purple-400';
};

export default function VenueCard({ venue, showFavorites = false }: VenueCardProps) {
  const gradientColors = getVenueColors(venue.venueType);
  const isSuper = isSuperAdmin();
  
  // Get the primary image or fall back to first image
  const primaryImage = venue.images?.find(img => img.isPrimary) || venue.images?.[0];

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="relative h-48 overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          // Fallback to bride and groom emoji if no image available
          <div className="h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-600 p-4">
              <div className="text-6xl mb-2">
                👰🤵
              </div>
              <div className="text-sm font-medium leading-tight text-gray-500">No Photo Yet</div>
            </div>
          </div>
        )}
        
        {/* Save Button */}
        <div className="absolute top-3 right-3 z-10">
          <SaveVenueButton venue={venue} size="md" />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{venue.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{venue.description}</p>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">
            {venue.address.city}, {venue.address.state}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-500">
            Capacity: {venue.capacity.min}-{venue.capacity.max} guests
          </span>
          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full capitalize">
            {venue.venueType}
          </span>
        </div>
        
        {/* Button */}
        <Link href={`/venues/${venue.id}`} className="block w-full">
          <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
}
