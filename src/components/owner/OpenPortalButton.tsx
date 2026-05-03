'use client';

import { useState } from 'react';

/**
 * Opens a Stripe Customer Portal session and redirects the browser to it.
 * The session is short-lived (~1 hour) and scoped to the signed-in user's
 * Stripe customer record. Returns the user to /owner/billing on completion.
 */
export default function OpenPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnTo: '/owner/billing' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Could not open the portal');
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={open}
        disabled={loading}
        className="bg-white text-pink-700 font-semibold px-6 py-3 rounded-lg hover:bg-pink-50 disabled:bg-pink-100 disabled:text-pink-400"
      >
        {loading ? 'Opening...' : 'Open billing portal →'}
      </button>
      {error && <p className="text-pink-100 text-sm mt-2">⚠ {error}</p>}
    </div>
  );
}
