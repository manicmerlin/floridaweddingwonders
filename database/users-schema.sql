-- Schema for regular users (venue seekers/guests)

-- Create users table for regular guests
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'guest' CHECK (role IN ('guest', 'venue_owner')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  email_verified BOOLEAN DEFAULT FALSE,
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create user profiles table for lead qualification data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  phone TEXT,
  wedding_date DATE,
  guest_count INTEGER,
  budget_min INTEGER,
  budget_max INTEGER,
  venue_type TEXT,
  preferred_locations TEXT[],
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create favorites table to track saved venues
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL, -- Using TEXT since venues are in mockData
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, venue_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_venue_id ON user_favorites(venue_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can insert users (for registration)" ON users
  FOR INSERT WITH CHECK (true);

-- RLS Policies for user_profiles table
CREATE POLICY "Users can view own profile data" ON user_profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own profile data" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profile data" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS Policies for user_favorites table
CREATE POLICY "Users can view own favorites" ON user_favorites
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own favorites" ON user_favorites
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to register a new user
CREATE OR REPLACE FUNCTION register_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT DEFAULT 'guest'
) RETURNS TABLE(user_id UUID, success BOOLEAN, message TEXT) AS $$
DECLARE
  v_user_id UUID;
  v_password_hash TEXT;
BEGIN
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Email already registered';
    RETURN;
  END IF;

  -- Hash password using pgcrypto
  v_password_hash := crypt(p_password, gen_salt('bf'));

  -- Insert new user
  INSERT INTO users (email, password_hash, full_name, role)
  VALUES (p_email, v_password_hash, p_full_name, p_role)
  RETURNING id INTO v_user_id;

  RETURN QUERY SELECT v_user_id, TRUE, 'User registered successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to authenticate a user
CREATE OR REPLACE FUNCTION authenticate_user(
  p_email TEXT,
  p_password TEXT
) RETURNS TABLE(user_id UUID, email TEXT, full_name TEXT, role TEXT, success BOOLEAN, message TEXT) AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Find user by email
  SELECT id, users.email, password_hash, full_name, role, status
  INTO v_user
  FROM users
  WHERE users.email = p_email;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, FALSE, 'Invalid email or password';
    RETURN;
  END IF;

  -- Check if account is active
  IF v_user.status != 'active' THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, FALSE, 'Account is not active';
    RETURN;
  END IF;

  -- Verify password
  IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
    -- Update last login
    UPDATE users SET last_login = NOW() WHERE id = v_user.id;
    
    RETURN QUERY SELECT v_user.id, v_user.email, v_user.full_name, v_user.role, TRUE, 'Login successful';
  ELSE
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, FALSE, 'Invalid email or password';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;
