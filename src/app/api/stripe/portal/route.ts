import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import { getStripeClient, isStripeConfigured, PAYMENTS_NOT_CONFIGURED } from '@/lib/stripe';

// POST /api/stripe/portal
//
// Creates a Stripe Customer Portal session for the signed-in venue owner
// and returns the redirect URL. The portal lets the customer manage their
// subscription (update payment method, view invoices, cancel) without us
// building a UI for it. Activates when STRIPE_SECRET_KEY is set; until then
// it returns the standard 503.
//
// We look up the customer's stripe_customer_id by joining venue_ownerships
// → subscriptions for the signed-in profile. If they have multiple owned
// venues with different customers (rare but possible if someone bought
// Scale for one and Growth for another), we use the most recently-active
// subscription's customer.

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(PAYMENTS_NOT_CONFIGURED, { status: 503 });
  }

  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // Find the most recently-active subscription for this profile.
  const { data: subs } = await admin
    .from('subscriptions')
    .select('stripe_customer_id, status, last_event_at')
    .eq('profile_id', session.user.id)
    .in('status', ['active', 'past_due', 'trialing'])
    .order('last_event_at', { ascending: false })
    .limit(1);

  const customerId = subs?.[0]?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json(
      { error: 'No active subscription found for this account.' },
      { status: 404 }
    );
  }

  const stripe = getStripeClient()!;

  // Caller may pass ?next=/some/path — sanitize to same-origin paths only.
  const body = await request.json().catch(() => ({}));
  const safeNext = sanitizeReturnPath(body?.returnTo);
  const origin = request.headers.get('origin') ?? 'https://floridaweddingwonders.com';

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}${safeNext}`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error('Stripe portal session create failed:', err);
    return NextResponse.json(
      { error: 'Could not open the billing portal. Try again in a minute.' },
      { status: 502 }
    );
  }
}

function sanitizeReturnPath(input: unknown): string {
  if (typeof input !== 'string') return '/venue-owner/dashboard';
  // Reject absolute URLs, protocol-relative URLs, and anything that doesn't
  // start with `/`. This blocks open-redirect via the return_url field.
  if (!input.startsWith('/') || input.startsWith('//')) {
    return '/venue-owner/dashboard';
  }
  return input;
}
