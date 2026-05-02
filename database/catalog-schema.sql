-- =============================================================================
-- Catalog schema migration
-- =============================================================================
-- Moves venues, vendors, and dress_shops from src/data/*.json into Postgres.
-- Reads are public via RLS; writes happen via the service-role key from the
-- migration script (no client-side mutations).
--
-- Idempotent: safe to re-run.
--
-- IMPORTANT: an empty `venues` table from the never-fully-deployed first-pass
-- schema.sql exists in production (0 rows, confirmed via REST). The legacy
-- column shape is incompatible with this one (`type` vs `venue_type`,
-- `amenities TEXT[]` vs `JSONB`, `location TEXT` vs city/region split, etc.).
-- The first statement DROPs that empty table CASCADE so the new shape can be
-- created. The CASCADE also takes the empty `venue_claims` table (0 rows) —
-- Phase 3 will redefine claims pointing at the new venues.id.
-- =============================================================================

-- 0. Replace the empty legacy venues table -----------------------------------
DROP TABLE IF EXISTS venue_claims CASCADE;
DROP TABLE IF EXISTS venues CASCADE;

-- 1. Helpers -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- 2. venues ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS venues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id       TEXT UNIQUE,                -- "1".."129" — array-index from venues.json
  slug            TEXT UNIQUE NOT NULL,       -- kebab(name)-kebab(city), generated once at migration

  name            TEXT NOT NULL,
  description     TEXT,                       -- maps from JSON "style"

  city            TEXT,                       -- parsed from JSON "location" (split on ',')
  region          TEXT,
  state           TEXT NOT NULL DEFAULT 'FL',

  -- capacity_min/_max parsed from JSON's free-text "Up to 150..." string.
  -- capacity_text preserves the original for display.
  capacity_min    INTEGER,
  capacity_max    INTEGER,
  capacity_text   TEXT,
  size_category   TEXT,                       -- e.g. "Mid-Size (75-199)"

  venue_type      TEXT,                       -- 'beach'|'garden'|'ballroom'|'historic'|'modern'|'rustic'

  -- price_min parsed from price_text; price_text preserves the original.
  price_min       INTEGER,
  price_text      TEXT,

  amenities       JSONB NOT NULL DEFAULT '[]'::jsonb,    -- string[]
  tags            JSONB NOT NULL DEFAULT '[]'::jsonb,    -- string[]
  images          JSONB NOT NULL DEFAULT '[]'::jsonb,    -- {id,url,alt,isPrimary}[]

  ceremony_and_reception BOOLEAN DEFAULT TRUE,

  contact_phone      TEXT,
  contact_email      TEXT,
  -- True only when contact_email is a real address. False for the synthesized
  -- info@<slug>.com forms — drives the lead-routing branch in
  -- /api/venue-leads (added in Phase 1).
  contact_email_real BOOLEAN NOT NULL DEFAULT FALSE,
  contact_website    TEXT,
  gallery_url        TEXT,                    -- external gallery link from JSON

  address_street     TEXT,
  address_zip        TEXT,
  coordinates        JSONB,                   -- {lat, lng} — sometimes missing

  external_reviews   JSONB,                   -- {google:{placeId,rating,reviewCount,url}, yelp:{...}}

  last_image_update  TIMESTAMPTZ,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. vendors -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- vendors.json already ships kebab-case ids ("chris-weinberg-events").
  -- legacy_id = original id; slug initially equals legacy_id so existing
  -- /vendors/<id> URLs keep working.
  legacy_id       TEXT UNIQUE,
  slug            TEXT UNIQUE NOT NULL,

  name            TEXT NOT NULL,
  business_name   TEXT,
  description     TEXT,

  category        TEXT NOT NULL,              -- 'planner','photographer','videographer','caterer','baker','entertainment',...
  subcategory     TEXT,

  city            TEXT,
  state           TEXT NOT NULL DEFAULT 'FL',
  service_area    JSONB NOT NULL DEFAULT '[]'::jsonb,    -- ["Miami-Dade","Broward",...]

  contact_phone      TEXT,
  contact_email      TEXT,
  contact_email_real BOOLEAN NOT NULL DEFAULT FALSE,
  contact_website    TEXT,
  social_media       JSONB,                   -- {instagram?,facebook?,...}

  images          JSONB NOT NULL DEFAULT '[]'::jsonb,
  specialties     JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags            JSONB NOT NULL DEFAULT '[]'::jsonb,

  price_range     TEXT,                       -- "$" / "$$" / "$$$" — null in current data

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. dress_shops -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dress_shops (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id       TEXT UNIQUE,                -- "ever-after-miami" etc.
  slug            TEXT UNIQUE NOT NULL,

  name            TEXT NOT NULL,
  description     TEXT,

  shop_type       TEXT,                       -- 'boutique','salon','showroom','mega-store','mobile service',...

  city            TEXT,
  state           TEXT NOT NULL DEFAULT 'FL',
  address_street  TEXT,
  address_zip     TEXT,
  coordinates     JSONB,

  price_min       INTEGER,
  price_max       INTEGER,

  specialties     JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags            JSONB NOT NULL DEFAULT '[]'::jsonb,
  images          JSONB NOT NULL DEFAULT '[]'::jsonb,
  brands          JSONB NOT NULL DEFAULT '[]'::jsonb,
  services        JSONB NOT NULL DEFAULT '[]'::jsonb,
  hours           JSONB,                       -- {monday:"9-5",...} (often {})

  contact_phone      TEXT,
  contact_email      TEXT,
  contact_email_real BOOLEAN NOT NULL DEFAULT FALSE,
  contact_website    TEXT,

  is_premium      BOOLEAN NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_venues_city          ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_venue_type    ON venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_capacity      ON venues(capacity_min, capacity_max);
CREATE INDEX IF NOT EXISTS idx_venues_tags_gin      ON venues USING GIN (tags jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_vendors_category     ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_city         ON vendors(city);
CREATE INDEX IF NOT EXISTS idx_vendors_tags_gin     ON vendors USING GIN (tags jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_dress_shops_city     ON dress_shops(city);
CREATE INDEX IF NOT EXISTS idx_dress_shops_type     ON dress_shops(shop_type);
CREATE INDEX IF NOT EXISTS idx_dress_shops_tags_gin ON dress_shops USING GIN (tags jsonb_path_ops);

-- 6. updated_at triggers -----------------------------------------------------
DROP TRIGGER IF EXISTS update_venues_updated_at ON venues;
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dress_shops_updated_at ON dress_shops;
CREATE TRIGGER update_dress_shops_updated_at BEFORE UPDATE ON dress_shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. RLS ---------------------------------------------------------------------
ALTER TABLE venues       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dress_shops  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS venues_public_select       ON venues;
DROP POLICY IF EXISTS vendors_public_select      ON vendors;
DROP POLICY IF EXISTS dress_shops_public_select  ON dress_shops;

CREATE POLICY venues_public_select       ON venues       FOR SELECT USING (true);
CREATE POLICY vendors_public_select      ON vendors      FOR SELECT USING (true);
CREATE POLICY dress_shops_public_select  ON dress_shops  FOR SELECT USING (true);

-- No public INSERT/UPDATE/DELETE policies. The migration script writes via
-- service-role (bypasses RLS). Phase 3 will add admin policies of the form:
--   USING (EXISTS (SELECT 1 FROM profiles
--                  WHERE id = auth.uid() AND role = 'super_admin'))

-- =============================================================================
-- Verification queries (after running):
--
--   SELECT count(*) FROM venues;       -- expect 0 (until migrate-catalog runs)
--   SELECT count(*) FROM vendors;      -- expect 0
--   SELECT count(*) FROM dress_shops;  -- expect 0
--   SELECT polname FROM pg_policy WHERE polrelid::text IN
--          ('venues','vendors','dress_shops');
-- =============================================================================
