-- Track 2 — Florida-Ready (hurricane / rain-plan) fields on venues.
--
-- Florida couples plan around tropical storms, sudden afternoon downpours,
-- and 95-degree humidity. Surfacing concrete preparedness signals on the
-- listing differentiates real Florida-experienced venues from generic
-- ballrooms. None of these are required — any subset can be populated
-- per venue. Detail page shows the panel only when ≥1 field is set.
--
-- generator_backup        — venue has a generator on standby for outages.
-- ac_tent_available       — venue can provide an air-conditioned tent
--                            (or one of their preferred rentals carries one).
-- indoor_fallback_capacity — number of guests that fit indoors if a planned
--                            outdoor ceremony has to move under a roof.
-- storm_policy_text       — short, free-form rain/hurricane policy. Kept
--                            as text rather than a structured enum because
--                            real venue policies are messy and the panel
--                            renders it verbatim.
--
-- Apply via Supabase Studio SQL editor (or psql with DATABASE_URL).
-- Idempotent: ALTER ... IF NOT EXISTS.

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS generator_backup BOOLEAN,
  ADD COLUMN IF NOT EXISTS ac_tent_available BOOLEAN,
  ADD COLUMN IF NOT EXISTS indoor_fallback_capacity INTEGER,
  ADD COLUMN IF NOT EXISTS storm_policy_text TEXT;

-- Sanity check — index the booleans so the homepage / list filters can
-- cheaply highlight Florida-Ready venues later. WHERE NOT NULL keeps the
-- index small (most rows will be NULL until owners self-populate).
CREATE INDEX IF NOT EXISTS idx_venues_generator_backup
  ON venues (generator_backup)
  WHERE generator_backup IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_venues_ac_tent_available
  ON venues (ac_tent_available)
  WHERE ac_tent_available IS NOT NULL;
