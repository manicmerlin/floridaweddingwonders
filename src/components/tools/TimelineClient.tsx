'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Milestone,
  CATEGORY_LABELS,
  attachDueDates,
} from '@/lib/timelineMilestones';

interface Props {
  milestones: Milestone[];
}

const STORAGE_KEY = 'fww_timeline_state_v1';

interface PersistedState {
  weddingDate: string;
  done: Record<string, boolean>;
}

/**
 * Wedding planning timeline. User enters a wedding date; we render every
 * milestone with its computed due date. Check-off state persists in
 * localStorage so a couple can come back over weeks/months and pick up.
 * "Email me my timeline" hits the API to send a printable HTML email +
 * newsletter signup.
 */
export default function TimelineClient({ milestones }: Props) {
  const [weddingDate, setWeddingDate] = useState<string>('');
  const [done, setDone] = useState<Record<string, boolean>>({});

  // Restore previous session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed.weddingDate) setWeddingDate(parsed.weddingDate);
        if (parsed.done) setDone(parsed.done);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!weddingDate && Object.keys(done).length === 0) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ weddingDate, done } satisfies PersistedState)
      );
    } catch {
      /* ignore quota errors */
    }
  }, [weddingDate, done]);

  const grouped = useMemo(() => {
    if (!weddingDate) return null;
    const date = new Date(weddingDate);
    if (Number.isNaN(date.getTime())) return null;
    const withDue = attachDueDates(date);
    const byCategory: Record<string, typeof withDue> = {};
    for (const m of withDue) {
      (byCategory[m.category] ||= []).push(m);
    }
    return byCategory;
  }, [weddingDate]);

  const completedCount = milestones.filter((m) => done[m.id]).length;
  const progressPct = milestones.length
    ? Math.round((completedCount / milestones.length) * 100)
    : 0;

  // Email capture
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState('submitting');
    setSubmitError(null);
    try {
      const res = await fetch('/api/tools/timeline-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, weddingDate, done }),
      });
      if (!res.ok) {
        const r = await res.json().catch(() => ({}));
        setSubmitError(r?.error || 'Could not send');
        setSubmitState('error');
        return;
      }
      setSubmitState('done');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong');
      setSubmitState('error');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 sm:p-10 space-y-8">
      {/* Wedding date input */}
      <section>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Your wedding date
        </label>
        <input
          type="date"
          value={weddingDate}
          onChange={(e) => setWeddingDate(e.target.value)}
          className="text-xl font-bold border-b-2 border-gray-300 focus:border-pink-600 focus:outline-none py-2"
        />
        {weddingDate && (
          <p className="text-sm text-gray-600 mt-2">
            {weddingDate} — {milestones.length} milestones · {completedCount} complete · {progressPct}%
          </p>
        )}
      </section>

      {/* Progress bar */}
      {weddingDate && (
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Milestone list grouped by category */}
      {!grouped && (
        <div className="text-center py-12 text-gray-500">
          Enter a wedding date above to generate your personalized timeline.
        </div>
      )}

      {grouped && Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} aria-labelledby={`heading-${cat}`}>
          <h2
            id={`heading-${cat}`}
            className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200"
          >
            {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
          </h2>
          <ul className="space-y-3">
            {items.map((m) => (
              <li
                key={m.id}
                className={`flex gap-3 items-start p-4 rounded-lg transition ${
                  done[m.id] ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!done[m.id]}
                  onChange={(e) =>
                    setDone((prev) => ({ ...prev, [m.id]: e.target.checked }))
                  }
                  className="mt-1 w-5 h-5 accent-pink-600 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <h3
                      className={`font-semibold ${
                        done[m.id] ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}
                    >
                      {m.title}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      Due {m.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${done[m.id] ? 'text-gray-400' : 'text-gray-700'}`}>
                    {m.description}
                  </p>
                  {m.cta && !done[m.id] && (
                    <a
                      href={m.cta.href}
                      className="inline-block mt-2 text-sm text-pink-600 hover:text-pink-700 font-semibold"
                    >
                      {m.cta.label} →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Email capture */}
      {weddingDate && (
        <section className="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200 rounded-2xl p-6">
          {submitState === 'done' ? (
            <div className="text-center">
              <div className="text-3xl mb-2">📬</div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Your timeline is on its way.</h3>
              <p className="text-gray-700">
                Check your inbox — save the email as a PDF from any email client for a printable copy.
              </p>
            </div>
          ) : (
            <form onSubmit={sendEmail} className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">Email me my timeline</h3>
              <p className="text-gray-700 text-sm">
                We'll send the full personalized checklist plus our planning newsletter
                (one email a month, easy unsubscribe).
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={submitState === 'submitting'}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-3 rounded-lg disabled:bg-pink-300 whitespace-nowrap"
                >
                  {submitState === 'submitting' ? 'Sending...' : 'Send my timeline'}
                </button>
              </div>
              {submitError && (
                <p className="text-sm text-red-700">⚠ {submitError}</p>
              )}
            </form>
          )}
        </section>
      )}
    </div>
  );
}
