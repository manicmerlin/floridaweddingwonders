import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import {
  getStripeClient,
  getWebhookSecret,
  isStripeConfigured,
} from '@/lib/stripe';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';

// POST /api/stripe/webhook
// Stripe → us. Verifies the signature header against STRIPE_WEBHOOK_SECRET,
// then handles each event type. Idempotent: re-processing the same event
// either no-ops or trips a UNIQUE constraint we catch.
//
// Events handled (Phase 3A):
//   - checkout.session.completed       insert subscription + ownership, set venue.tier
//   - customer.subscription.updated    refresh status / current_period_end
//   - customer.subscription.deleted    mark canceled, downgrade venue.tier
//   - invoice.payment_succeeded        refresh current_period_end
//   - invoice.payment_failed           mark past_due
//   - charge.refunded                  for Scale: mark refunded, downgrade
//
// Returns 200 on success or recoverable errors so Stripe doesn't retry
// forever. Returns 4xx only for signature failures (don't retry).

export const dynamic = 'force-dynamic';

// Disable Next's automatic body parsing — Stripe needs the raw bytes for
// signature verification.
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    // 503 so Stripe retries with backoff once we configure the keys.
    // Stripe stops retrying after 3 days; if we haven't configured by then,
    // we'd need to manually replay events from the dashboard.
    return NextResponse.json(
      { error: 'Stripe is not configured on the server.' },
      { status: 503 }
    );
  }

  const webhookSecret = getWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET not configured.' },
      { status: 503 }
    );
  }

  const stripe = getStripeClient()!;
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // Read the raw body. NextRequest.text() returns the unparsed body.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Signature verification failed';
    console.error('Stripe webhook signature failed:', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const isTest = !event.livemode;

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event, isTest);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaid(supabase, event);
        break;
      case 'invoice.payment_failed':
        await handleInvoiceFailed(supabase, event);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(supabase, event);
        break;
      default:
        // Unhandled event type — ack with 200 so Stripe doesn't retry.
        console.log('Unhandled Stripe event type:', event.type);
    }
  } catch (err) {
    console.error('Webhook handler error for', event.type, err);
    // Return 500 so Stripe retries — the handler may have bombed mid-write
    // and we want eventual consistency.
    return NextResponse.json({ error: 'handler_error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

async function handleCheckoutCompleted(
  supabase: AdminClient,
  event: Stripe.Event,
  isTest: boolean
) {
  const session = event.data.object as Stripe.Checkout.Session;
  const meta = session.metadata || {};
  const venueId = meta.venueId;
  const profileId = meta.profileId;
  const tier = meta.tier as 'growth' | 'scale' | undefined;
  const claimRequestId = meta.claimRequestId || null;

  if (!venueId || !profileId || (tier !== 'growth' && tier !== 'scale')) {
    console.warn('checkout.session.completed missing required metadata', meta);
    return;
  }

  const stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : null;
  const stripePaymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : null;
  const customerId =
    typeof session.customer === 'string' ? session.customer : null;
  if (!customerId) return;

  // Resolve the Stripe price + amount snapshot.
  // The session has line_items only after expansion, so grab from the price.
  let priceId = '';
  let productId: string | null = null;
  let amountCents = session.amount_total ?? 0;
  if (session.subscription || session.payment_intent) {
    const stripe = getStripeClient()!;
    const expanded = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items.data.price'],
    });
    const item = expanded.line_items?.data?.[0];
    if (item?.price) {
      priceId = item.price.id;
      productId = typeof item.price.product === 'string' ? item.price.product : null;
      amountCents = item.amount_total ?? amountCents;
    }
  }

  const isLifetime = tier === 'scale';
  const status: 'active' = 'active';
  const currentPeriodEnd =
    !isLifetime && stripeSubscriptionId
      ? await fetchSubscriptionPeriodEnd(stripeSubscriptionId)
      : null;

  // Insert the subscription row. UNIQUE on stripe_subscription_id /
  // stripe_payment_intent_id makes this idempotent: a re-delivered event
  // hits 23505 and we treat it as already processed.
  const { data: subRow, error: subErr } = await supabase
    .from('subscriptions')
    .insert({
      venue_id: venueId,
      profile_id: profileId,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_payment_intent_id: stripePaymentIntentId,
      stripe_price_id: priceId,
      stripe_product_id: productId,
      tier,
      status,
      is_lifetime: isLifetime,
      current_period_end: currentPeriodEnd,
      amount_cents: amountCents,
      currency: session.currency ?? 'usd',
      is_test: isTest,
      last_event_id: event.id,
      last_event_at: new Date(event.created * 1000).toISOString(),
    })
    .select('id')
    .single();

  if (subErr) {
    if (subErr.code === '23505') {
      // Duplicate insert — already processed.
      console.log('checkout.session.completed: already processed', event.id);
      return;
    }
    throw subErr;
  }

  const subscriptionId = subRow!.id as string;

  // Upsert the venue_ownership to active. UNIQUE (profile_id, venue_id)
  // means we update an existing claim/pending row to active rather than
  // creating a duplicate.
  const { data: existingOwnership } = await supabase
    .from('venue_ownerships')
    .select('id')
    .eq('profile_id', profileId)
    .eq('venue_id', venueId)
    .maybeSingle();

  let ownershipId: string;
  if (existingOwnership) {
    ownershipId = existingOwnership.id as string;
    await supabase
      .from('venue_ownerships')
      .update({
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: profileId, // self-granted via Stripe payment
      })
      .eq('id', ownershipId);
  } else {
    const { data: newOwnership, error: ownErr } = await supabase
      .from('venue_ownerships')
      .insert({
        profile_id: profileId,
        venue_id: venueId,
        role: 'owner',
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: profileId,
      })
      .select('id')
      .single();
    if (ownErr) throw ownErr;
    ownershipId = newOwnership!.id as string;
  }

  // Link the subscription back to the ownership.
  await supabase
    .from('subscriptions')
    .update({ ownership_id: ownershipId })
    .eq('id', subscriptionId);

  // Update the denormalised tier on the venue.
  await supabase
    .from('venues')
    .update({
      tier,
      tier_expires_at: isLifetime ? null : currentPeriodEnd,
    })
    .eq('id', venueId);

  // If this checkout was attached to a claim_request, auto-approve it.
  if (claimRequestId) {
    await supabase
      .from('claim_requests')
      .update({
        status: 'approved',
        subscription_id: subscriptionId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', claimRequestId);
  }
}

async function handleSubscriptionUpdated(supabase: AdminClient, event: Stripe.Event) {
  const sub = event.data.object as Stripe.Subscription;
  const stripeSubId = sub.id;

  const { data: row } = await supabase
    .from('subscriptions')
    .select('id, venue_id, last_event_at')
    .eq('stripe_subscription_id', stripeSubId)
    .maybeSingle();
  if (!row) return; // Unknown sub, ignore.

  // Out-of-order delivery guard: skip if we already saw a newer event.
  const eventTime = new Date(event.created * 1000);
  if (row.last_event_at && new Date(row.last_event_at) > eventTime) {
    return;
  }

  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;
  const status = mapStripeSubscriptionStatus(sub.status);

  await supabase
    .from('subscriptions')
    .update({
      status,
      current_period_end: periodEnd,
      last_event_id: event.id,
      last_event_at: eventTime.toISOString(),
    })
    .eq('id', row.id);

  // Refresh the venue's tier_expires_at if subscription is still active.
  if (status === 'active' && periodEnd) {
    await supabase
      .from('venues')
      .update({ tier_expires_at: periodEnd })
      .eq('id', row.venue_id);
  }
}

async function handleSubscriptionDeleted(supabase: AdminClient, event: Stripe.Event) {
  const sub = event.data.object as Stripe.Subscription;
  const { data: row } = await supabase
    .from('subscriptions')
    .select('id, venue_id, tier')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle();
  if (!row) return;

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      last_event_id: event.id,
      last_event_at: new Date(event.created * 1000).toISOString(),
    })
    .eq('id', row.id);

  // Downgrade the venue back to starter.
  await supabase
    .from('venues')
    .update({ tier: 'starter', tier_expires_at: null })
    .eq('id', row.venue_id);
}

async function handleInvoicePaid(supabase: AdminClient, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const stripeSubId =
    typeof invoice.subscription === 'string' ? invoice.subscription : null;
  if (!stripeSubId) return;

  const { data: row } = await supabase
    .from('subscriptions')
    .select('id, venue_id')
    .eq('stripe_subscription_id', stripeSubId)
    .maybeSingle();
  if (!row) return;

  const periodEnd = await fetchSubscriptionPeriodEnd(stripeSubId);

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: periodEnd,
      last_event_id: event.id,
      last_event_at: new Date(event.created * 1000).toISOString(),
    })
    .eq('id', row.id);

  if (periodEnd) {
    await supabase
      .from('venues')
      .update({ tier_expires_at: periodEnd })
      .eq('id', row.venue_id);
  }
}

