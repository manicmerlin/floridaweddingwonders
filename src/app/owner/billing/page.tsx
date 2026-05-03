import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import { isStripeConfigured } from '@/lib/stripe';
import OpenPortalButton from '@/components/owner/OpenPortalButton';

// Phase 6 — Billing landing page for venue owners. Renders subscription
// summaries server-side, then the client-side button creates a Stripe
// Customer Portal session via /api/stripe/portal and redirects.
//
// Auth-gated: signed-in users only. If the user owns no venues with active
// subscriptions, the page surfaces an explanation rather than a dead
// "Manage billing" button.

export const dynamic = 'force-dynamic';

interface SubscriptionSummary {
  id: string;
  venueName: string;
  venueSlug: string;
  tier: 'growth' | 'scale';
  status: string;
  isLifetime: boolean;
  amountCents: number;
  currentPeriodEnd: string | null;
}

async function getSubscriptionsForOwner(profileId: string): Promise<SubscriptionSummary[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('subscriptions')
    .select(
      'id, tier, status, is_lifetime, amount_cents, current_period_end, venues:venue_id(name, slug)'
    )
    .eq('profile_id', profileId)
    .order('last_event_at', { ascending: false });
  return (data ?? []).map((s: any) => ({
    id: s.id,
    venueName: s.venues?.name ?? '(unknown venue)',
    venueSlug: s.venues?.slug ?? '',
    tier: s.tier,
    status: s.status,
    isLifetime: !!s.is_lifetime,
    amountCents: s.amount_cents ?? 0,
    currentPeriodEnd: s.current_period_end,
  }));
}

export default async function OwnerBillingPage() {
  const session = await getAppSession();
  if (!session) redirect('/login?next=/owner/billing');

  const subscriptions = await getSubscriptionsForOwner(session.user.id);
  const stripeConfigured = isStripeConfigured();
  const hasActive = subscriptions.some((s) =>
    ['active', 'trialing', 'past_due'].includes(s.status)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <Link
            href="/venue-owner/dashboard"
            className="text-sm text-pink-600 hover:underline"
          >
            ← Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Billing</h1>
          <p className="text-gray-600 mt-1">
            Manage your venue subscriptions, payment method, and invoices.
          </p>
        </header>

        {/* Stripe-not-configured banner */}
        {!stripeConfigured && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 text-sm">
            <strong>Payments not yet configured.</strong> The billing portal
            activates once Stripe is wired up. To make changes today, email{' '}
            <a href="mailto:hello@floridaweddingwonders.com" className="underline">
              hello@floridaweddingwonders.com
            </a>
            .
          </div>
        )}

        {/* Subscription summaries */}
        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="text-5xl mb-3">💳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              No subscriptions on file
            </h2>
            <p className="text-gray-600 mb-4">
              You don't have any paid venue subscriptions yet. The starter tier is
              free; paid tiers unlock priority placement and additional photo slots.
            </p>
            <Link
              href="/venue-packages"
              className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-semibold px-5 py-2 rounded-lg"
            >
              See plans
            </Link>
          </div>
        ) : (
          <section className="space-y-4">
            {subscriptions.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between gap-4 flex-wrap"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{s.venueName}</h3>
                    <TierBadge tier={s.tier} />
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    {s.isLifetime
                      ? `Lifetime · $${(s.amountCents / 100).toFixed(0)} one-time`
                      : `$${(s.amountCents / 100).toFixed(0)}/yr · renews ${
                          s.currentPeriodEnd
                            ? new Date(s.currentPeriodEnd).toLocaleDateString()
                            : '—'
                        }`}
                  </p>
                </div>
                {s.venueSlug && (
                  <Link
                    href={`/venues/${s.venueSlug}`}
                    target="_blank"
                    className="text-sm text-pink-600 hover:underline"
                  >
                    View public listing →
                  </Link>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Open portal action */}
        {hasActive && stripeConfigured && (
          <div className="mt-8 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-2">Manage in Stripe</h2>
            <p className="text-pink-100 mb-4">
              Open the secure Stripe Customer Portal to update your payment method,
              download invoices, or cancel a subscription. You'll come right back
              here when you're done.
            </p>
            <OpenPortalButton />
          </div>
        )}

        {hasActive && !stripeConfigured && (
          <div className="mt-8 bg-gray-100 text-gray-700 rounded-2xl p-6 text-center text-sm">
            The Stripe Customer Portal will be available once payments are
            configured. Email support to make changes in the meantime.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function TierBadge({ tier }: { tier: 'growth' | 'scale' }) {
  const cls =
    tier === 'scale'
      ? 'bg-amber-100 text-amber-800 border border-amber-200'
      : 'bg-purple-100 text-purple-800 border border-purple-200';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${cls}`}>
      {tier === 'scale' ? '★ Scale' : 'Growth'}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = (
    {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      past_due: 'bg-red-100 text-red-800',
      canceled: 'bg-gray-100 text-gray-600',
      incomplete: 'bg-yellow-100 text-yellow-800',
    } as Record<string, string>
  )[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${cls}`}>
      {status}
    </span>
  );
}
