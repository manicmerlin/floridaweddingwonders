const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function createTablesViaAPI() {
  console.log('🚀 Creating tables via Supabase API...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create venues table
  console.log('🏛️ Creating venues table...');
  try {
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
    `;

    const { data: venuesData, error: venuesError } = await supabase.rpc('exec_sql', {
      sql: venuesSQL
    });

    if (venuesError) {
      console.log('⚠️ Venues table creation:', venuesError.message);
    } else {
      console.log('✅ Venues table created successfully!');
    }
  } catch (err) {
    console.log('ℹ️ Venues table (might already exist):', err.message);
  }

  // Create venue_claims table
  console.log('📋 Creating venue_claims table...');
  try {
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
    `;

    const { data: claimsData, error: claimsError } = await supabase.rpc('exec_sql', {
      sql: claimsSQL
    });

    if (claimsError) {
      console.log('⚠️ Venue claims table creation:', claimsError.message);
    } else {
      console.log('✅ Venue claims table created successfully!');
    }
  } catch (err) {
    console.log('ℹ️ Venue claims table (might already exist):', err.message);
  }

  // Enable RLS and create policies
  console.log('🔐 Setting up security policies...');
  try {
    const securitySQL = `
      ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
      ALTER TABLE venue_claims ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Allow public read access to venues" ON venues
        FOR SELECT USING (true);
        
      CREATE POLICY IF NOT EXISTS "Allow public insert to venue_claims" ON venue_claims
        FOR INSERT WITH CHECK (true);
        
      CREATE POLICY IF NOT EXISTS "Allow public read own claims" ON venue_claims
        FOR SELECT USING (true);
    `;

    const { data: securityData, error: securityError } = await supabase.rpc('exec_sql', {
      sql: securitySQL
    });

    if (securityError) {
      console.log('⚠️ Security setup:', securityError.message);
    } else {
      console.log('✅ Security policies created successfully!');
    }
  } catch (err) {
    console.log('ℹ️ Security policies (might already exist):', err.message);
  }

  // Create indexes
  console.log('⚡ Creating performance indexes...');
  try {
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(type);
      CREATE INDEX IF NOT EXISTS idx_venues_region ON venues(region);
      CREATE INDEX IF NOT EXISTS idx_venues_capacity ON venues(capacity_min, capacity_max);
      CREATE INDEX IF NOT EXISTS idx_venues_claimed ON venues(is_claimed);
      CREATE INDEX IF NOT EXISTS idx_venue_claims_status ON venue_claims(status);
      CREATE INDEX IF NOT EXISTS idx_venue_claims_venue_id ON venue_claims(venue_id);
    `;

    const { data: indexData, error: indexError } = await supabase.rpc('exec_sql', {
      sql: indexSQL
    });

    if (indexError) {
      console.log('⚠️ Index creation:', indexError.message);
    } else {
      console.log('✅ Performance indexes created successfully!');
    }
  } catch (err) {
    console.log('ℹ️ Indexes (might already exist):', err.message);
  }

  console.log('');
  console.log('🎉 Database setup completed via API!');
  console.log('🧪 Running final test...');
  
  // Final test
  try {
    const { data: testVenues, error: testVenuesError } = await supabase
      .from('venues')
      .select('*')
      .limit(1);
      
    const { data: testClaims, error: testClaimsError } = await supabase
      .from('venue_claims')
      .select('*')
      .limit(1);

    if (!testVenuesError && !testClaimsError) {
      console.log('');
      console.log('✅ ALL TABLES WORKING!');
      console.log('🚀 Ready to:');
      console.log('   1. Test coming soon email capture');
      console.log('   2. Migrate 130 venues to database');
      console.log('   3. Set up photo storage');
      console.log('   4. Deploy to production');
    } else {
      console.log('❌ Some tables not working:', testVenuesError?.message || testClaimsError?.message);
    }
  } catch (err) {
    console.log('⚠️ Final test had issues:', err.message);
  }
}

createTablesViaAPI();
