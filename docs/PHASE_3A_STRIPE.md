# Phase 3A — Stripe + Paid Tiers

**Status:** Plan only. No code yet. Awaiting confirmation on the open questions
in §9 before implementation.

---

## 1. Current state

- **No Stripe code.** `package.json` has neither `stripe` nor `@stripe/*`.
  Only TODO comments at [src/app/venue-packages/page.tsx:106](../src/app/venue-packages/page.tsx#L106) and
  [src/app/api/venue-package-signup/route.ts:30](../src/app/api/venue-package-signup/route.ts#L30).
  Greenfield from a packages perspective.
- **`/venue-packages` page exists and looks polished** — three tiers
  rendered from [src/lib/pricing.ts](../src/lib/pricing.ts), the
  "Get Started" form just `console.log`s and returns success today
  (visible at [src/app/api/venue-package-signup/route.ts:38](../src/app/api/venue-package-signup/route.ts#L38)).
- **The "Early Bird" modal on the same page** posts to `/api/send-email`
  with the wrong payload shape — the route expects `{email, type, venueName}`
  for subscriber capture but the modal sends `{to, subject, text, from, replyTo}`.
  So the Early Bird CTA also dead-ends today. We can fix it as part of this
  PR or leave for cleanup; flagging it.
- **Phase 1 `profiles` table is the auth user store** ([database/auth-bootstrap.sql:14](../database/auth-bootstrap.sql#L14)).
  Role enum already includes `'venue_owner'`. We extend on top of this — we
  do **not** revive the abandoned `venue_owners` table from the never-applied
  `auth-schema.sql`.
- **Phase 2A dropped the empty `venue_claims` table** with the catalog migration
  (CASCADE off the empty `venues`). The old `/api/admin/{approve,reject}-venue-claim`
  routes still exist but their target table is gone — they will 404 today.
  Phase 3A reintroduces a proper `claim_requests` table.

### The three tiers (current copy)

| Tier | Price | Billing | Notes |
| ---- | ----- | ------- | ----- |
| Starter | Free | n/a | 2 photos, basic listing |
| Growth | **$250/yr** | Annual recurring | FAQ also mentions a "$25/month payment plan" — needs reconciliation, see §9 |
| Scale | **$2,500** | One-time payment, lifetime Growth | Includes a pro photo shoot deliverable + Founding Partner badge |

---

## 2. Database schema

Two new tables + one enum column on `venues`. Plus reintroduce the dropped
claim tracking table. All idempotent (`CREATE TABLE IF NOT EXISTS` etc.).

### 2a. Add `tier` to `venues`

```sql
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'starter'
    CHECK (tier IN ('starter', 'growth', 'scale')),
  ADD COLUMN IF NOT EXISTS tier_expires_at TIMESTAMPTZ;
-- tier_expires_at is null for 'starter' (free forever) and 'scale' (lifetime).
-- Set to current_period_end for 'growth' subscriptions.

CREATE INDEX IF NOT EXISTS idx_venues_tier ON venues(tier);
```

Denormalised for read performance — RSC catalog pages can `SELECT tier`
without joining. Single writer: the Stripe webhook handler.

### 2b. `venue_ownerships`

Junction between auth user (via profiles) and venue. Multiple ownerships
per user supported (one user can own several venues; one venue can have
several owners later).

```sql
CREATE TABLE IF NOT EXISTS venue_ownerships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id      UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'owner'
                  CHECK (role IN ('owner', 'manager')),
  -- 'pending' until admin approves OR auto-approved on Stripe success.
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'revoked')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at   TIMESTAMPTZ,
  approved_by   UUID REFERENCES profiles(id),
  UNIQUE (profile_id, venue_id)
);
CREATE INDEX IF NOT EXISTS idx_venue_ownerships_profile ON venue_ownerships(profile_id);
CREATE INDEX IF NOT EXISTS idx_venue_ownerships_venue   ON venue_ownerships(venue_id);

ALTER TABLE venue_ownerships ENABLE ROW LEVEL SECURITY;

-- Owners read their own ownerships; admins read all.
CREATE POLICY ownerships_select_own  ON venue_ownerships FOR SELECT
  USING (profile_id = auth.uid());
CREATE POLICY ownerships_select_admin ON venue_ownerships FOR SELECT
  USING (is_super_admin());
-- No public writes; webhook + admin actions write via service role.
```

### 2c. `subscriptions`

Stripe-aware ledger. One row per Stripe Subscription **or** one-time payment.
Powers the webhook idempotency, the admin "what is this venue paying" view,
and the upgrade/downgrade history.

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                 UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  ownership_id             UUID REFERENCES venue_ownerships(id) ON DELETE SET NULL,

  -- Stripe identifiers
  stripe_customer_id       TEXT NOT NULL,
  stripe_subscription_id   TEXT UNIQUE,            -- null for one-time (Scale)
  stripe_payment_intent_id TEXT UNIQUE,            -- set for one-time
  stripe_price_id          TEXT NOT NULL,
  stripe_product_id        TEXT,

  -- Domain state
  tier                     TEXT NOT NULL CHECK (tier IN ('growth', 'scale')),
  status                   TEXT NOT NULL DEFAULT 'incomplete'
                             CHECK (status IN ('incomplete','active','past_due','canceled','refunded')),
  is_lifetime              BOOLEAN NOT NULL DEFAULT FALSE,   -- true for Scale
  current_period_end       TIMESTAMPTZ,                       -- null for Scale

  amount_cents             INTEGER NOT NULL,                  -- 25000 for Growth annual, 250000 for Scale
  currency                 TEXT NOT NULL DEFAULT 'usd',

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Audit: last webhook event that mutated this row
  last_event_id            TEXT,
  last_event_at            TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_venue    ON subscriptions(venue_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status   ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(stripe_customer_id);
```

Single table for both recurring (Growth) and one-time (Scale). Distinguished
by `is_lifetime` + which Stripe id is populated. Lots of admin-friendly
columns (price/product/customer ids) for debugging in the Stripe dashboard.

### 2d. `claim_requests` — reintroduce

The old `venue_claims` table was empty (0 rows in Phase 1 recon) and got
dropped in the Phase 2A catalog migration. The current `/api/admin/{approve,reject}-venue-claim`
routes have nothing to write to. Reintroduce with a name change (`claim_requests`
is clearer than `venue_claims`) and FK to `venues.id` UUID (the old table
referenced legacy ints).

```sql
CREATE TABLE IF NOT EXISTS claim_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id            UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  profile_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requester_email     TEXT NOT NULL,
  requester_name      TEXT NOT NULL,
  requester_phone     TEXT,
  business_name       TEXT,
  relationship_to_venue TEXT,
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected')),
  -- Linked subscription if the claim is part of a paid signup.
  -- Null for "I'm the owner" claims with no payment.
  subscription_id     UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  reviewed_by         UUID REFERENCES profiles(id),
  reviewed_at         TIMESTAMPTZ,
  rejection_reason    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2e. RLS sketch

- `venues`: existing public-SELECT stays. New writes (tier, tier_expires_at) go via service role from the webhook handler.
- `venue_ownerships`: read-own + admin-all; write via service role.
- `subscriptions`: read by row owner (via `ownership.profile_id = auth.uid()`) + admin-all; write via service role.
- `claim_requests`: insert by signed-in user for their own profile_id; read own + admin-all.

---

## 3. Stripe wiring

Two new server-only API routes (no client-side Stripe.js needed for Phase 3A
— we use Stripe Checkout's hosted redirect flow, simpler and PCI-compliant
out of the box).

### 3a. `POST /api/stripe/checkout`

Creates a Checkout Session and returns the URL for redirect.

**Auth:** must be signed-in via Supabase. (Phase 1 auth.)

**Input:**
```ts
{
  tier: 'growth' | 'scale',
  venueId: string,           // UUID of an existing venue
  successPath?: string,      // default '/venue-owner/dashboard'
  cancelPath?: string        // default '/venue-packages'
}
```

**Behavior:**
1. Look up the user's `profile_id` from session.
2. Find or create the Stripe Customer for this profile (cache `stripe_customer_id` on `profiles`).
3. Create a Checkout Session:
   - For Growth: `mode='subscription'`, `line_items=[{price: STRIPE_PRICE_GROWTH_ANNUAL, quantity:1}]`
   - For Scale: `mode='payment'`, `line_items=[{price: STRIPE_PRICE_SCALE, quantity:1}]`
   - `metadata: { venueId, profileId, tier }` ← critical for webhook correlation
   - `success_url`, `cancel_url` from input
4. Return `{ url: session.url }`.

The client redirects to `session.url`; Stripe handles payment; on success
Stripe POSTs to `/api/stripe/webhook`.

### 3b. `POST /api/stripe/webhook`

Handles Stripe events. Idempotent on `stripe_event_id`.

**Auth:** Stripe signature header verification using `STRIPE_WEBHOOK_SECRET`.

**Events handled (Phase 3A):**

| Event | Action |
| ----- | ------ |
| `checkout.session.completed` | Insert `subscriptions` row, insert `venue_ownerships(status='active')`, update `venues.tier` and `tier_expires_at`. |
| `customer.subscription.updated` | Update `subscriptions.status`, `current_period_end`, then refresh `venues.tier_expires_at`. |
| `customer.subscription.deleted` | Mark subscription `canceled`. Schedule downgrade to `starter` at period end (handled in §3c). |
| `invoice.payment_failed` | Mark `past_due`. Don't immediately downgrade — let Stripe retry per dunning policy. |
| `invoice.payment_succeeded` | Refresh `current_period_end` (renewal). |
| `charge.refunded` | For Scale: mark `refunded`, downgrade venue to `starter` immediately. |

Idempotency: a `webhook_events` table (or a `processed_events` set on `subscriptions.last_event_id` lookup) prevents double-processing on Stripe retries.

### 3c. Downgrade scheduler — out of scope for Phase 3A

For canceled Growth subs, we want to downgrade to `starter` at
`current_period_end`, not immediately. Two options:
- **Pull**: nightly cron checks `subscriptions WHERE status='canceled' AND current_period_end < NOW()` and downgrades.
- **Push**: rely on Stripe sending `customer.subscription.deleted` at period end (it fires when the sub fully terminates, not at cancellation request).

Stripe's behavior: `subscription.cancel(prorate: false)` fires `subscription.updated` with `cancel_at_period_end=true` immediately, then `subscription.deleted` at period end. We act on `deleted`, not the request. **No cron needed.** Documenting this here so we don't accidentally build it.

### 3d. Stripe Customer Portal — Phase 3B

Self-service cancellation/billing via `/api/stripe/portal` (creates a
Customer Portal session). Recommend deferring to 3B since it's not
revenue-blocking and adds Stripe dashboard configuration overhead.

---

## 4. UI wiring

### 4a. `/venue-packages` page changes

The "Get Started" form currently collects `name/email/venueName/phone/message`
and emails the admin. Replace with:

1. If not signed in: redirect to `/login?next=/venue-packages?tier=<tier>` first.
2. If signed in: a venue selector (search the 129 from catalog) → POST to `/api/stripe/checkout` → redirect to Stripe.
3. Starter: skip Checkout entirely. Just create a `claim_request` (status='pending') for admin review.
4. Early Bird modal: leave as a separate path that just emails admin (fix the broken `/api/send-email` payload while we're in there).

### 4b. Featured / Premium visual treatment

| Surface | Current | After |
| ------- | ------- | ----- |
| `VenueCard` | Same look for everyone | Add `Featured` badge for `tier='growth'` and `Founding Partner` badge for `tier='scale'`. |
| `/venues` listing sort | Premium owners first (already in code), then alpha | Sort: `scale` > `growth` > `starter`, then alpha. |
| Homepage | Static stats | Add a "Featured Venues" rotation pulling 6 random `tier IN ('growth','scale')` venues. |
| Region filter pages (e.g. `/venues?city=Miami`) | Current sort | Same featured-first treatment. |
| Detail page `/venues/[slug]` | Same template | Scale: hero photo gets a "Founding Partner" overlay corner; Growth: "Featured Listing" tag near venue name. |

### 4c. Per-tier feature flagging

A pure server-side helper:

```ts
// src/lib/tierFeatures.ts
export function tierFeatures(tier: 'starter' | 'growth' | 'scale') {
  return {
    maxPhotos: tier === 'starter' ? 2 : Infinity,
    maxVideos: tier === 'starter' ? 0 : tier === 'growth' ? 1 : Infinity,
    descriptionMaxChars: tier === 'starter' ? 100 : Infinity,
    maxTags: tier === 'starter' ? 3 : Infinity,
    contactMethods: tier === 'starter' ? 1 : 3,                // email/phone/website
    showLeadCaptureCTA: tier !== 'starter',                    // "Request Info" button
    analyticsLevel: tier === 'starter' ? 'none' : tier === 'growth' ? 'basic' : 'advanced',
    showFeaturedBadge: tier === 'growth',
    showFoundingPartnerBadge: tier === 'scale',
    homepageRotationEligible: tier === 'scale',
  } as const;
}
```

UI components import this and gate accordingly. Catalog data layer can also
truncate description / images server-side for Starter to enforce limits at
the SQL→TS mapper layer.

---

## 5. New env vars

Server-only (NOT prefixed `NEXT_PUBLIC_`):

| Name | Purpose |
| ---- | ------- |
| `STRIPE_SECRET_KEY` | Server-side API client. Use test key during development, live key in Vercel Production. |
| `STRIPE_WEBHOOK_SECRET` | For verifying webhook signatures. **Different secret per environment** — Stripe gives one for the test endpoint, one for the live endpoint. |
| `STRIPE_PRICE_GROWTH_ANNUAL` | The Stripe price_id (`price_xxx`) for the $250/yr Growth recurring price. |
| `STRIPE_PRICE_SCALE` | The Stripe price_id for the $2,500 Scale one-time price. |
| `STRIPE_PRICE_GROWTH_MONTHLY` | (Optional, see §9 question 1) price_id for $25/mo monthly Growth. |

No `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` needed — Checkout's redirect flow doesn't require Stripe.js on the client. If we later want inline Elements for trust upgrades, add then.

---

## 6. Stripe Dashboard work (the user does this manually)

1. **Confirm Stripe account is in good standing.** Log in at dashboard.stripe.com.
   - If account is not yet activated for live mode, finish the onboarding (legal entity, bank account, tax IDs). Stripe usually takes 1-3 business days to verify.
   - Test mode is enough for Phase 3A development; live mode required for production cutover.
2. **Create products + prices** (Products → +Add product):
   - Product: **Florida Wedding Wonders — Growth Tier**
     - Price: $250.00 USD recurring yearly → copy the `price_xxx` → this is `STRIPE_PRICE_GROWTH_ANNUAL`
     - (Optional) Add a second price on the same product: $25.00 USD recurring monthly → `STRIPE_PRICE_GROWTH_MONTHLY`
   - Product: **Florida Wedding Wonders — Scale Tier**
     - Price: $2,500.00 USD one-time → `STRIPE_PRICE_SCALE`
3. **Enable Stripe Tax** (Settings → Tax). Recommended for US sales tax compliance, ~0.5% of revenue. Free to enable; bills only on live transactions. (Optional; can defer to 3B.)
4. **Create the webhook endpoint** (Developers → Webhooks → +Add endpoint):
   - URL: `https://www.floridaweddingwonders.com/api/stripe/webhook`
   - Events to send: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `charge.refunded`
   - Copy the signing secret → this is `STRIPE_WEBHOOK_SECRET`
   - **Repeat for test mode** with URL `https://floridaweddingwonders-<preview-hash>.vercel.app/api/stripe/webhook` — gets its own signing secret used for Preview deployments. Or use Stripe CLI's `stripe listen` for local dev.
5. **(Optional) Configure Customer Portal** (Settings → Billing → Customer portal). Enable cancellation, allow updating payment method. For Phase 3B.

---

## 7. Implementation steps (after approval)

1. New migration `database/stripe-schema.sql` — surface for review **before applying**.
2. Apply migration via Supabase SQL editor (you).
3. `npm install stripe@latest`.
4. New file `src/lib/stripe.ts` — typed Stripe client.
5. New route `src/app/api/stripe/checkout/route.ts`.
6. New route `src/app/api/stripe/webhook/route.ts`.
7. New file `src/lib/tierFeatures.ts` + plumb through `catalog.ts` rowToVenue.
8. Rewrite `/venue-packages` page's checkout button + signed-in state.
9. Update `VenueCard` and listing-page sort for tier-aware ordering + badges.
10. Local test with Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) hitting test-mode prices.
11. PR + verify on Vercel Preview with test-mode keys, then promote with live keys.

Estimated effort: **3-4 working days** for code + ~1 day for the user's
Stripe dashboard setup + activation. Total 4-5 days end-to-end if Stripe
account is already activated; +1-3 days for activation if not.

---

## 8. Rollback plan

- DB migration is forward-compatible: dropping the new columns/tables doesn't break any existing path.
- If webhook misbehaves on production: turn off the webhook endpoint in Stripe (events queue server-side and replay later). Revert the merge commit in GitHub.
- If a user lands a payment we can't process: Stripe holds the money in the customer's balance; we can manually create the subscription/ownership records via the service role.

---

## 9. Open questions for the user

These need answers before code starts. Most are short.

1. **Growth tier billing cadence.** Page copy says "$250/yr" but FAQ section
   on the same page says "$25/month payment plan". Pick one for launch:
   - Annual only ($250/yr) — simpler, fewer failed payments, what most SaaS
     does for low-tier B2B
   - Monthly only ($25/mo) — lower commitment, may convert better
   - Both (let user pick at checkout) — best UX, slightly more code
   - Recommend: **annual only** for launch, add monthly in 3B if conversion is low.

2. **Stripe account status?**
   - Active and approved for live charges? (Have you completed the activation?)
   - Test mode only? (Phase 3A development can run entirely in test mode.)
   - No account yet? (Need to sign up at https://dashboard.stripe.com/register before anything.)

3. **Refund / chargeback policy for Scale ($2,500 one-time).**
   - 30-day money-back guarantee?
   - No refunds (final sale)?
   - Pro-rated refund minus the value of the photo shoot?
   - This goes in `/terms` (currently a placeholder per Phase 1) and in the
     Stripe Checkout description.

4. **Scale tier pro photo shoot** — operationally, who delivers it? Is there
   a vendor relationship in place? This is non-engineering but the Phase 3A
   webhook needs to fire some downstream notification ("hey admin, schedule
   a photo shoot for venue X") — which inbox or workflow?

5. **Featured placement on the homepage** — current homepage has no venue
   section ([src/app/page.tsx](../src/app/page.tsx)). Should Phase 3A also
   add a "Featured Venues" carousel, or save that for 3B?

6. **Early Bird offer** — the [page banner](../src/app/venue-packages/page.tsx#L154)
   says "first 10 venues get a free year of Premium". Do we want Phase 3A to
   honor that programmatically (Stripe coupon code?) or keep it as a manual
   admin promotion?

7. **`/admin` claim review UI** — Phase 1 left this as a stub
   ([src/app/admin/page.tsx](../src/app/admin/page.tsx) has
   `<p>Claims management features coming soon...</p>`). Phase 3A introduces
   `claim_requests` rows. Do we build the admin review UI in this PR, or
   defer to Phase 3B and require admin to use the Supabase dashboard
   directly during the Phase 3A → 3B window?

8. **Test data cleanup.** When we develop with test-mode Stripe, the
   `subscriptions` and `venue_ownerships` tables in production get
   test-mode rows. Two options:
   - Use a separate Supabase project for test (clean but expensive)
   - Use the prod Supabase with `is_test BOOLEAN` flag on subscription rows
     and filter out in display
   - Recommend the flag — minimal overhead.

---

## 10. What this proposal explicitly does NOT do

To keep Phase 3A focused on revenue:

- **No owner dashboard.** Phase 3B. Owners after payment land on a basic
  "you're subscribed" page; admin handles their venue updates manually until
  3B ships.
- **No Customer Portal** (self-service cancellation). Phase 3B.
- **No multi-quote form.** Phase 3B.
- **No per-listing analytics dashboard.** Phase 3B.
- **No vendor / dress-shop tier system.** Phase 3A is venues only. Vendors
  and dress shops keep their current free-listing model. Adding tiers there
  is a future phase.
- **No coupon/promotional code support** in Stripe Checkout. Phase 3B if
  needed for the Early Bird honoring.
- **No tax-ID collection** at checkout. Stripe Tax handles US sales tax
  automatically; B2B tax-id collection is a 3B nice-to-have.

---

**Next step:** user reviews §9 questions, confirms or adjusts. Once approved,
I write `database/stripe-schema.sql`, surface it for review (same checkpoint
discipline as Phase 1 auth and Phase 2A catalog), then implement.
