import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function setupDatabase() {
  console.log('🚀 Setting up Florida Wedding Wonders database...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Create venues table
    console.log('📊 Creating venues table...');
    const { error: venuesError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (venuesError) {
      console.error('Error creating venues table:', venuesError);
    } else {
      console.log('✅ Venues table created successfully');
    }

    // Create venue_claims table
    console.log('📋 Creating venue_claims table...');
    const { error: claimsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (claimsError) {
      console.error('Error creating venue_claims table:', claimsError);
    } else {
      console.log('✅ Venue claims table created successfully');
    }

    // Create email_subscribers table
    console.log('📧 Creating email_subscribers table...');
    const { error: subscribersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS email_subscribers (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          venue_name TEXT,
          is_venue_owner BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (subscribersError) {
      console.error('Error creating email_subscribers table:', subscribersError);
    } else {
      console.log('✅ Email subscribers table created successfully');
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('🔗 Check your tables at: https://supabase.com/dashboard/project/aflrmpkolumpjhpaxblz/editor');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

export default setupDatabase;
