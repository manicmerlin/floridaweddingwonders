-- =============================================================================
-- Auth bootstrap migration
-- =============================================================================
-- Creates the profiles table that backs Supabase Auth users with role + lead
-- qualification data. Wires a trigger so every signup auto-gets a profile row.
--
-- Idempotent: safe to re-run as many times as needed. Each statement either
-- uses IF NOT EXISTS / OR REPLACE, or is wrapped in a DO block with a guard.
--
-- Apply via the Supabase SQL editor: paste the whole file, click Run.
-- =============================================================================

-- 1. profiles table -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'guest'
                  CHECK (role IN ('guest', 'venue_owner', 'vendor_owner', 'super_admin')),
  -- Lead-qualification snapshot. Was in localStorage; will eventually be the
  -- source of truth for the venue inquiry form.
  phone         TEXT,
  wedding_date  DATE,
  guest_count   INTEGER,
  budget_min    INTEGER,
  budget_max    INTEGER,
  preferences   JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role  ON profiles(role);

-- 3. updated_at trigger -------------------------------------------------------
-- Reuses the helper from database/schema.sql if present; otherwise creates it.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Auto-create profile on signup -------------------------------------------
-- Whenever Supabase Auth inserts into auth.users, mirror the row into public
-- profiles with the default 'guest' role. The user_meta_data->>'full_name'
-- bit picks up the value passed via supabase.auth.signUp({ options: { data:
-- { full_name } } }) on the client.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. Backfill profiles for any existing auth.users ---------------------------
-- Catches users that signed up before this migration was applied so they
-- aren't stranded without a profiles row.
INSERT INTO profiles (id, email, full_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 6. Row-Level Security -------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper: is the calling user a super_admin?
-- Wrapped in SECURITY DEFINER so the RLS policy that calls it doesn't recurse
-- into itself when reading profiles.role.
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;

-- Drop-then-create so re-runs don't error on existing policies.
DROP POLICY IF EXISTS "profiles_select_own"      ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin"    ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"      ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin"    ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"      ON profiles;

-- Read your own profile.
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can read every profile.
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_super_admin());

-- Update your own profile EXCEPT the role column. (Postgres RLS doesn't
-- support per-column policies on UPDATE, so we enforce role-immutability via
-- a BEFORE UPDATE trigger below.)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can update any profile, including roles.
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_super_admin());

-- Allow the auth-trigger to insert; supabase auth admin can also insert.
-- Regular clients can't insert directly (the trigger does it for them).
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR is_super_admin());

-- 7. Role-immutability trigger -----------------------------------------------
-- Prevents non-admins from escalating their own role via a direct UPDATE.
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_super_admin() THEN
    RAISE EXCEPTION 'role can only be changed by a super_admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON profiles;
CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_escalation();

-- =============================================================================
-- Done.
--
-- Verification queries (run separately to confirm):
--
--   SELECT COUNT(*) FROM profiles;
--   SELECT id, email, role, created_at FROM profiles ORDER BY created_at DESC LIMIT 10;
--   SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;
--   SELECT polname FROM pg_policy WHERE polrelid = 'profiles'::regclass;
-- =============================================================================
