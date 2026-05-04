'use client';

import { Venue } from '../types';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { isSuperAdmin } from '@/lib/auth';
import { tierFeatures } from '@/lib/tierFeatures';
import { isListingComplete } from '@/lib/listingCompleteness';
import SaveVenueButton from './SaveVenueButton';
import { loadVenuePhotosFromStorage } from '@/lib/photoStorage';
import { placeholderUrlForVenue } from '@/lib/placeholderImages';

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
  // Toggles to true if the watercolor placeholder PNG 404s — drops the
  // card to the emoji fallback rather than rendering a broken <img>.
  const [placeholderFailed, setPlaceholderFailed] = useState(false);
  
  // "Show watercolor until claimed" rule. Real photos only render when the
  // venue has an active venue_ownerships row (set by decorateVenuesWithClaims
  // in the page-level loader). When isClaimed is undefined (caller didn't
  // decorate) we treat the venue as unclaimed for safety — no real photos.
  const useRealPhoto = venueWithPhotos.isClaimed === true;

  // Only load real photos from Supabase when the venue is actually claimed.
  // Skipping this useEffect on unclaimed venues avoids a wasted round-trip
  // per card on the listing.
  useEffect(() => {
    if (!useRealPhoto) {
      setIsLoadingPhotos(false);
      return;
    }
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
  }, [venue.id, useRealPhoto]);

  // Image fallback chain (in order):
  //   1. (Claimed only) real photo from venues.images JSONB
  //   2. Watercolor placeholder PNG at placeholders/venues/<slug>.png
  //   3. Emoji card if (2) 404s — handled via onError on the <Image>
  const primaryImage = useRealPhoto
    ? (venueWithPhotos.images?.find(img => img.isPrimary) || venueWithPhotos.images?.[0])
    : null;
  const placeholderUrl = venueWithPhotos.slug ? placeholderUrlForVenue(venueWithPhotos.slug) : null;
  const showPlaceholder = !primaryImage && placeholderUrl && !placeholderFailed;

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
        ) : showPlaceholder ? (
          <Image
            src={placeholderUrl!}
            alt={`${venueWithPhotos.name} - watercolor illustration`}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            quality={85}
            onError={() => {
              if (typeof console !== 'undefined') {
                console.warn(`[VenueCard] placeholder missing for ${venueWithPhotos.slug}`);
              }
              setPlaceholderFailed(true);
            }}
          />
        ) : (
          // Final fallback if neither real photo nor placeholder available.
          <div className="h-full bg-gray-100 flex items-center justify-center" role="img" aria-label={`${venueWithPhotos.name} - Photo coming soon`}>
            <div className="text-center text-gray-600 p-4">
              <div className="text-6xl mb-2" aria-hidden="true">
                👰🤵
              </div>
              <div className="text-sm font-medium leading-tight text-gray-500">No Photo Yet</div>
            </div>
          </div>
        )}
        
        {/* Tier badge — top-left, leaves the save button on the right alone.
            Gated on listing completeness: an empty Founding Partner listing
            (no phone, no real photos) hides the badge so the paid tier
            doesn't look like a placeholder. */}
        {(() => {
          const tf = tierFeatures(venueWithPhotos.tier);
          if (!tf.badgeLabel) return null;
          const complete = isListingComplete({
            hasContact: !!(venueWithPhotos.contact.phone || venueWithPhotos.contact.website),
            description: venueWithPhotos.description,
            imagesCount: venueWithPhotos.images?.length ?? 0,
          });
          if (!complete) return null;
          const isScale = tf.showFoundingPartnerBadge;
          return (
            <div
              className={`absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg ${
                isScale
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              }`}
              aria-label={`${tf.badgeLabel} venue`}
            >
              {isScale ? '★ ' : ''}
              {tf.badgeLabel}
            </div>
          );
        })()}

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
          {venueWithPhotos.reviews?.count && venueWithPhotos.reviews.count > 0 ? (
            <span
              className="text-xs text-amber-600 font-medium"
              aria-label={`${venueWithPhotos.reviews.rating.toFixed(1)} of 5 stars from ${venueWithPhotos.reviews.count} reviews`}
            >
              ★ {venueWithPhotos.reviews.rating.toFixed(1)}
              <span className="text-gray-500 font-normal"> ({venueWithPhotos.reviews.count})</span>
            </span>
          ) : null}
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-500">
            Capacity: {venueWithPhotos.capacity.min}-{venueWithPhotos.capacity.max} guests
          </span>
          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full capitalize">
            {venueWithPhotos.venueType}
          </span>
        </div>

        {/* Starting price — shown only when the catalog has a real price_min.
            Couples filter by budget; surfacing it on the card cuts a click. */}
        {venueWithPhotos.pricing.startingPrice > 0 && (
          <div className="mb-3 text-sm font-semibold text-pink-700">
            From ${venueWithPhotos.pricing.startingPrice.toLocaleString()}
          </div>
        )}

        {/* Button */}
        <Link href={`/venues/${venueWithPhotos.slug || venueWithPhotos.id}`} className="block w-full">
          <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
}
