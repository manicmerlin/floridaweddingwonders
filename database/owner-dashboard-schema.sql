-- =============================================================================
-- Phase 3B — Owner dashboard, lead pipeline, analytics, and saved-venues
-- =============================================================================
-- Adds:
--   1. venue_views                    (lightweight per-listing analytics)
--   2. saved_venues                   (DB-backed heart icon, replaces localStorage)
--   3. venue_leads.state column       (new/viewed/responded for inquiry pipeline)
--
-- Idempotent: safe to re-run.
--
-- Read-paths: owner dashboard server-side aggregations use the service-role
-- client (bypasses RLS); RLS still in place as defense-in-depth so a leaked
-- anon key can't read someone else's leads or saved venues.
-- =============================================================================

-- 1. venue_views ------------------------------------------------------------
-- One row per page view. Lightweight columns — we resist the urge to bloat
-- this with full session metadata; this is for owner dashboards, not
-- product-wide analytics. is_unique = true if cookie-based dedup says
-- this visitor's first hit on this venue in the current rolling window.
-- Phase 4 can reroute this to PostHog/Plausible if volume grows.
CREATE TABLE IF NOT EXISTS venue_views (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id      UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  -- Stable per-visitor cookie (random UUID set client-side, sent in the
  -- analytics ping). Lets us count "unique visitors per 30 days" without
  -- IP-based fingerprinting.
  visitor_cookie TEXT,
  is_unique     BOOLEAN NOT NULL DEFAULT FALSE,
  referrer      TEXT,
  user_agent    TEXT,
  viewed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venue_views_venue   ON venue_views(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_views_at      ON venue_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_views_unique  ON venue_views(venue_id, viewed_at DESC) WHERE is_unique = true;

ALTER TABLE venue_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS venue_views_insert_public ON venue_views;
DROP POLICY IF EXISTS venue_views_select_admin  ON venue_views;
DROP POLICY IF EXISTS venue_views_select_owner  ON venue_views;

-- Anyone (incl. anon) can INSERT a view event. We don't want to hide
-- analytics behind auth; signed-out browsing is the common case.
CREATE POLICY venue_views_insert_public ON venue_views
  FOR INSERT WITH CHECK (true);

-- Admins read all.
CREATE POLICY venue_views_select_admin ON venue_views
  FOR SELECT USING (is_super_admin());

-- Owners read views for their own venues only.
CREATE POLICY venue_views_select_owner ON venue_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM venue_ownerships vo
      WHERE vo.venue_id = venue_views.venue_id
        AND vo.profile_id = auth.uid()
        AND vo.status = 'active'
    )
  );

-- 2. saved_venues -----------------------------------------------------------
-- Replaces the localStorage `savedVenues_<email>` (FavoritesManager) and the
-- separate `favorites` key (different code path, same idea — Phase 0 mess).
-- One row per (profile, venue) pair; unique to prevent dupes.
CREATE TABLE IF NOT EXISTS saved_venues (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id      UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  saved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, venue_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_venues_profile ON saved_venues(profile_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_venues_venue   ON saved_venues(venue_id);

ALTER TABLE saved_venues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_venues_select_own  ON saved_venues;
DROP POLICY IF EXISTS saved_venues_insert_own  ON saved_venues;
DROP POLICY IF EXISTS saved_venues_delete_own  ON saved_venues;

CREATE POLICY saved_venues_select_own ON saved_venues
  FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY saved_venues_insert_own ON saved_venues
  FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY saved_venues_delete_own ON saved_venues
  FOR DELETE USING (profile_id = auth.uid());

-- 3. venue_leads.state -------------------------------------------------------
-- The Phase 1 venue_leads table tracks `status` for delivery state
-- (sent/pending-real-email/failed). Owners need a SEPARATE pipeline state
-- — has THIS owner triaged THIS lead yet? new -> viewed -> responded.
-- (Status remains the source of truth for delivery; state is owner-facing.)
ALTER TABLE venue_leads
  ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'new'
    CHECK (state IN ('new', 'viewed', 'responded', 'archived'));

ALTER TABLE venue_leads
  ADD COLUMN IF NOT EXISTS viewed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS responded_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_notes    TEXT;

CREATE INDEX IF NOT EXISTS idx_venue_leads_state ON venue_leads(venue_id, state);

-- Owners read leads for their own venues only. Phase 1 left venue_leads with
-- only the public-INSERT policy; add SELECT for owners + admins now.
DROP POLICY IF EXISTS venue_leads_select_owner ON venue_leads;
DROP POLICY IF EXISTS venue_leads_select_admin ON venue_leads;
DROP POLICY IF EXISTS venue_leads_update_owner ON venue_leads;

CREATE POLICY venue_leads_select_owner ON venue_leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM venue_ownerships vo
      WHERE vo.venue_id::text = venue_leads.venue_id
        AND vo.profile_id = auth.uid()
        AND vo.status = 'active'
    )
  );

CREATE POLICY venue_leads_select_admin ON venue_leads
  FOR SELECT USING (is_super_admin());

-- Owners can flip state on their own leads. They cannot edit any other
-- column (RLS on UPDATE doesn't have per-column granularity, but we trust
-- the API layer to only expose state/owner_notes; service-role writes from
-- the API enforce the column allowlist).
CREATE POLICY venue_leads_update_owner ON venue_leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM venue_ownerships vo
      WHERE vo.venue_id::text = venue_leads.venue_id
        AND vo.profile_id = auth.uid()
        AND vo.status = 'active'
    )
  );

-- =============================================================================
-- Verification queries (run separately to confirm):
--
--   -- 1. Tables exist
--   SELECT count(*) FROM venue_views;     -- expect 0
--   SELECT count(*) FROM saved_venues;    -- expect 0
--
--   -- 2. New columns on venue_leads
--   SELECT column_name, data_type, column_default
--     FROM information_schema.columns
--    WHERE table_name = 'venue_leads' AND column_name IN
--          ('state','viewed_at','responded_at','owner_notes');
--
--   -- 3. RLS policies
--   SELECT polname FROM pg_policy
--    WHERE polrelid::regclass::text IN ('venue_views','saved_venues','venue_leads')
--      AND polname LIKE '%owner%' OR polname LIKE '%saved%' OR polname LIKE '%public%'
--    ORDER BY polname;
-- =============================================================================
