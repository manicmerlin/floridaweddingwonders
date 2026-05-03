'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Venue } from '@/types';

interface Props {
  venue: Venue;
}

type Tier = 'starter' | 'growth' | 'scale';

interface FormState {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  relationshipToVenue: string;
  notes: string;
  intendedTier: Tier;
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  businessName: '',
  relationshipToVenue: '',
  notes: '',
  intendedTier: 'starter',
};

export default function VenueClaimButton({ venue }: Props) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    tier: Tier;
    paymentsConfigured: boolean;
  } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // ?claim=1 in the URL auto-opens the claim modal. Used by the personalized
  // /claim/[slug] cold-outreach landing pages (Phase 6) — couples land on a
  // splash, click "Claim this listing," and arrive on the venue page with
  // the modal already open.
  useEffect(() => {
    if (authLoading) return;
    const wantsClaim = searchParams?.get('claim') === '1';
    if (wantsClaim && isAuthenticated && !open && !success) {
      setForm({
        ...EMPTY_FORM,
        name: (user?.user_metadata?.full_name as string) || '',
        email: user?.email || '',
      });
      setOpen(true);
    }
  }, [searchParams, isAuthenticated, authLoading, user, open, success]);

  const handleClaimClick = () => {
    if (!isAuthenticated) {
      // Stash the return URL so /login redirects back here after sign-in.
      if (typeof window !== 'undefined') {
        localStorage.setItem('returnUrl', `/venues/${venue.slug || venue.id}?claim=1`);
      }
      router.push('/login');
      return;
    }
    // Pre-fill from auth where we have it.
    setForm({
      ...EMPTY_FORM,
      name: (user?.user_metadata?.full_name as string) || '',
      email: user?.email || '',
    });
    setError(null);
    setSuccess(null);
    setOpen(true);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: venue.uuid, // use the UUID; falls back to slug below
          venueSlug: venue.slug || venue.id,
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          businessName: form.businessName || undefined,
          relationshipToVenue: form.relationshipToVenue || undefined,
          notes: form.notes || undefined,
          intendedTier: form.intendedTier,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result?.error || 'Could not submit claim. Please try again.');
        return;
      }

      // Starter tier: claim sits pending; admin reviews. Show thank-you.
      if (form.intendedTier === 'starter') {
        setSuccess({ tier: 'starter', paymentsConfigured: true });
        return;
      }

      // Paid tier: kick off Stripe Checkout. If Stripe isn't configured yet,
      // the route returns 503 with a clean message; we surface that instead
      // of a hard error.
      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: form.intendedTier,
          venueId: result.venueId,
          claimRequestId: result.claimRequestId,
          successPath: `/venues/${venue.slug || venue.id}?stripe=success`,
          cancelPath: `/venues/${venue.slug || venue.id}?stripe=cancel`,
        }),
      });
      const checkoutResult = await checkoutRes.json().catch(() => ({}));
      if (checkoutRes.status === 503) {
        // Payments not yet configured. Claim is recorded; show graceful note.
        setSuccess({ tier: form.intendedTier, paymentsConfigured: false });
        return;
      }
      if (!checkoutRes.ok) {
        setError(checkoutResult?.error || 'Could not start payment. Please try again.');
        return;
      }
      // Redirect to Stripe-hosted Checkout.
      if (checkoutResult.url) {
        window.location.href = checkoutResult.url;
        return;
      }
      setError('Stripe did not return a redirect URL.');
    } catch (err) {
      console.error('Claim submission failed', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Already-claimed venue: show banner instead of button.
  if (venue.claimStatus === 'claimed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-green-800">This venue is claimed</h3>
        <p className="text-sm text-green-700 mt-1">
          The business owner manages this listing.
        </p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 animate-pulse">
        <div className="h-4 w-48 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-800">Own or manage this venue?</h3>
        <p className="text-sm text-blue-700 mt-1">
          Claim your listing to manage photos, info, and capture leads.
        </p>
        <button
          onClick={handleClaimClick}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {isAuthenticated ? 'Claim This Venue' : 'Sign In to Claim'}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Claim {venue.name}</h2>
                <p className="text-sm text-gray-500">
                  We'll review your claim and reach out within 1 business day.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {success ? (
              <SuccessPanel
                venueName={venue.name}
                tier={success.tier}
                paymentsConfigured={success.paymentsConfigured}
                onClose={() => {
                  setOpen(false);
                  setSuccess(null);
                }}
              />
            ) : (
              <form onSubmit={submit} className="p-6 space-y-5">
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                    {error}
                  </div>
                )}

                <Field label="Your Name" required>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </Field>

                <Field label="Email" required>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </Field>

                <Field label="Phone">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </Field>

                <Field label="Business name (if different from venue name)">
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => setField('businessName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </Field>

                <Field label="Your relationship to this venue">
                  <input
                    type="text"
                    value={form.relationshipToVenue}
                    onChange={(e) => setField('relationshipToVenue', e.target.value)}
                    placeholder="Owner, general manager, marketing director…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </Field>

                <Field label="Anything else we should know?">
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </Field>

                <div className="border-t pt-5">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Pick a plan</h3>
                  <div className="space-y-2">
                    <TierRadio
                      value="starter"
                      label="Starter"
                      desc="Free — basic listing, 2 photos, no lead capture"
                      selected={form.intendedTier}
                      onChange={(t) => setField('intendedTier', t)}
                    />
                    <TierRadio
                      value="growth"
                      label="Growth — $250 / year"
                      desc="Unlimited photos, lead capture, Featured badge & placement"
                      selected={form.intendedTier}
                      onChange={(t) => setField('intendedTier', t)}
                    />
                    <TierRadio
                      value="scale"
                      label="Scale — $2,500 (lifetime, NONREFUNDABLE)"
                      desc="Pro photo + drone shoot, lifetime Growth, Founding Partner badge, homepage rotation"
                      selected={form.intendedTier}
                      onChange={(t) => setField('intendedTier', t)}
                    />
                  </div>
                  {form.intendedTier === 'scale' && (
                    <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                      <strong>Final sale.</strong> Scale tier is a one-time, nonrefundable
                      purchase. By proceeding to payment you agree to our{' '}
                      <a href="/terms" target="_blank" className="underline">
                        Terms of Service
                      </a>
                      .
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-md"
                  >
                    {submitting
                      ? 'Submitting…'
                      : form.intendedTier === 'starter'
                        ? 'Submit claim'
                        : 'Continue to payment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {children}
    </label>
  );
}

function TierRadio({
  value,
  label,
  desc,
  selected,
  onChange,
}: {
  value: Tier;
  label: string;
  desc: string;
  selected: Tier;
  onChange: (t: Tier) => void;
}) {
  const isSelected = selected === value;
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <input
        type="radio"
        name="intendedTier"
        value={value}
        checked={isSelected}
        onChange={() => onChange(value)}
        className="mt-1"
      />
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-600 mt-0.5">{desc}</div>
      </div>
    </label>
  );
}

function SuccessPanel({
  venueName,
  tier,
  paymentsConfigured,
  onClose,
}: {
  venueName: string;
  tier: Tier;
  paymentsConfigured: boolean;
  onClose: () => void;
}) {
  return (
    <div className="p-6 text-center space-y-4">
      <div className="text-5xl">✅</div>
      <h3 className="text-xl font-semibold text-gray-900">Claim received</h3>
      {tier === 'starter' ? (
        <p className="text-gray-600">
          Your claim for <strong>{venueName}</strong> has been submitted. We'll review and
          email you within 1 business day.
        </p>
      ) : paymentsConfigured ? (
        <p className="text-gray-600">
          Redirecting you to checkout for the <strong>{tier}</strong> plan…
        </p>
      ) : (
        <p className="text-gray-600">
          Your claim for <strong>{venueName}</strong> is recorded with your selected{' '}
          <strong>{tier}</strong> plan. Online payments aren't configured yet — we'll email
          you to complete payment as soon as they're live.
        </p>
      )}
      <button
        onClick={onClose}
        className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
      >
        Done
      </button>
    </div>
  );
}
