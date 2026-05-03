'use client';

import { useState } from 'react';

interface Props {
  /** Used in the welcome-email subject + analytics so we know which post
   *  drove the signup. */
  source: string;
}

/**
 * Email capture form rendered at the end of every blog post. Hits the
 * existing /api/send-email route which inserts into email_subscribers
 * and sends a welcome email via Resend (Phase 1 infra). The "free
 * checklist" hook is the standard wedding-blog conversion lever.
 */
export default function EmailCaptureCTA({ source }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) {
        const r = await res.json().catch(() => ({}));
        setError(r?.error || 'Could not subscribe');
        setStatus('error');
        return;
      }
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="not-prose my-12 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200 p-8 text-center">
        <div className="text-3xl mb-2">📬</div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          You're in. Check your inbox.
        </h3>
        <p className="text-gray-700">
          The Florida Wedding Planning Checklist is on the way.
        </p>
      </div>
    );
  }

  return (
    <aside className="not-prose my-12 rounded-2xl bg-gradient-to-br from-pink-600 to-purple-600 p-8 text-white">
      <h3 className="text-2xl font-bold mb-2">
        Get our free Florida Wedding Planning Checklist
      </h3>
      <p className="text-pink-100 mb-5">
        12 months of milestones, what to book and when, plus our list of vendor
        questions to ask before you sign anything. Sent once, no spam.
      </p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="bg-white text-pink-700 font-semibold px-6 py-3 rounded-lg hover:bg-pink-50 disabled:bg-pink-200 whitespace-nowrap"
        >
          {status === 'submitting' ? 'Sending...' : 'Send me the checklist'}
        </button>
      </form>
      {error && (
        <p className="mt-3 text-sm text-pink-100">⚠ {error}</p>
      )}
    </aside>
  );
}
