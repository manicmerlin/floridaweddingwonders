'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';
import PhotoGallery from '@/components/PhotoGallery';
import VenueClaimButton from '@/components/VenueClaimButton';
import VenueContactForm from '@/components/VenueContactForm';
import VenueViewTracker from '@/components/VenueViewTracker';
import SaveVenueButton from '@/components/SaveVenueButton';
import { loadVenuePhotosFromStorage } from '@/lib/photoStorage';
import { useVenueAnalytics } from '@/hooks/useVenueAnalytics';
import { tierFeatures } from '@/lib/tierFeatures';
import { isListingComplete } from '@/lib/listingCompleteness';
import FeaturedBadgeInfo from '@/components/FeaturedBadgeInfo';
import VerifiedChip from '@/components/VerifiedChip';
import ListingRatingStrip from '@/components/ListingRatingStrip';
import VendorListingCard from '@/components/vendors/VendorListingCard';
import FloridaReadyPanel from '@/components/venues/FloridaReadyPanel';
import VenuePinItButton from '@/components/venues/VenuePinItButton';
import { placeholderUrlForVenue } from '@/lib/placeholderImages';
import { Venue } from '@/types';

// Detail map dynamic-imported with ssr:false — same reason as VenuesMap on
// the listing page: Leaflet touches `window` at module load. Skipping
// SSR also keeps the leaflet bundle out of every venue detail page's
// initial JS until the user actually scrolls down to the map.
const VenueDetailMap = dynamic(
  () => import('@/components/venues/VenueDetailMap'),
  { ssr: false, loading: () => (
    <div className="w-full h-[250px] sm:h-[400px] rounded-lg border border-gray-200 bg-gray-100 animate-pulse" />
  ) }
);

// REMOVED: localStorage `deleted-venues` redirect.
//
// Same fix as VenuesListClient — the per-device soft-delete flag was
// redirecting paid-tier venues out from under their owners and admins
// alike. Phase 3B will introduce a DB-backed deleted_at flag; until then
// every venue in the catalog is reachable.

interface Props {
  venue: Venue;
  relatedVenues: Venue[];
  /** Vendors serving this venue's city — already diversified by category
   *  upstream. Optional so existing call sites compile during the rollout. */
  cityVendors?: import('@/types').Vendor[];
}

