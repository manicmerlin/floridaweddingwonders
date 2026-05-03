'use client';

import { useMemo, useState } from 'react';
import type { BudgetCategory } from '@/lib/budgetCategories';

interface Props {
  categories: BudgetCategory[];
}

const PRESET_BUDGETS = [15000, 25000, 40000, 60000, 100000];

/**
 * Interactive budget calculator. Sliders represent each category's $ amount.
 * Dragging one rebalances the rest proportionally so the total stays equal
 * to the user's input budget. "Save my breakdown" hits the API to email
 * the breakdown + add to newsletter.
 */
export default function BudgetCalculatorClient({ categories }: Props) {
  const [total, setTotal] = useState<number>(40000);
  // Start with default share allocation. Stored as $ values, not percentages,
  // so the user can adjust total without losing manual customizations.
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const c of categories) out[c.id] = Math.round(c.defaultShare * 40000);
    return out;
  });

  const setTotalAndScale = (next: number) => {
    if (!Number.isFinite(next) || next <= 0) {
      setTotal(0);
      return;
    }
    const oldTotal = Object.values(allocations).reduce((a, b) => a + b, 0) || 1;
    const factor = next / oldTotal;
    const scaled: Record<string, number> = {};
    for (const c of categories) {
      scaled[c.id] = Math.round((allocations[c.id] ?? 0) * factor);
    }
    setAllocations(scaled);
    setTotal(next);
  };

  // When user moves one category's slider, redistribute the delta across
  // every other category proportionally to their current allocations.
  const setCategory = (id: string, value: number) => {
    const others = categories.filter((c) => c.id !== id);
    const oldValue = allocations[id] ?? 0;
    const delta = value - oldValue;
    const othersTotal = others.reduce((acc, c) => acc + (allocations[c.id] ?? 0), 0);
    const next: Record<string, number> = { ...allocations, [id]: value };
    if (othersTotal > 0) {
      for (const c of others) {
        const cur = allocations[c.id] ?? 0;
        const share = cur / othersTotal;
        next[c.id] = Math.max(0, Math.round(cur - delta * share));
      }
    }
    setAllocations(next);
  };

  const computedTotal = useMemo(
    () => Object.values(allocations).reduce((a, b) => a + b, 0),
    [allocations]
  );

  const venueAllocation = allocations.venue ?? 0;

  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const saveBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState('submitting');
    setSubmitError(null);
    try {
      const res = await fetch('/api/tools/budget-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          total: computedTotal,
          allocations: categories.map((c) => ({
            id: c.id,
            label: c.label,
            amount: allocations[c.id] ?? 0,
          })),
        }),
      });
      if (!res.ok) {
        const r = await res.json().catch(() => ({}));
        setSubmitError(r?.error || 'Could not save');
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
      {/* Total budget input */}
      <section>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Your total wedding budget
        </label>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900">$</span>
          <input
            type="number"
            min={0}
            step={500}
            value={total}
            onChange={(e) => setTotalAndScale(parseInt(e.target.value, 10) || 0)}
            className="flex-1 text-2xl font-bold border-b-2 border-gray-300 focus:border-pink-600 focus:outline-none py-2"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {PRESET_BUDGETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setTotalAndScale(p)}
              className={`px-3 py-1 rounded-full text-sm border transition ${
                total === p
                  ? 'bg-pink-600 text-white border-pink-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-pink-400'
              }`}
            >
              ${p.toLocaleString()}
            </button>
          ))}
        </div>
      </section>

      {/* Category sliders */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Your allocation
        </h2>
        <div className="space-y-3">
          {categories.map((c) => {
            const amt = allocations[c.id] ?? 0;
            const pct = computedTotal > 0 ? (amt / computedTotal) * 100 : 0;
            return (
              <div key={c.id} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-12 sm:col-span-3">
                  <p className="font-medium text-gray-900 text-sm">{c.label}</p>
                  <p className="text-xs text-gray-500">{c.description}</p>
                </div>
                <div className="col-span-9 sm:col-span-7">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(total, amt)}
                    step={100}
                    value={amt}
                    onChange={(e) => setCategory(c.id, parseInt(e.target.value, 10) || 0)}
                    className="w-full accent-pink-600"
                    aria-label={`${c.label} amount`}
                  />
                </div>
                <div className="col-span-3 sm:col-span-2 text-right">
                  <p className="font-bold text-gray-900">${amt.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{pct.toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
          <span className="font-semibold text-gray-700">Total</span>
          <span className="text-2xl font-bold text-pink-600">
            ${computedTotal.toLocaleString()}
          </span>
        </div>
      </section>

      {/* Save breakdown — email capture */}
      <section className="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200 rounded-2xl p-6">
        {submitState === 'done' ? (
          <div className="text-center">
            <div className="text-3xl mb-2">📬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Your breakdown is on its way.</h3>
            <p className="text-gray-700">
              Check your inbox — you can save the email as a PDF from any email client.
            </p>
          </div>
        ) : (
          <form onSubmit={saveBreakdown} className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900">Email me my breakdown</h3>
            <p className="text-gray-700 text-sm">
              We'll send your customized budget plus our planning newsletter (one
              email a month, easy unsubscribe).
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
                {submitState === 'submitting' ? 'Sending...' : 'Send my breakdown'}
              </button>
            </div>
            {submitError && (
              <p className="text-sm text-red-700">⚠ {submitError}</p>
            )}
          </form>
        )}
      </section>

      {/* Find venues CTA */}
      <section className="text-center text-gray-700 text-sm">
        <p>
          Your venue+catering budget is{' '}
          <span className="font-semibold text-gray-900">
            ${venueAllocation.toLocaleString()}
          </span>
          . That's roughly{' '}
          <span className="font-semibold text-gray-900">
            {venueAllocation < 12000
              ? 'a chapel, country-club ballroom, or smaller waterfront venue (off-peak)'
              : venueAllocation < 25000
              ? 'a hotel ballroom, garden estate, or mid-tier resort'
              : venueAllocation < 50000
              ? 'a full-service resort, historic estate, or beachfront venue (peak season)'
              : 'a luxury Keys / Palm Beach / South Beach destination wedding'}
          </span>
          .
        </p>
      </section>
    </div>
  );
}
