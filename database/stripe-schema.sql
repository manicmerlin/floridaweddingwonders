-- =============================================================================
-- Phase 3A — Stripe + paid tiers schema
-- =============================================================================
-- Adds:
--   1. venues.tier + venues.tier_expires_at  (denormalised tier on each venue)
--   2. venue_ownerships                       (auth user ↔ venue junction)
--   3. subscriptions                          (Stripe ledger: recurring + one-time)
--   4. claim_requests                         (replaces the dropped venue_claims)
--
-- Idempotent: safe to re-run.
--
-- The Stripe webhook handler is the SOLE writer for `subscriptions` and for
-- the `tier`/`tier_expires_at` columns on `venues`. RLS protects everything;
-- public reads only see venue.tier (already public-SELECT). Admin reads of
-- subscriptions/claim_requests go through the service-role API layer.
-- =============================================================================

-- 1. venues — add tier columns ----------------------------------------------
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'starter'
    CHECK (tier IN ('starter', 'growth', 'scale'));

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS tier_expires_at TIMESTAMPTZ;
-- tier_expires_at is NULL for 'starter' (free forever) and 'scale' (lifetime).
-- Set to current_period_end for 'growth' subscriptions.

CREATE INDEX IF NOT EXISTS idx_venues_tier ON venues(tier);

-- 2. venue_ownerships --------------------------------------------------------
CREATE TABLE IF NOT EXISTS venue_ownerships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id      UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'owner'
                  CHECK (role IN ('owner', 'manager')),
  -- pending  → claim submitted, awaiting admin review (or paid signup
  --            awaiting Stripe webhook to flip it to active)
  -- active   → owner can edit the venue
  -- revoked  → admin revoked, no edit access
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'revoked')),
  approved_at   TIMESTAMPTZ,
  approved_by   UUID REFERENCES profiles(id),
  revoked_at    TIMESTAMPTZ,
  revoked_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, venue_id)
);

