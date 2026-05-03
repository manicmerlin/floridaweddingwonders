-- Phase 6: mark seeded reviews so admin moderation can bulk-approve them.
-- The Phase 4 seed script wrote 147 pending reviews on 2026-05-02 with a
-- distinctive signature (no profile_id, no reviewer_email, all 'pending').
-- This migration adds an explicit is_seeded flag and backfills the existing
-- 147 rows.
--
-- Applied to live Supabase before this PR was built. Saved here for audit
-- and reproducibility.

-- 1) Add the column. Idempotent.
alter table venue_reviews
  add column if not exists is_seeded boolean not null default false;

-- 2) Backfill the 147 existing seed rows. Identified by the seed signature
--    + the time window between PR #8 merge and PR #9 merge (the seed ran
--    in that window). Conservative: every condition has to match.
update venue_reviews
   set is_seeded = true
 where status = 'pending'
   and profile_id is null
   and reviewer_email is null
   and submitted_at >= '2026-05-02T22:00:00Z'
   and submitted_at <= '2026-05-03T01:00:00Z';

-- 3) Index on (status, is_seeded) for the bulk-approve query path.
create index if not exists venue_reviews_pending_seeded_idx
  on venue_reviews (status, is_seeded)
  where status = 'pending';

-- Verification (run after applying):
--   select count(*) from venue_reviews where is_seeded = true;
--     -> should return 147
--   select count(*) from venue_reviews where is_seeded = true
--     and (profile_id is not null or reviewer_email is not null);
--     -> should return 0
