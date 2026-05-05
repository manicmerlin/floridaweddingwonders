-- Lead-magnet capture table.
--
-- Distinct from `email_subscribers` (which is the broader newsletter list).
-- This table is for the passive lead-magnet captures on /blog and /venues
-- — anyone who downloads the South Florida wedding planning checklist
-- lands here. Decoupled so the marketing team can segment without
-- accidentally treating everyone who downloaded a PDF as a newsletter
-- subscriber.
--
-- Apply via:
--   psql "$SUPABASE_DB_URL" -f database/lead-magnet-schema.sql
-- or via Supabase service-role REST.

CREATE TABLE IF NOT EXISTS lead_magnet_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  -- Where the capture happened — 'blog', 'venues', etc. Free-form so we
  -- can add new capture surfaces without a schema change.
  source TEXT NOT NULL DEFAULT 'unknown',
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_magnet_subscribers_source
  ON lead_magnet_subscribers (source);
CREATE INDEX IF NOT EXISTS idx_lead_magnet_subscribers_captured_at
  ON lead_magnet_subscribers (captured_at DESC);

-- RLS: anonymous can INSERT (the public form), nothing else. SELECT/UPDATE/
-- DELETE require the service role, which bypasses RLS entirely — so
-- super-admin scripts authenticated with SUPABASE_SERVICE_ROLE_KEY can
-- still read the list without needing an explicit policy.
ALTER TABLE lead_magnet_subscribers ENABLE ROW LEVEL SECURITY;

-- Idempotent policy creation: drop-if-exists, then create.
DROP POLICY IF EXISTS "Anyone can capture a lead magnet email"
  ON lead_magnet_subscribers;

CREATE POLICY "Anyone can capture a lead magnet email"
  ON lead_magnet_subscribers
  FOR INSERT
  WITH CHECK (true);

-- No SELECT policy is intentional. With RLS enabled and no SELECT policy,
-- the anon key cannot read rows — only the service role can. That's the
-- "super_admin only" gate the audit asked for.
