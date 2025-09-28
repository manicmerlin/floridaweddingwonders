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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
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
          // Fallback to gradient if no image available
          <div className={`h-full bg-gradient-to-br ${gradientColors} flex items-center justify-center`}>
            <div className="text-center text-white p-4">
              <div className="text-2xl mb-2">
                {venue.venueType === 'beach' ? '🏖️' : 
                 venue.venueType === 'garden' ? '🌿' :
                 venue.venueType === 'ballroom' ? '🏛️' :
                 venue.venueType === 'historic' ? '🏰' :
                 venue.venueType === 'modern' ? '🏢' : '🌾'}
              </div>
              <div className="text-lg font-semibold leading-tight">{venue.name}</div>
            </div>
          </div>
        )}
        
        {/* Image overlay for venue name when image is present */}
        {primaryImage && (
          <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-10 transition-all duration-300">
            <div className="absolute bottom-4 left-4 text-white">
              <div className="text-lg font-semibold leading-tight drop-shadow-lg">{venue.name}</div>
            </div>
          </div>
        )}
        
        {/* Save Button */}
        <div className="absolute top-3 right-3 z-10">
          <SaveVenueButton venue={venue} size="md" />
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{venue.name}</h3>
        <p className="text-gray-600 mb-3 line-clamp-2">{venue.description}</p>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-500">
            {venue.address.city}, {venue.address.state}
          </span>
          <span className="text-lg font-bold text-pink-600">
            ${venue.pricing.startingPrice.toLocaleString()}+
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">
            Capacity: {venue.capacity.min}-{venue.capacity.max} guests
          </span>
          <span className="text-sm bg-pink-100 text-pink-700 px-2 py-1 rounded capitalize">
            {venue.venueType}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {venue.amenities.slice(0, 3).map((amenity) => (
            <span
              key={amenity}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
            >
              {amenity}
            </span>
          ))}
          {venue.amenities.length > 3 && (
            <span className="text-xs text-gray-500">
              +{venue.amenities.length - 3} more
            </span>
          )}
        </div>
        
        {/* Button(s) */}
        {isSuper ? (
          <div className="flex gap-2">
            <Link href={`/venues/${venue.id}`} className="flex-1">
              <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200">
                View Details
              </button>
            </Link>
            <Link href={`/venues/${venue.id}/manage`} className="flex-1">
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 flex items-center justify-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage
              </button>
            </Link>
          </div>
        ) : (
          <Link href={`/venues/${venue.id}`} className="block w-full">
            <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200">
              View Details
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
