'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { placeholderUrlForVenue } from '@/lib/placeholderImages';
import type { Venue } from '@/types';

import 'leaflet/dist/leaflet.css';

// Per-venue-type pin color. Tailwind hexes the eye is already used to from
// the rest of the directory, so the legend reads instantly without a key.
// Using HTML divIcon (CSS-shaped pin) avoids the broken default-icon URL
// resolution that webpack famously mangles.
const TYPE_COLOR: Record<Venue['venueType'], string> = {
  beach: '#3b82f6',     // blue
  garden: '#16a34a',    // green
  historic: '#92400e',  // brown
  ballroom: '#ca8a04',  // gold
  modern: '#6b7280',    // gray
  rustic: '#ea580c',    // orange
};

function makePinIcon(color: string) {
  // Teardrop-style HTML pin. white inner dot for contrast on dark imagery.
  const html = `
    <div style="
      position: relative;
      width: 26px;
      height: 36px;
      transform: translate(-13px, -36px);
    ">
      <div style="
        width: 26px;
        height: 26px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      "></div>
      <div style="
        position: absolute;
        top: 8px; left: 9px;
        width: 8px; height: 8px;
        background: white;
        border-radius: 50%;
      "></div>
    </div>`;
  return L.divIcon({
    html,
    className: 'venue-pin',
    iconSize: [26, 36],
    iconAnchor: [13, 36],
  });
}

interface VenuesMapProps {
  venues: Venue[];
}

/**
 * Adjusts the visible bounds whenever the venue list changes (e.g. user
 * applies a region/type filter on the parent listing client). Falls back
 * to a South-Florida centroid view when nothing is on the map.
 */
function FitBounds({ venues }: VenuesMapProps) {
  const map = useMap();
  const previousKey = useRef<string>('');

  useEffect(() => {
    const points: [number, number][] = venues
      .map((v) => v.address.coordinates)
      .filter((c): c is { lat: number; lng: number } => !!c)
      .map((c) => [c.lat, c.lng]);

    // Only refit when the underlying point set actually changed —
    // avoid yanking the viewport on every parent re-render.
    const key = points
      .map(([la, ln]) => `${la.toFixed(3)},${ln.toFixed(3)}`)
      .join('|');
    if (key === previousKey.current) return;
    previousKey.current = key;

    if (points.length === 0) {
      // South Florida default — Miami centroid, statewide-ish zoom.
      map.setView([26.5, -81.0], 7);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(points, { padding: [40, 40], maxZoom: 13 });
  }, [venues, map]);

  return null;
}

export default function VenuesMap({ venues }: VenuesMapProps) {
  const t = useTranslations('Map');

  // Filter to venues that actually have coords. The parent passes the
  // entire filtered set; rows missing coords just don't get pinned (per
  // spec — geocoding misses are accepted, they reappear on the list view).
  const pinnable = useMemo(
    () => venues.filter((v) => v.address.coordinates),
    [venues]
  );

  // Stable per-type icon set so we don't re-create one per marker.
  const icons = useMemo(() => {
    const out: Partial<Record<Venue['venueType'], L.DivIcon>> = {};
    for (const [type, color] of Object.entries(TYPE_COLOR)) {
      out[type as Venue['venueType']] = makePinIcon(color);
    }
    return out;
  }, []);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-white/10">
      <MapContainer
        center={[26.5, -81.0]}
        zoom={7}
        scrollWheelZoom
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds venues={pinnable} />
        <MarkerClusterGroup chunkedLoading>
          {pinnable.map((v) => {
            const c = v.address.coordinates!;
            const icon = icons[v.venueType] ?? icons.ballroom!;
            return (
              <Marker key={v.id} position={[c.lat, c.lng]} icon={icon}>
                <Popup>
                  <div className="w-48">
                    {v.slug ? (
                      <div className="relative w-full h-24 mb-2 rounded overflow-hidden bg-gray-100">
                        <Image
                          src={placeholderUrlForVenue(v.slug)}
                          alt={`${v.name} — watercolor illustration`}
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="font-semibold text-gray-900 text-sm mb-0.5">
                      {v.name}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {v.address.city}, FL · {v.capacity.min}–{v.capacity.max} {t('guests')}
                    </div>
                    <Link
                      href={`/venues/${v.slug || v.id}`}
                      className="text-pink-600 hover:text-pink-700 text-xs font-semibold"
                    >
                      {t('viewDetails')} →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Coverage hint — when fewer than half the visible venues actually
          have coords, surface that so users don't think the map is broken. */}
      {pinnable.length < venues.length && (
        <div className="absolute top-2 right-2 z-[1000] bg-white/90 text-gray-700 text-xs px-2 py-1 rounded shadow">
          {t('pinnedOf', { pinned: pinnable.length, total: venues.length })}
        </div>
      )}
    </div>
  );
}
