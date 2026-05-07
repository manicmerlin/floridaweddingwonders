'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTranslations } from 'next-intl';
import type { Venue } from '@/types';

import 'leaflet/dist/leaflet.css';

// Same per-venue-type pin palette + HTML divIcon factory as VenuesMap. Kept
// inline rather than imported to keep the dynamic-import chunk for the
// detail map small — pulls only Leaflet, no clustering, no sidebar mosaic.
const TYPE_COLOR: Record<Venue['venueType'], string> = {
  beach: '#3b82f6',
  garden: '#16a34a',
  historic: '#92400e',
  ballroom: '#ca8a04',
  modern: '#6b7280',
  rustic: '#ea580c',
};

function makePinIcon(color: string) {
  const html = `
    <div style="position:relative;width:26px;height:36px;transform:translate(-13px,-36px);">
      <div style="width:26px;height:26px;background:${color};border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>
      <div style="position:absolute;top:8px;left:9px;width:8px;height:8px;background:white;border-radius:50%;"></div>
    </div>`;
  return L.divIcon({ html, className: 'venue-pin', iconSize: [26, 36], iconAnchor: [13, 36] });
}

interface VenueDetailMapProps {
  venue: Pick<Venue, 'name' | 'venueType' | 'address' | 'geocodeQuality'>;
}

/**
 * Single-pin map for the venue detail page. Zooms to street-level for
 * exact-geocoded venues, slightly wider for city-centroid fallbacks so
 * the user gets neighbourhood context instead of a pin floating in the
 * middle of an unfamiliar grid.
 *
 * Rendered nothing when the venue has no coordinates at all — the parent
 * gates on that before mounting this component, so we don't even need
 * the defensive return null here. Kept anyway for safety.
 */
export default function VenueDetailMap({ venue }: VenueDetailMapProps) {
  const t = useTranslations('Map');
  const c = venue.address.coordinates;
  if (!c) return null;

  const exact = venue.geocodeQuality === 'exact';
  const zoom = exact ? 14 : 12;
  const icon = makePinIcon(TYPE_COLOR[venue.venueType] ?? TYPE_COLOR.ballroom);

  return (
    <div className="relative w-full h-[250px] sm:h-[400px] rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[c.lat, c.lng]}
        zoom={zoom}
        scrollWheelZoom
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[c.lat, c.lng]} icon={icon}>
          <Popup>
            <div className="font-semibold text-gray-900 text-sm">{venue.name}</div>
            <div className="text-xs text-gray-500">
              {venue.address.city}, {venue.address.state}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      {/* Small overlay note for city-centroid fallbacks. Sits in the
          top-right so it doesn't block the pin or the attribution. */}
      {!exact && (
        <div className="absolute top-2 right-2 z-[400] bg-white/90 text-gray-700 text-xs px-2 py-1 rounded shadow max-w-[60%] text-right">
          {t('cityAreaNote', { city: venue.address.city })}
        </div>
      )}
    </div>
  );
}