async function handleInvoiceFailed(supabase: AdminClient, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const stripeSubId =
    typeof invoice.subscription === 'string' ? invoice.subscription : null;
  if (!stripeSubId) return;

  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      last_event_id: event.id,
      last_event_at: new Date(event.created * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', stripeSubId);
  // Don't immediately downgrade — let Stripe's dunning retry succeed first.
}

async function handleChargeRefunded(supabase: AdminClient, event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
  if (!piId) return;

  const { data: row } = await supabase
    .from('subscriptions')
    .select('id, venue_id, is_lifetime')
    .eq('stripe_payment_intent_id', piId)
    .maybeSingle();
  if (!row) return;
  if (!row.is_lifetime) return; // Only Scale (one-time) cares about charge.refunded.

  await supabase
    .from('subscriptions')
    .update({
      status: 'refunded',
      last_event_id: event.id,
      last_event_at: new Date(event.created * 1000).toISOString(),
    })
    .eq('id', row.id);

  await supabase
    .from('venues')
    .update({ tier: 'starter', tier_expires_at: null })
    .eq('id', row.venue_id);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchSubscriptionPeriodEnd(subId: string): Promise<string | null> {
  const stripe = getStripeClient()!;
  const sub = await stripe.subscriptions.retrieve(subId);
  return sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;
}

function mapStripeSubscriptionStatus(
  s: Stripe.Subscription.Status
): 'incomplete' | 'active' | 'past_due' | 'canceled' {
  switch (s) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    case 'incomplete':
    default:
      return 'incomplete';
  }
}
