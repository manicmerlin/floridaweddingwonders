'use client';

import { Venue } from '../types';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { isSuperAdmin } from '@/lib/auth';
import SaveVenueButton from './SaveVenueButton';
import { loadVenuePhotosFromStorage } from '@/lib/photoStorage';

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
  const [venueWithPhotos, setVenueWithPhotos] = useState<Venue>(venue);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  
  // Load photos from Supabase database
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const photos = await loadVenuePhotosFromStorage(venue.id);
        if (photos && photos.length > 0) {
          setVenueWithPhotos({
            ...venue,
            images: photos
          });
        }
      } catch (error) {
        console.error('Error loading venue photos:', error);
        // Keep original venue if loading fails
      } finally {
        setIsLoadingPhotos(false);
      }
    };

    loadPhotos();
  }, [venue.id]);

  // Get the primary image or fall back to first image
  const primaryImage = venueWithPhotos.images?.find(img => img.isPrimary) || venueWithPhotos.images?.[0];

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="relative h-48 overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={`${venueWithPhotos.name} - ${venueWithPhotos.venueType} wedding venue in ${venueWithPhotos.address.city}, Florida`}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            quality={85}
          />
        ) : (
          // Fallback to bride and groom emoji if no image available
          <div className="h-full bg-gray-100 flex items-center justify-center" role="img" aria-label={`${venueWithPhotos.name} - Photo coming soon`}>
            <div className="text-center text-gray-600 p-4">
              <div className="text-6xl mb-2" aria-hidden="true">
                👰🤵
              </div>
              <div className="text-sm font-medium leading-tight text-gray-500">No Photo Yet</div>
            </div>
          </div>
        )}
        
        {/* Save Button */}
        <div className="absolute top-3 right-3 z-10">
          <SaveVenueButton venue={venueWithPhotos} size="md" />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{venueWithPhotos.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{venueWithPhotos.description}</p>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">
            {venueWithPhotos.address.city}, {venueWithPhotos.address.state}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-500">
            Capacity: {venueWithPhotos.capacity.min}-{venueWithPhotos.capacity.max} guests
          </span>
          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full capitalize">
            {venueWithPhotos.venueType}
          </span>
        </div>
        
        {/* Button */}
        <Link href={`/venues/${venueWithPhotos.id}`} className="block w-full">
          <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
}