export default function VenueDetailClient({ venue: serverVenue, relatedVenues, cityVendors = [] }: Props) {
  const t = useTranslations('VenueDetail');
  const tMap = useTranslations('Map');
  const [activeTab, setActiveTab] = useState('overview');
  const [showContactForm, setShowContactForm] = useState(false);
  // Start with the server-rendered venue. The effect below replaces images
  // with stored photos (post-migration uploads) and triggers a redirect if
  // the admin has soft-deleted this venue on this device.
  const [venue, setVenue] = useState<Venue>(serverVenue);

  useVenueAnalytics(venue.id);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await loadVenuePhotosFromStorage(serverVenue.id);
        if (!cancelled && stored.length > 0) {
          setVenue({ ...serverVenue, images: stored });
        } else if (!cancelled) {
          setVenue(serverVenue);
        }
      } catch {
        if (!cancelled) setVenue(serverVenue);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverVenue]);

  const tabs = [
    { id: 'overview', label: t('tabOverview') },
    { id: 'details', label: t('tabDetails') },
    { id: 'contact', label: t('tabContact') }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <VenueViewTracker venueUuid={venue.uuid} />
      <Navigation />

      {/* Photo Gallery Section - Standalone */}
      <section className="bg-white relative z-0">
        {/* Tier hero overlay — top-right corner of the gallery section.
            Scale gets a gold ribbon, growth gets a purple "Featured" tag.
            Gated on listing completeness — see VenueCard for the same
            rule: empty Founding Partner listings shouldn't flaunt the
            badge. */}
        {(() => {
          const tf = tierFeatures(venue.tier);
          if (!tf.badgeLabel) return null;
          const complete = isListingComplete({
            hasContact: !!(venue.contact.phone || venue.contact.website),
            description: venue.description,
            imagesCount: venue.images?.length ?? 0,
          });
          if (!complete) return null;
          const isScale = tf.showFoundingPartnerBadge;
          return (
            <div
              className={`absolute top-4 right-4 z-20 inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-xl ${
                isScale
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              }`}
              aria-label={`${tf.badgeLabel} venue`}
            >
              {isScale ? '★ ' : ''}
              {tf.badgeLabel}
              <FeaturedBadgeInfo tierLabel={tf.badgeLabel as 'Featured' | 'Founding Partner'} />
            </div>
          );
        })()}
        {/* "Show watercolor until claimed" rule — same gate as the listing
            cards. Real PhotoGallery only renders when the venue is claimed
            AND has photos. Otherwise show the watercolor placeholder hero. */}
        {venue.isClaimed && venue.images && venue.images.length > 0 ? (
          <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-8 lg:pb-20">
            <div className="max-w-7xl mx-auto">
              <PhotoGallery
                images={venue.images.map((img, index) => ({
                  id: img.id,
                  url: img.url,
                  alt: img.alt,
                  isPrimary: img.isPrimary || index === 0
                }))}
                venueName={venue.name}
                venueSlug={venue.slug}
                pinDescription={`${venue.name} — ${venue.venueType} wedding venue in ${venue.address.city}, FL`}
              />
            </div>
          </div>
        ) : venue.slug ? (
          <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-8 lg:pb-20">
            <div className="max-w-7xl mx-auto">
              <div className="relative aspect-[3/2] sm:aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={placeholderUrlForVenue(venue.slug)}
                  alt={`${venue.name} — watercolor illustration`}
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 1024px) 100vw, 1280px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-96 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <span className="text-8xl mb-4 block">👰🤵</span>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 text-gray-800">{venue.name}</h1>
              <p className="text-xl md:text-2xl mb-2">📍 {venue.address.city}, {venue.address.state}</p>
              <p className="text-lg opacity-75 capitalize">{venue.venueType}</p>
              <p className="text-sm mt-4 text-gray-500">No photos uploaded yet</p>
            </div>
          </div>
        )}
      </section>

      {/* Venue Title Section - shows whenever the hero rendered (real
          gallery OR watercolor placeholder); only suppressed for the
          slugless emoji-fallback path. */}
      {((venue.isClaimed && venue.images && venue.images.length > 0) || venue.slug) && (
        <section className="bg-white border-t border-gray-200 relative z-10 clear-both">
          <div className="px-4 sm:px-6 lg:px-8 py-8 lg:pt-16">
            <div className="max-w-7xl mx-auto">
              <div className="lg:text-center">
                {/* Trust chip — Verified + Updated <Mon Year>. Sits above
                    the H1 so it's the first thing a couple sees beneath
                    the hero. */}
                <div className="mb-3 flex justify-start lg:justify-center">
                  <VerifiedChip
                    verified={isListingComplete({
                      hasContact: !!(venue.contact.phone || venue.contact.website),
                      description: venue.description,
                      imagesCount: venue.images?.length ?? 0,
                    })}
                    updatedAt={venue.updatedAt}
                  />
                </div>
                <h1 className="text-2xl lg:text-4xl xl:text-6xl font-bold text-gray-900 mb-2">{venue.name}</h1>
                {/* City pin scrolls to the detail map. Falls back to a
                    plain span when coords are missing (the map section
                    isn't rendered in that case so an anchor would 404
                    silently). */}
                {venue.address.coordinates ? (
                  <a
                    href="#venue-map"
                    className="inline-flex items-center justify-start lg:justify-center text-gray-600 hover:text-pink-600 mb-3 cursor-pointer transition"
                    aria-label={`Scroll to map for ${venue.name}`}
                  >
                    <svg className="w-5 h-5 mr-2 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg lg:text-xl underline-offset-4 group-hover:underline">{venue.address.city}, {venue.address.state}</span>
                  </a>
                ) : (
                  <div className="flex items-center justify-start lg:justify-center text-gray-600 mb-3">
                    <svg className="w-5 h-5 mr-2 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg lg:text-xl">{venue.address.city}, {venue.address.state}</span>
                  </div>
                )}
                {/* Above-the-fold ratings strip + write-a-review anchor.
                    Always renders — empty state primes review submissions
                    on listings with no reviews yet. */}
                <div className="mb-4 flex justify-start lg:justify-center">
                  <ListingRatingStrip
                    rating={venue.reviews?.count ? venue.reviews.rating : null}
                    count={venue.reviews?.count ?? 0}
                    slug={venue.slug || venue.id}
                    kind="venues"
                  />
                </div>
                <div className="flex items-center flex-wrap gap-3 justify-start lg:justify-center text-gray-500 mb-6">
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium capitalize">{venue.venueType}</span>
                  {venue.externalReviews?.google && (
                    <button
                      onClick={() => window.open(venue.externalReviews?.google?.url, '_blank')}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Reviews
                    </button>
                  )}
                  <VenuePinItButton venue={venue} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Mobile Stats Cards / Desktop Quick Info Bar */}
      <section className="bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* The duplicate "Location" card was removed in favour of a
              starting-price slot — when price_min is populated we show it,
              otherwise we surface a Google reviews score, otherwise a
              "New listing" empty-state. The city already appears in the
              title section above so it doesn't need a stat tile too. */}
          <div className="grid grid-cols-2 gap-4 lg:hidden">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-pink-600">{venue.capacity.min}-{venue.capacity.max}</div>
              <div className="text-gray-600 text-sm">{t('guestsCapacity')}</div>
            </div>
            {/* Location card — city as the value (matches the value-above-
                label pattern of the other cards), whole card scrolls to
                the inline map. Falls back to a static card when coords are
                missing (no anchor target). */}
            {venue.address.coordinates ? (
              <a
                href="#venue-map"
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer block"
              >
                <div className="text-lg font-bold text-pink-600 truncate">{venue.address.city}</div>
                <div className="text-gray-600 text-sm">{t('location')}</div>
              </a>
            ) : (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-lg font-bold text-pink-600 truncate">{venue.address.city}</div>
                <div className="text-gray-600 text-sm">{t('location')}</div>
              </div>
            )}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              {venue.pricing.startingPrice > 0 ? (
                <>
                  <div className="text-lg font-bold text-pink-600">From ${venue.pricing.startingPrice.toLocaleString()}</div>
                  <div className="text-gray-600 text-sm">{t('startingPrice')}</div>
                </>
              ) : venue.reviews.count > 0 ? (
                <>
                  <div className="text-lg font-bold text-amber-600">★ {venue.reviews.rating.toFixed(1)}</div>
                  <div className="text-gray-600 text-sm">{venue.reviews.count} {t('reviews')}</div>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-gray-400">—</div>
                  <div className="text-gray-600 text-sm">{t('newListing')}</div>
                </>
              )}
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-lg font-bold text-pink-600">
                {venue.capacity.max >= 150 ? 'Large' : venue.capacity.max >= 100 ? 'Medium' : 'Intimate'}
              </div>
              <div className="text-gray-600 text-sm">{t('eventSize')}</div>
            </div>
          </div>

          <div className="hidden lg:grid lg:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-pink-600">{venue.capacity.min}-{venue.capacity.max}</div>
              <div className="text-gray-600">Capacity</div>
            </div>
            <div>
              {venue.pricing.startingPrice > 0 ? (
                <>
                  <div className="text-2xl font-bold text-pink-600">From ${venue.pricing.startingPrice.toLocaleString()}</div>
                  <div className="text-gray-600">{t('startingPrice')}</div>
                </>
              ) : venue.reviews.count > 0 ? (
                <>
                  <div className="text-2xl font-bold text-amber-600">★ {venue.reviews.rating.toFixed(1)}</div>
                  <div className="text-gray-600">{venue.reviews.count} {t('reviews')}</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-400">—</div>
                  <div className="text-gray-600">{t('newListing')}</div>
                </>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-600">
                {venue.capacity.max >= 150 ? 'Large' : venue.capacity.max >= 100 ? 'Medium' : 'Intimate'}
              </div>
              <div className="text-gray-600">{t('eventSize')}</div>
            </div>
            {/* Location card — city above label, whole card scrolls to
                the inline map. Matches the desktop value-above-label
                pattern of the other 3 stat tiles. */}
            {venue.address.coordinates ? (
              <a
                href="#venue-map"
                className="block hover:opacity-80 transition cursor-pointer"
              >
                <div className="text-2xl font-bold text-pink-600 truncate">{venue.address.city}</div>
                <div className="text-gray-600">{t('location')}</div>
              </a>
            ) : (
              <div>
                <div className="text-2xl font-bold text-pink-600 truncate">{venue.address.city}</div>
                <div className="text-gray-600">{t('location')}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Action Buttons — venue-specific (Contact / Save / Call).
          Lifted above the global StickyMobileCTA (mounted in root layout)
          via bottom-[48px] so both sticky bars stack instead of overlapping
          on mobile. The 48px offset matches the global CTA's rendered
          height (py-3 + text-sm + border). The +safe-area-inset-bottom
          term respects the iPhone home-indicator gutter. */}
      <section
        className="lg:hidden bg-white border-t border-gray-200 px-4 py-4 sticky z-10 shadow-lg"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 48px)' }}
      >
        <div className="flex gap-3">
          <button
            onClick={() => setShowContactForm(true)}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold text-center transition-all"
          >
            💌 {t('contactVenue')}
          </button>
          <SaveVenueButton 
            venue={venue} 
            size="lg" 
            showText={false} 
            className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-3 rounded-lg transition-all" 
          />
          <a
            href={`tel:${venue.contact.phone}`}
            className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-3 rounded-lg transition-all"
          >
            📞
          </a>
        </div>
      </section>

      {/* Desktop Contact Actions */}
      <section className="hidden lg:block bg-white py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('interestedTitle')}</h2>
            <p className="text-gray-600 mb-6">{t('interestedSubtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => setShowContactForm(true)}
                className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                💌 {t('requestInfo')}
              </button>
              <SaveVenueButton venue={venue} size="lg" showText={true} className="bg-white border-2 border-pink-300 text-pink-600 hover:bg-pink-50 px-6 py-3 rounded-lg font-semibold text-lg shadow-lg" />
              <div className="flex items-center space-x-4">
                <a
                  href={`mailto:${venue.contact.email}?subject=Wedding Inquiry - ${venue.name}`}
                  className="text-pink-600 hover:text-pink-700 font-medium transition flex items-center"
                >
                  ✉️ {venue.contact.email}
                </a>
                <a
                  href={`tel:${venue.contact.phone}`}
                  className="text-pink-600 hover:text-pink-700 font-medium transition flex items-center"
                >
                  📞 {venue.contact.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Content Sections */}
      <section className="bg-white lg:bg-gray-50 py-6 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile: Card-based layout */}
          <div className="lg:hidden space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('aboutVenue')} {venue.name}</h2>
              <p className="text-gray-600 leading-relaxed">
                {venue.description}
              </p>
            </div>

            {/* Quick Facts Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('venueType')}</span>
                  <span className="font-medium text-gray-900 capitalize">{venue.venueType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('capacityLabel')}</span>
                  <span className="font-medium text-gray-900">{venue.capacity.min}-{venue.capacity.max} {t('guests')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('googleMaps')}</span>
                  {venue.externalReviews?.google?.url ? (
                    <a
                      href={venue.externalReviews.google.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/3/39/Google_Maps_icon_%282015-2020%29.svg"
                        alt="Google Maps"
                        width={20}
                        height={20}
                        className="mr-2"
                      />
                      {t('viewLocation')}
                    </a>
                  ) : (
                    /* Default: deep-link via the search-API URL pattern
                       (same as the new Location section's primary CTA). */
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.address.city} FL`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      {tMap('viewOnGoogleMaps')} →
                    </a>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('location')}</span>
                  <span className="font-medium text-gray-900">{venue.address.city}</span>
                </div>
              </div>
            </div>

            {/* Amenities Card */}
            {venue.amenities && venue.amenities.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('amenitiesServices')}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {venue.amenities.slice(0, 6).map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                  {venue.amenities.length > 6 && (
                    <button className="text-left text-pink-600 text-sm font-medium mt-2">
                      {t('viewAllAmenities')} ({venue.amenities.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Florida-Ready (mobile) — renders only when ≥1 hurricane field
                is populated; otherwise the component returns null. */}
            <FloridaReadyPanel venue={venue} />

            {/* Contact Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('contactInfo')}</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-pink-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <a href={`mailto:${venue.contact.email}`} className="text-gray-700 hover:text-pink-600">
                    {venue.contact.email}
                  </a>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-pink-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <a href={`tel:${venue.contact.phone}`} className="text-gray-700 hover:text-pink-600">
                    {venue.contact.phone}
                  </a>
                </div>
                {venue.contact.website && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-pink-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.148.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.029 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                    </svg>
                    <a href={venue.contact.website} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-pink-600">
                      {t('visitWebsite')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('address')}</h3>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-pink-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-gray-700">{venue.address.street}</p>
                  <p className="text-gray-700">{venue.address.city}, {venue.address.state} {venue.address.zipCode}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Traditional layout with tabs */}
          <div className="hidden lg:block">
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                      activeTab === tab.id
                        ? 'border-pink-500 text-pink-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            {/* Desktop Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('aboutVenue')} {venue.name}</h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    {venue.description}
                  </p>

                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('amenitiesServices')}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {venue.amenities && venue.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-700">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Florida-Ready (desktop) — null when no fields populated. */}
                  <div className="mb-8">
                    <FloridaReadyPanel venue={venue} />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('quickFacts')}</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium text-gray-900">{t('venueType')}:</span>
                          <span className="ml-2 text-gray-600">{venue.venueType}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{t('city')}:</span>
                          <span className="ml-2 text-gray-600">{venue.address.city}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{t('capacityLabel')}:</span>
                          <span className="ml-2 text-gray-600">{venue.capacity.min}-{venue.capacity.max} {t('guests')}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{t('googleMaps')}:</span>
                          {venue.externalReviews?.google?.url ? (
                            <a
                              href={venue.externalReviews.google.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-700 flex items-center"
                            >
                              <Image
                                src="https://upload.wikimedia.org/wikipedia/commons/3/39/Google_Maps_icon_%282015-2020%29.svg"
                                alt="Google Maps"
                                width={16}
                                height={16}
                                className="mr-1"
                              />
                              {t('viewLocation')}
                            </a>
                          ) : (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.address.city} FL`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-700"
                            >
                              {tMap('viewOnGoogleMaps')} →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact {venue.name}</h3>
                    
                    <div className="space-y-4 mb-6">
                      <div>
                        <span className="text-gray-600">📧 Email:</span>
                        <a href={`mailto:${venue.contact.email}`} className="block text-pink-600 hover:text-pink-700">
                          {venue.contact.email}
                        </a>
                      </div>
                      <div>
                        <span className="text-gray-600">📞 Phone:</span>
                        <a href={`tel:${venue.contact.phone}`} className="block text-pink-600 hover:text-pink-700">
                          {venue.contact.phone}
                        </a>
                      </div>
                      {venue.contact.website && (
                        <div>
                          <span className="text-gray-600">🌐 Website:</span>
                          <a href={venue.contact.website} target="_blank" rel="noopener noreferrer" className="block text-pink-600 hover:text-pink-700">
                            {t('visitWebsite')}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <a
                        href={`mailto:${venue.contact.email}?subject=Wedding Inquiry for ${venue.name}`}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold text-center block transition"
                      >
                        {t('sendInquiry')}
                      </a>
                      <a
                        href={`tel:${venue.contact.phone}`}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold text-center block transition"
                      >
                        {t('callNow')}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('tabDetails')}</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('address')}</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{venue.address.street}</p>
                        <p className="text-gray-700">{venue.address.city}, {venue.address.state} {venue.address.zipCode}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('capacityDetails')}</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{t('guestsCapacity')}: {venue.capacity.min}-{venue.capacity.max} {t('guests')}</p>
                        <p className="text-gray-700 text-sm mt-1">
                          {t('capacityNote', { size: venue.capacity.max >= 150 ? t('sizeLarge') : venue.capacity.max >= 100 ? t('sizeMedium') : t('sizeIntimate') })}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('googleMaps')}</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <a
                          href={
                            venue.externalReviews?.google?.url ||
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.address.city} FL`)}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-700"
                        >
                          <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/3/39/Google_Maps_icon_%282015-2020%29.svg"
                            alt="Google Maps"
                            width={24}
                            height={24}
                            className="mr-2"
                          />
                          {tMap('viewOnGoogleMaps')}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Amenities & Services</h3>
                  <div className="grid gap-3">
                    {venue.amenities && venue.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                        <span className="text-green-500 mr-3">✓</span>
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('tabContact')}</h2>

                <div className="grid lg:grid-cols-2 gap-12">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('contactInfo')}</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <span className="text-pink-600 text-xl mr-4">📧</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Email</h4>
                          <a href={`mailto:${venue.contact.email}`} className="text-pink-600 hover:text-pink-700">
                            {venue.contact.email}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <span className="text-pink-600 text-xl mr-4">📞</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Phone</h4>
                          <a href={`tel:${venue.contact.phone}`} className="text-pink-600 hover:text-pink-700">
                            {venue.contact.phone}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <span className="text-pink-600 text-xl mr-4">📍</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Address</h4>
                          <p className="text-gray-600">
                            {venue.address.street}<br />
                            {venue.address.city}, {venue.address.state} {venue.address.zipCode}
                          </p>
                        </div>
                      </div>

                      {venue.contact.website && (
                        <div className="flex items-start">
                          <span className="text-pink-600 text-xl mr-4">🌐</span>
                          <div>
                            <h4 className="font-medium text-gray-900">Website</h4>
                            <a href={venue.contact.website} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                              {t('visitWebsite')}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Send a Message</h3>
                    
                    <form className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Name
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            placeholder="Your full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Wedding Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Tell us about your wedding plans..."
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                      >
                        Send Inquiry
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Detail-page map. Sits between the Quick Facts tabs and the
          venue-pros/related strips. Hidden entirely when the venue has
          no coordinates at all — defensive, since post-Phase A every
          venue has either 'exact' or 'city-centroid' geocode_quality.
          id="venue-map" is the anchor for the city pin in the header
          and the Quick Stats Location card; scroll-margin-top keeps
          the heading from hiding under the sticky <Navigation>. */}
      {venue.address.coordinates && (
        <section
          id="venue-map"
          className="bg-white py-8 border-t border-gray-200 scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {tMap('locationHeading')}
              </h2>
              <a
                href={
                  `https://www.google.com/maps/search/?api=1` +
                  `&query=${encodeURIComponent(`${venue.name} ${venue.address.city} FL`)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-lg shadow transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                {tMap('viewOnGoogleMaps')}
              </a>
            </div>
            <VenueDetailMap venue={venue} />
          </div>
        </section>
      )}

      {/* Venue Claim Button - Desktop only */}
      <section className="hidden lg:block bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <VenueClaimButton venue={venue} />
        </div>
      </section>

      {/* Wedding pros who serve this city — venue↔vendor cross-link. Sits
          above the related-venues block. Hidden when there's nothing to
          show; unique to this directory. */}
      {cityVendors.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('morePros')} {venue.address.city}
              </h2>
              <Link
                href={`/vendors/in/${(venue.address.city || '').toLowerCase().replace(/\s+/g, '-')}`}
                className="text-pink-600 hover:text-pink-700 text-sm font-medium"
              >
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cityVendors.map((v) => (
                <VendorListingCard key={v.id} vendor={v} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Venues */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {t('moreVenues')} {venue.address.city}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {relatedVenues
              .slice(0, 3)
              .map((relatedVenue) => (
                <Link key={relatedVenue.id} href={`/venues/${relatedVenue.slug || relatedVenue.id}`} className="block group">
                  <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                    {relatedVenue.isClaimed && relatedVenue.images && relatedVenue.images.length > 0 ? (
                      <div className="aspect-w-16 aspect-h-10">
                        <Image
                          src={relatedVenue.images[0].url}
                          alt={relatedVenue.images[0].alt}
                          width={400}
                          height={250}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : relatedVenue.slug ? (
                      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                        <Image
                          src={placeholderUrlForVenue(relatedVenue.slug)}
                          alt={`${relatedVenue.name} — watercolor illustration`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        <span className="text-6xl">👰🤵</span>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{relatedVenue.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">📍 {relatedVenue.address.city}, {relatedVenue.address.state}</p>
                      <p className="text-pink-600 font-medium">${relatedVenue.pricing.startingPrice.toLocaleString()}+</p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
          
          <div className="text-center mt-8">
            <Link
              href="/venues"
              className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Browse All Venues
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Form Modal */}
      {showContactForm && (
        <VenueContactForm
          venue={venue}
          onClose={() => setShowContactForm(false)}
        />
      )}
    </div>
  );
}