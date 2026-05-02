'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { Venue } from '../types';

interface SaveVenueButtonProps {
  venue: Venue;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

// Phase 3B: heart icon now persists to the saved_venues DB table for
// signed-in users. Anonymous users keep using localStorage so the UX
// doesn't break for browse-without-account.
//
// On first sign-in, any localStorage entries are migrated up to the DB
// once and the localStorage key is cleared (handled by the SaveVenueButton
// effect when it sees auth + non-empty legacy storage).

const LEGACY_KEY_PREFIX = 'savedVenues_'; // FavoritesManager keyed by email
const ANON_KEY = 'anon_savedVenues';

function readAnonSaves(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(ANON_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function writeAnonSaves(set: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANON_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* swallow quota errors */
  }
}

async function fetchSavedIds(): Promise<Set<string>> {
  try {
    const res = await fetch('/api/saved-venues', { credentials: 'include' });
    if (!res.ok) return new Set();
    const data = await res.json();
    const ids = (data?.saved ?? [])
      .map((row: any) => row.legacyId || row.slug)
      .filter(Boolean);
    return new Set(ids);
  } catch {
    return new Set();
  }
}

const SaveVenueButton: React.FC<SaveVenueButtonProps> = ({
  venue,
  className = '',
  size = 'md',
  showText = false,
}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Initial load + re-sync whenever auth state changes.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    const sync = async () => {
      if (isAuthenticated) {
        // Migrate any anon-saves into the DB on first sign-in.
        const anonSet = readAnonSaves();
        if (anonSet.size > 0) {
          for (const id of Array.from(anonSet)) {
            await fetch('/api/saved-venues', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ venueIdOrSlug: id }),
            }).catch(() => null);
          }
          writeAnonSaves(new Set());
        }
        const ids = await fetchSavedIds();
        if (!cancelled) setIsSaved(ids.has(venue.id) || ids.has(venue.slug));
      } else {
        const ids = readAnonSaves();
        if (!cancelled) setIsSaved(ids.has(venue.id) || ids.has(venue.slug));
      }
    };

    sync();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading, venue.id, venue.slug]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const target = venue.slug || venue.id;
      if (isAuthenticated) {
        if (isSaved) {
          await fetch(
            `/api/saved-venues?venueIdOrSlug=${encodeURIComponent(target)}`,
            { method: 'DELETE' }
          );
          setIsSaved(false);
        } else {
          await fetch('/api/saved-venues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ venueIdOrSlug: target }),
          });
          setIsSaved(true);
        }
      } else {
        const set = readAnonSaves();
        if (isSaved) set.delete(target);
        else set.add(target);
        writeAnonSaves(set);
        setIsSaved(!isSaved);
      }
    } finally {
      setBusy(false);
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
  };

  const baseButtonClasses = `
    inline-flex items-center justify-center transition-all duration-200 shadow-sm
    ${showText ? 'rounded-lg px-4 py-2 gap-2' : 'rounded-full border-2'}
    ${isSaved
      ? 'bg-pink-100 border-pink-500 text-pink-600 hover:bg-pink-200'
      : 'bg-white border-gray-300 text-gray-400 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50'
    }
    ${!showText ? sizeClasses[size] : ''}
    ${busy ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
  `;

  const buttonClasses = className ? `${baseButtonClasses} ${className}` : baseButtonClasses;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={busy}
        className={buttonClasses}
        title={isSaved ? 'Remove from saved venues' : 'Save venue to favorites'}
        aria-label={isSaved ? 'Remove from saved venues' : 'Save venue to favorites'}
      >
        <svg
          className={`${showText ? 'w-5 h-5' : size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`}
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
        <span className="text-sm text-gray-600">{isSaved ? 'Saved' : 'Save'}</span>
      )}
    </div>
  );
};

export default SaveVenueButton;
