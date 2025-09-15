import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function setupAuthTables() {
  console.log('🔐 Setting up authentication tables...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Create venue_owners table
    console.log('👤 Creating venue_owners table...');
    const { error: venueOwnersError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (venueOwnersError) {
      console.error('Error creating venue_owners:', venueOwnersError);
    } else {
      console.log('✅ venue_owners table created');
    }

    // Create venue_ownerships table
    console.log('🏛️ Creating venue_ownerships table...');
    const { error: ownershipError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS venue_ownerships (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
          owner_id UUID REFERENCES venue_owners(id) ON DELETE CASCADE,
          role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'editor')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(venue_id, owner_id)
        );
      `
    });
    
    if (ownershipError) {
      console.error('Error creating venue_ownerships:', ownershipError);
    } else {
      console.log('✅ venue_ownerships table created');
    }

    // Enable RLS on new tables
    console.log('🔒 Enabling Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE venue_owners ENABLE ROW LEVEL SECURITY;
        ALTER TABLE venue_ownerships ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
    } else {
      console.log('✅ RLS enabled on auth tables');
    }

    console.log('🎉 Authentication tables setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Auth setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  setupAuthTables();
}

export default setupAuthTables;
