-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  capacity_min INTEGER NOT NULL,
  capacity_max INTEGER NOT NULL,
  price_range TEXT NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_website TEXT,
  address_street TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL DEFAULT 'Florida',
  address_zip TEXT NOT NULL,
  coordinates_lat DECIMAL,
  coordinates_lng DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_by TEXT
);

-- Create venue_claims table
CREATE TABLE IF NOT EXISTS venue_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_subscribers table for coming soon page
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  venue_name TEXT,
  is_venue_owner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(type);
CREATE INDEX IF NOT EXISTS idx_venues_region ON venues(region);
CREATE INDEX IF NOT EXISTS idx_venues_capacity ON venues(capacity_min, capacity_max);
CREATE INDEX IF NOT EXISTS idx_venues_claimed ON venues(is_claimed);
CREATE INDEX IF NOT EXISTS idx_venue_claims_status ON venue_claims(status);
CREATE INDEX IF NOT EXISTS idx_venue_claims_venue_id ON venue_claims(venue_id);

-- Enable Row Level Security (RLS)
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to venues (read-only)
CREATE POLICY "Allow public read access to venues" ON venues
  FOR SELECT USING (true);

-- Create policies for venue claims (anyone can insert, only admin can update)
CREATE POLICY "Allow public insert to venue_claims" ON venue_claims
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read own claims" ON venue_claims
  FOR SELECT USING (true);

-- Create policies for email subscribers (anyone can insert)
CREATE POLICY "Allow public insert to email_subscribers" ON email_subscribers
  FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_claims_updated_at BEFORE UPDATE ON venue_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
