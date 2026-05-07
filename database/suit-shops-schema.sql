-- T3-3 — Suit Shops directory.
--
-- Mirrors dress_shops (catalog-schema.sql §4) so the new top-level
-- category is structurally identical to its sibling. shop_type values
-- expected by the app:
--   'bespoke-tailor'   — full custom (tape-and-cut from scratch)
--   'tuxedo-rental'    — short-lease formal wear (Black Tie etc.)
--   'suit-boutique'    — ready-to-wear high-end retail
--   'made-to-measure'  — semi-custom (modified block patterns)
--   'formalwear'       — broader groomsmen / mixed inventory
--
-- Idempotent: every CREATE / ALTER / POLICY / TRIGGER guarded.
-- Apply via the working aws-1 pooler (host
-- aws-1-us-east-1.pooler.supabase.com:5432, user postgres.<project_ref>).

CREATE TABLE IF NOT EXISTS suit_shops (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id       TEXT UNIQUE,
  slug            TEXT UNIQUE NOT NULL,

  name            TEXT NOT NULL,
  description     TEXT,

  shop_type       TEXT,

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
  hours           JSONB,

  contact_phone      TEXT,
  contact_email      TEXT,
  contact_email_real BOOLEAN NOT NULL DEFAULT FALSE,
  contact_website    TEXT,

  is_premium      BOOLEAN NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes mirror dress_shops.
CREATE INDEX IF NOT EXISTS idx_suit_shops_city     ON suit_shops(city);
CREATE INDEX IF NOT EXISTS idx_suit_shops_type     ON suit_shops(shop_type);
CREATE INDEX IF NOT EXISTS idx_suit_shops_tags_gin ON suit_shops USING GIN (tags jsonb_path_ops);

-- updated_at trigger reuses the function created in catalog-schema.sql.
DROP TRIGGER IF EXISTS update_suit_shops_updated_at ON suit_shops;
CREATE TRIGGER update_suit_shops_updated_at BEFORE UPDATE ON suit_shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE suit_shops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS suit_shops_public_select ON suit_shops;
CREATE POLICY suit_shops_public_select ON suit_shops FOR SELECT USING (true);
