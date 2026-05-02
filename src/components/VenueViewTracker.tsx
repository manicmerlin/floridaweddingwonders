'use client';

import { useEffect } from 'react';

// Fire-and-forget analytics beacon. Mounted once per venue detail page.
//
// Visitor cookie is a stable random UUID per browser, valid for 30 days.
// The first hit on a given venue within that window is `is_unique=true`;
// subsequent hits within the same window are `is_unique=false`. Owner
// dashboards aggregate this for the "47 unique views this month" stat.
//
// Failures are silenced — analytics must never affect rendering.

const VISITOR_COOKIE_KEY = 'fww_visitor';
const SEEN_VENUES_KEY = 'fww_seen_venues';
const ROLLING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function getOrCreateVisitorCookie(): string {
  try {
    let v = localStorage.getItem(VISITOR_COOKIE_KEY);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(VISITOR_COOKIE_KEY, v);
    }
    return v;
  } catch {
    return '';
  }
}

function isUniqueWithinWindow(venueUuid: string): boolean {
  try {
    const raw = localStorage.getItem(SEEN_VENUES_KEY);
    const seen: Record<string, number> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const last = seen[venueUuid];
    if (last && now - last < ROLLING_WINDOW_MS) return false;
    seen[venueUuid] = now;
    // Garbage-collect old entries
    for (const [k, ts] of Object.entries(seen)) {
      if (now - (ts as number) > ROLLING_WINDOW_MS) delete seen[k];
    }
    localStorage.setItem(SEEN_VENUES_KEY, JSON.stringify(seen));
    return true;
  } catch {
    return false;
  }
}

export default function VenueViewTracker({ venueUuid }: { venueUuid?: string }) {
  useEffect(() => {
    if (!venueUuid) return;
    if (typeof window === 'undefined') return;

    const visitorCookie = getOrCreateVisitorCookie();
    const isUnique = isUniqueWithinWindow(venueUuid);
    const referrer = document.referrer || null;

    fetch('/api/analytics/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venueId: venueUuid,
        visitorCookie,
        isUnique,
        referrer,
      }),
      // keepalive lets the beacon survive page navigation
      keepalive: true,
    }).catch(() => null);
  }, [venueUuid]);

  return null;
}
