import { NextRequest, NextResponse } from 'next/server';
import {
  getStripeClient,
  isStripeConfigured,
  resolvePriceForTier,
  PAYMENTS_NOT_CONFIGURED,
  type PaidTier,
} from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getAppSession } from '@/lib/authServer';

// POST /api/stripe/checkout
// Body: { tier: 'growth' | 'scale', venueId: string (uuid),
//         claimRequestId?: string, successPath?: string, cancelPath?: string }
//
// Auth: must be signed in via Supabase. Phase 1 auth.
//
// Behaviour:
//   - 503 if STRIPE_SECRET_KEY or the relevant STRIPE_PRICE_* env var is unset
//   - 401 if no session
//   - 400 on input validation failure
//   - 404 if venue doesn't exist
//   - 200 { url } with the Stripe Checkout URL on success
//
// We pre-create an `incomplete` row in `subscriptions` keyed on the
// Checkout Session ID so the webhook handler can transition state on
// completion instead of inserting fresh rows. UNIQUE constraints on the
// Stripe IDs handle the "Stripe retries the webhook" case.
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(PAYMENTS_NOT_CONFIGURED, { status: 503 });
  }
  const stripe = getStripeClient()!;

  const session = await getAppSession();
  if (!session) {
    return NextResponse.json(
      { error: 'You must be signed in to start checkout.' },
      { status: 401 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const tier = body?.tier as PaidTier | undefined;
  const venueId = typeof body?.venueId === 'string' ? body.venueId : null;
  const claimRequestId =
    typeof body?.claimRequestId === 'string' ? body.claimRequestId : null;
  const successPath: string =
    typeof body?.successPath === 'string' ? body.successPath : '/venue-owner/dashboard';
  const cancelPath: string =
    typeof body?.cancelPath === 'string' ? body.cancelPath : '/venue-packages';

  if (tier !== 'growth' && tier !== 'scale') {
    return NextResponse.json(
      { error: 'tier must be "growth" or "scale"' },
      { status: 400 }
    );
  }
  if (!venueId) {
    return NextResponse.json({ error: 'venueId is required' }, { status: 400 });
  }

  const price = resolvePriceForTier(tier);
  if (!price) {
    return NextResponse.json(PAYMENTS_NOT_CONFIGURED, { status: 503 });
  }

  // Validate that the venue exists. Use the SSR client so RLS applies (still
  // a public-SELECT table, this is just defense in depth).
  const supabase = createSupabaseServerClient();
  const { data: venue, error: venueErr } = await supabase
    .from('venues')
    .select('id, name, slug')
    .eq('id', venueId)
    .maybeSingle();
  if (venueErr || !venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  // Build absolute URLs for Stripe success/cancel callbacks.
  const origin = request.headers.get('origin') || request.nextUrl.origin;
  const successUrl = `${origin}${successPath}?stripe=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}${cancelPath}?stripe=cancel`;

  // Create or reuse a Stripe Customer for this profile. We don't cache the
  // customer id on profiles yet (Phase 3B optimization); just look up by
  // email each time. Stripe dedupes silently if we pass a known email.
  let customerId: string;
  const existingCustomers = await stripe.customers.list({
    email: session.user.email ?? undefined,
    limit: 1,
  });
  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
  } else {
    const created = await stripe.customers.create({
      email: session.user.email ?? undefined,
      metadata: { profileId: session.user.id },
    });
    customerId = created.id;
  }

  // Create the Checkout Session.
  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: price.mode,
    line_items: [{ price: price.priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    // metadata flows through to webhook events so we can correlate.
    metadata: {
      profileId: session.user.id,
      venueId,
      tier,
      claimRequestId: claimRequestId ?? '',
    },
    // For one-time payments (Scale), surface the nonrefundable terms in the
    // Checkout description.
    payment_intent_data:
      price.mode === 'payment'
        ? {
            description: `Florida Wedding Wonders — Scale tier for ${venue.name}. NONREFUNDABLE one-time purchase. Includes lifetime Growth access.`,
            metadata: {
              profileId: session.user.id,
              venueId,
              tier,
              claimRequestId: claimRequestId ?? '',
            },
          }
        : undefined,
    subscription_data:
      price.mode === 'subscription'
        ? {
            metadata: {
              profileId: session.user.id,
              venueId,
              tier,
              claimRequestId: claimRequestId ?? '',
            },
          }
        : undefined,
  });

  if (!checkout.url) {
    return NextResponse.json(
      { error: 'Stripe did not return a Checkout URL' },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: checkout.url, sessionId: checkout.id });
}
