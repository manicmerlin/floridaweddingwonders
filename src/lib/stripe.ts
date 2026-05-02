// Server-only Stripe client.
//
// Designed to *not* crash when STRIPE_SECRET_KEY is missing — so the rest of
// the app (catalog, claims, etc.) keeps working even before the Stripe
// dashboard work happens. Routes that need Stripe call getStripeClient()
// and bail with a 503 when it returns null.

import Stripe from 'stripe';

const SECRET = process.env.STRIPE_SECRET_KEY;
const PRICE_GROWTH_ANNUAL = process.env.STRIPE_PRICE_GROWTH_ANNUAL;
const PRICE_SCALE = process.env.STRIPE_PRICE_SCALE;
const PRICE_GROWTH_MONTHLY = process.env.STRIPE_PRICE_GROWTH_MONTHLY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

let cachedClient: Stripe | null = null;

/**
 * Returns the Stripe client, or null when payments aren't configured yet.
 * Cached at module level so we don't re-construct per request.
 */
export function getStripeClient(): Stripe | null {
  if (!SECRET) return null;
  if (cachedClient) return cachedClient;
  cachedClient = new Stripe(SECRET, {
    // Pin to a known API version so behavior doesn't drift when Stripe
    // releases new defaults. Update this consciously.
    apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
    typescript: true,
    appInfo: {
      name: 'Florida Wedding Wonders',
      version: '1.0.0',
    },
  });
  return cachedClient;
}

/**
 * Quick boolean for routes that want to short-circuit before doing any work.
 */
export function isStripeConfigured(): boolean {
  return !!SECRET;
}

export type PaidTier = 'growth' | 'scale';

export interface ResolvedPrice {
  priceId: string;
  mode: 'subscription' | 'payment';
  amountCents: number;
  isLifetime: boolean;
}

/**
 * Map a tier slug → the Stripe price_id we'll attach to the Checkout Session.
 * Returns null when the env var is unset (so the caller can 503 cleanly).
 */
export function resolvePriceForTier(tier: PaidTier): ResolvedPrice | null {
  if (tier === 'growth') {
    if (!PRICE_GROWTH_ANNUAL) return null;
    return {
      priceId: PRICE_GROWTH_ANNUAL,
      mode: 'subscription',
      amountCents: 25000, // $250.00
      isLifetime: false,
    };
  }
  if (tier === 'scale') {
    if (!PRICE_SCALE) return null;
    return {
      priceId: PRICE_SCALE,
      mode: 'payment',
      amountCents: 250000, // $2,500.00
      isLifetime: true,
    };
  }
  return null;
}

/**
 * Webhook signature secret. Returned as null when unset; caller bails.
 */
export function getWebhookSecret(): string | null {
  return WEBHOOK_SECRET || null;
}

/**
 * Standardised "payments not configured" response. Routes that need Stripe
 * call this instead of returning their own 503 to keep the message uniform.
 */
export const PAYMENTS_NOT_CONFIGURED = {
  error: 'Payments not yet configured. Please contact hello@floridaweddingwonders.com to complete this signup manually.',
  code: 'payments_not_configured',
} as const;
