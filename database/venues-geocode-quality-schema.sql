-- T3-2 extension — track whether each venue's coordinates are exact
-- (Nominatim found the named landmark) or a city-centroid fallback
-- (Nominatim missed the venue but the city resolved). Drives the
-- detail-page map zoom behaviour and the "Map shows the <city> area"
-- helper note.
--
-- Backfilled from /tmp/geocode-log.json by scripts/backfill-geocode-quality.js.
-- Idempotent: ADD COLUMN IF NOT EXISTS, CHECK rebuilt every run.

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS geocode_quality TEXT;

ALTER TABLE venues DROP CONSTRAINT IF EXISTS venues_geocode_quality_check;
ALTER TABLE venues
  ADD CONSTRAINT venues_geocode_quality_check
  CHECK (geocode_quality IS NULL OR geocode_quality IN ('exact', 'city-centroid'));
