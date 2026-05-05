-- Track 2 — sub-neighborhood column for venues.
--
-- City alone is too coarse for "Miami" or "Tampa": couples planning a SoBe
-- wedding don't want Brickell results, and a Hyde Park bride doesn't want
-- Westshore. Adding a `neighborhood` column lets us chain a second filter
-- after the existing region/city dropdown without changing the listing
-- query shape.
--
-- This migration:
--   1) ADD COLUMN neighborhood TEXT (nullable; many venues will stay NULL)
--   2) Index on (city, neighborhood) — supports the chained filter
--   3) Tag the venues we can confidently assign by name/landmark.
--      Conservative — leave NULL when uncertain. Per spec.
--
-- Apply via Supabase Studio SQL editor (or psql with DATABASE_URL).
-- Idempotent: ALTER ... IF NOT EXISTS, UPDATEs are pinned to slug.

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS neighborhood TEXT;

CREATE INDEX IF NOT EXISTS idx_venues_city_neighborhood
  ON venues (city, neighborhood)
  WHERE neighborhood IS NOT NULL;

-- Miami-Dade — confident assignments. Cities that ARE the neighborhood
-- (Coconut Grove, Coral Gables, Aventura, Key Biscayne) get the city as
-- the neighborhood label too, so the chained filter narrows correctly
-- when the user picks the "Miami" region.
UPDATE venues SET neighborhood = 'Coconut Grove'
  WHERE city = 'Coconut Grove' AND neighborhood IS NULL;

UPDATE venues SET neighborhood = 'Coral Gables'
  WHERE city = 'Coral Gables' AND neighborhood IS NULL;

UPDATE venues SET neighborhood = 'Aventura'
  WHERE city = 'Aventura' AND neighborhood IS NULL;

UPDATE venues SET neighborhood = 'Key Biscayne'
  WHERE city = 'Key Biscayne' AND neighborhood IS NULL;

-- Miami Beach: split between South Beach (south of 23rd St) and Mid
-- Beach (23rd–63rd). Tagged by well-known landmark addresses.
UPDATE venues SET neighborhood = 'Mid Beach'
  WHERE slug IN ('faena-hotel-miami-beach', 'the-bath-club-miami-beach')
    AND neighborhood IS NULL;

UPDATE venues SET neighborhood = 'South Beach'
  WHERE slug IN ('the-surfcomber-hotel-miami-beach', 'miami-beach-botanical-garden-miami-beach')
    AND neighborhood IS NULL;

-- Tampa Bay — confident assignments based on landmark address.
UPDATE venues SET neighborhood = 'Downtown St. Pete'
  WHERE slug IN ('nova-535-unique-event-space-st-petersburg', 'the-birchwood-st-petersburg')
    AND neighborhood IS NULL;

UPDATE venues SET neighborhood = 'South Tampa'
  WHERE slug = 'davis-islands-garden-club-tampa'
    AND neighborhood IS NULL;

UPDATE venues SET neighborhood = 'Treasure Island'
  WHERE city = 'Treasure Island' AND neighborhood IS NULL;