CREATE INDEX IF NOT EXISTS idx_venue_ownerships_profile ON venue_ownerships(profile_id);
CREATE INDEX IF NOT EXISTS idx_venue_ownerships_venue   ON venue_ownerships(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_ownerships_status  ON venue_ownerships(status);

DROP TRIGGER IF EXISTS update_venue_ownerships_updated_at ON venue_ownerships;
CREATE TRIGGER update_venue_ownerships_updated_at
  BEFORE UPDATE ON venue_ownerships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. subscriptions -----------------------------------------------------------
-- Single table for both recurring (Growth) and one-time (Scale). Distinguished
-- by `is_lifetime` and which Stripe id is populated:
--   recurring → stripe_subscription_id set, stripe_payment_intent_id null
--   one-time  → stripe_payment_intent_id set, stripe_subscription_id null
CREATE TABLE IF NOT EXISTS subscriptions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Domain links
  venue_id                  UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  profile_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  ownership_id              UUID REFERENCES venue_ownerships(id) ON DELETE SET NULL,

  -- Stripe identifiers. UNIQUE is the load-bearing idempotency mechanism for
  -- checkout.session.completed: re-processing the same event tries to INSERT
  -- a duplicate stripe_subscription_id (or stripe_payment_intent_id) and
  -- fails with 23505, which the webhook handler treats as "already processed".
  stripe_customer_id        TEXT NOT NULL,
  stripe_subscription_id    TEXT UNIQUE,
  stripe_payment_intent_id  TEXT UNIQUE,
  stripe_price_id           TEXT NOT NULL,
  stripe_product_id         TEXT,

  -- Domain state
  tier                      TEXT NOT NULL CHECK (tier IN ('growth', 'scale')),
  -- incomplete  → checkout session created but not completed yet
  -- active      → currently entitled
  -- past_due    → invoice failed; Stripe is retrying per dunning policy
  -- canceled    → subscription terminated (deleted from Stripe). For Growth,
  --               webhook fires this at current_period_end; downgrade
  --               happens then.
  -- refunded    → Scale only — charge refunded; tier should drop to starter.
  status                    TEXT NOT NULL DEFAULT 'incomplete'
                              CHECK (status IN ('incomplete','active','past_due','canceled','refunded')),
  is_lifetime               BOOLEAN NOT NULL DEFAULT FALSE,   -- true for Scale
  current_period_end        TIMESTAMPTZ,                       -- null for Scale

  -- Pricing snapshot at purchase time (Stripe price metadata can change,
  -- and we want a record of what the customer actually paid).
  amount_cents              INTEGER NOT NULL,
  currency                  TEXT NOT NULL DEFAULT 'usd',

  -- Test-mode marker. Set from Stripe's livemode flag (livemode=false → is_test=true).
  -- Phase 3A dev/test rows are filtered out of admin views.
  is_test                   BOOLEAN NOT NULL DEFAULT FALSE,

  -- Webhook event audit / dedup hint. The UNIQUE constraints above are the
  -- real idempotency primitive; last_event_id is for human debugging.
  last_event_id             TEXT,
  last_event_at             TIMESTAMPTZ,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One of stripe_subscription_id or stripe_payment_intent_id must be set
  -- (matches whether this is recurring or one-time).
  CONSTRAINT subscriptions_one_stripe_id CHECK (
    (stripe_subscription_id IS NOT NULL) OR (stripe_payment_intent_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_venue       ON subscriptions(venue_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile     ON subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status      ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer    ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end  ON subscriptions(current_period_end);

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. claim_requests ----------------------------------------------------------
-- Replaces the dropped (Phase 2A) venue_claims table. FK to venues.id UUID,
-- profile_id from Phase 1 auth. Tracks intended tier so admin sees the
-- claimant's plan before approving.
CREATE TABLE IF NOT EXISTS claim_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  venue_id                UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  profile_id              UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Captured at submit time even if profile_id is null (anonymous claim).
  requester_email         TEXT NOT NULL,
  requester_name          TEXT NOT NULL,
  requester_phone         TEXT,
  business_name           TEXT,
  relationship_to_venue   TEXT,
  notes                   TEXT,

  -- Workflow state
  status                  TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','approved','rejected')),
  intended_tier           TEXT CHECK (intended_tier IN ('starter','growth','scale')),
  -- For paid claims, we create the subscriptions row at checkout time and
  -- link here. The webhook then auto-approves the claim on payment success.
  subscription_id         UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  reviewed_by             UUID REFERENCES profiles(id),
  reviewed_at             TIMESTAMPTZ,
  rejection_reason        TEXT,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_requests_venue   ON claim_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_profile ON claim_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_status  ON claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_claim_requests_email   ON claim_requests(requester_email);

DROP TRIGGER IF EXISTS update_claim_requests_updated_at ON claim_requests;
CREATE TRIGGER update_claim_requests_updated_at
  BEFORE UPDATE ON claim_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Row-Level Security
-- =============================================================================
-- All three new tables: read-own + admin-all. Writes happen via the
-- service-role key from the Stripe webhook + admin API routes (RLS bypassed
-- by service role). No public INSERT/UPDATE/DELETE policies.

ALTER TABLE venue_ownerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_requests   ENABLE ROW LEVEL SECURITY;

-- Drop-then-create so re-runs don't error on existing policies.
DROP POLICY IF EXISTS ownerships_select_own         ON venue_ownerships;
DROP POLICY IF EXISTS ownerships_select_admin       ON venue_ownerships;
DROP POLICY IF EXISTS subscriptions_select_own      ON subscriptions;
DROP POLICY IF EXISTS subscriptions_select_admin    ON subscriptions;
DROP POLICY IF EXISTS claim_requests_select_own     ON claim_requests;
DROP POLICY IF EXISTS claim_requests_select_admin   ON claim_requests;
DROP POLICY IF EXISTS claim_requests_insert_own     ON claim_requests;

-- Owners read their own ownerships; admins read all.
CREATE POLICY ownerships_select_own ON venue_ownerships
  FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY ownerships_select_admin ON venue_ownerships
  FOR SELECT USING (is_super_admin());

-- Subscribers read their own subscription rows; admins read all.
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY subscriptions_select_admin ON subscriptions
  FOR SELECT USING (is_super_admin());

-- Authenticated users may submit claim requests for themselves; reads are
-- own + admin.
CREATE POLICY claim_requests_select_own ON claim_requests
  FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY claim_requests_select_admin ON claim_requests
  FOR SELECT USING (is_super_admin());
CREATE POLICY claim_requests_insert_own ON claim_requests
  FOR INSERT WITH CHECK (
    -- A user can only submit a claim where the profile_id is themselves,
    -- OR profile_id is null (anonymous public claim). Webhook + admin
    -- approve/reject paths bypass via service role.
    profile_id = auth.uid() OR profile_id IS NULL
  );

-- =============================================================================
-- Verification queries (run separately to confirm):
--
--   -- 1. Columns added to venues
--   SELECT column_name, data_type, column_default
--     FROM information_schema.columns
--    WHERE table_name = 'venues' AND column_name IN ('tier','tier_expires_at');
--
--   -- 2. New tables exist and are empty
--   SELECT count(*) FROM venue_ownerships;  -- expect 0
--   SELECT count(*) FROM subscriptions;      -- expect 0
--   SELECT count(*) FROM claim_requests;     -- expect 0
--
--   -- 3. RLS policies present
--   SELECT polname FROM pg_policy
--    WHERE polrelid::regclass::text IN ('venue_ownerships','subscriptions','claim_requests')
--    ORDER BY polname;
--   -- expect: claim_requests_insert_own, claim_requests_select_admin,
--   --         claim_requests_select_own, ownerships_select_admin,
--   --         ownerships_select_own, subscriptions_select_admin,
--   --         subscriptions_select_own
--
--   -- 4. Triggers present
--   SELECT tgname FROM pg_trigger
--    WHERE tgrelid::regclass::text IN ('venue_ownerships','subscriptions','claim_requests')
--      AND NOT tgisinternal;
--
--   -- 5. Existing venues default to 'starter'
--   SELECT tier, count(*) FROM venues GROUP BY tier;  -- expect: starter | 129
--
--   -- 6. (After implementation, for testing without Stripe) Manually grant
--   --    a tier to a venue:
--   --    UPDATE venues SET tier = 'growth', tier_expires_at = NOW() + INTERVAL '1 year'
--   --     WHERE legacy_id = '1';
-- =============================================================================
