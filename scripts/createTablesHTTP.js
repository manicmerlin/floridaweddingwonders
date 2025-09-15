require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function createTablesHTTP() {
  console.log('🚀 Creating tables via HTTP API...');
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  // Create venues table SQL
  const venuesSQL = `
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

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow public read access to venues" ON venues
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(type);
CREATE INDEX IF NOT EXISTS idx_venues_region ON venues(region);
CREATE INDEX IF NOT EXISTS idx_venues_capacity ON venues(capacity_min, capacity_max);
CREATE INDEX IF NOT EXISTS idx_venues_claimed ON venues(is_claimed);
`;

  // Create venue_claims table SQL  
  const claimsSQL = `
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

ALTER TABLE venue_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow public insert to venue_claims" ON venue_claims
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY IF NOT EXISTS "Allow public read own claims" ON venue_claims
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_venue_claims_status ON venue_claims(status);
CREATE INDEX IF NOT EXISTS idx_venue_claims_venue_id ON venue_claims(venue_id);
`;

  try {
    console.log('🏛️ Creating venues table...');
    const venuesResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sql: venuesSQL })
    });
    
    if (venuesResponse.ok) {
      console.log('✅ Venues table created successfully!');
    } else {
      const venuesError = await venuesResponse.text();
      console.log('⚠️ Venues table creation response:', venuesError);
    }

    console.log('📋 Creating venue_claims table...');
    const claimsResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sql: claimsSQL })
    });
    
    if (claimsResponse.ok) {
      console.log('✅ Venue claims table created successfully!');
    } else {
      const claimsError = await claimsResponse.text();
      console.log('⚠️ Venue claims table creation response:', claimsError);
    }

  } catch (error) {
    console.log('❌ HTTP API approach failed:', error.message);
    console.log('');
    console.log('📋 Manual SQL Approach Required');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/aflrmpkolumpjhpaxblz/sql');
    console.log('');
    console.log('🏛️ VENUES TABLE SQL:');
    console.log('```sql');
    console.log(venuesSQL.trim());
    console.log('```');
    console.log('');
    console.log('📋 VENUE CLAIMS TABLE SQL:');
    console.log('```sql');
    console.log(claimsSQL.trim());
    console.log('```');
    console.log('');
    console.log('📝 Instructions:');
    console.log('1. Copy the VENUES TABLE SQL and run it first');
    console.log('2. Copy the VENUE CLAIMS TABLE SQL and run it second');
    console.log('3. Run: node scripts/testDatabase.js to verify');
  }
}

createTablesHTTP();
