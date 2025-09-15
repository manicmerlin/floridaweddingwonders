-- Extended schema for user authentication and venue management

-- Create users table for venue owners
CREATE TABLE IF NOT EXISTS venue_owners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create venue_ownerships table to link users to venues
CREATE TABLE IF NOT EXISTS venue_ownerships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES venue_owners(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(venue_id, owner_id)
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Update venue_claims table to include approval workflow
ALTER TABLE venue_claims ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES admin_users(id);
ALTER TABLE venue_claims ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE venue_claims ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE venue_claims ADD COLUMN IF NOT EXISTS venue_owner_id UUID REFERENCES venue_owners(id);

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('venue_owner', 'admin')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('venue_owner', 'admin')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_type TEXT CHECK (user_type IN ('venue_owner', 'admin', 'system')),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_venue_owners_email ON venue_owners(email);
CREATE INDEX IF NOT EXISTS idx_venue_owners_username ON venue_owners(username);
CREATE INDEX IF NOT EXISTS idx_venue_ownerships_venue ON venue_ownerships(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_ownerships_owner ON venue_ownerships(owner_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Enable RLS
ALTER TABLE venue_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_ownerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Venue owners can only see their own data
CREATE POLICY "Venue owners can view own profile" ON venue_owners
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Venue owners can update own profile" ON venue_owners
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Venue ownerships - owners can see their venues
CREATE POLICY "Owners can view their venue ownerships" ON venue_ownerships
  FOR SELECT USING (auth.uid()::text = owner_id::text);

-- Admin users - admins can see all
CREATE POLICY "Admins can view all admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND status = 'active'
    )
  );

-- Password reset tokens - users can only see their own
CREATE POLICY "Users can view own password reset tokens" ON password_reset_tokens
  FOR SELECT USING (user_id::text = auth.uid()::text);

-- Create updated_at triggers
CREATE TRIGGER update_venue_owners_updated_at BEFORE UPDATE ON venue_owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default super admin (you'll need to hash the password)
-- INSERT INTO admin_users (email, username, password_hash, full_name, role) 
-- VALUES ('admin@floridaweddingwonders.com', 'admin', '$2b$12$...', 'Bennett Admin', 'super_admin');

-- Function to create venue owner account after approval
CREATE OR REPLACE FUNCTION create_venue_owner_account(
  p_email TEXT,
  p_username TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_venue_claim_id UUID
) RETURNS UUID AS $$
DECLARE
  v_owner_id UUID;
  v_venue_id UUID;
  v_temp_password TEXT;
BEGIN
  -- Generate temporary password
  v_temp_password := encode(gen_random_bytes(12), 'base64');
  
  -- Create venue owner account
  INSERT INTO venue_owners (email, username, password_hash, full_name, phone, email_verified)
  VALUES (p_email, p_username, crypt(v_temp_password, gen_salt('bf')), p_full_name, p_phone, TRUE)
  RETURNING id INTO v_owner_id;
  
  -- Get venue ID from claim
  SELECT venue_id INTO v_venue_id 
  FROM venue_claims 
  WHERE id = p_venue_claim_id;
  
  -- Create venue ownership
  INSERT INTO venue_ownerships (venue_id, owner_id, role)
  VALUES (v_venue_id, v_owner_id, 'owner');
  
  -- Update venue as claimed
  UPDATE venues 
  SET is_claimed = TRUE, claimed_by = p_email 
  WHERE id = v_venue_id;
  
  -- Update claim status
  UPDATE venue_claims 
  SET status = 'approved', venue_owner_id = v_owner_id, approved_at = NOW()
  WHERE id = p_venue_claim_id;
  
  RETURN v_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
