const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function createTablesDirectSQL() {
  console.log('🚀 Creating tables via direct SQL...');
  
  try {
    // Use service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, let's check what tables already exist
    console.log('🔍 Checking existing tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('⚠️ Could not check tables:', tablesError.message);
    } else {
      const tableNames = tables.map(t => t.table_name);
      console.log('📊 Existing tables:', tableNames);
      
      if (tableNames.includes('venues')) {
        console.log('✅ Venues table already exists!');
      }
      if (tableNames.includes('venue_claims')) {
        console.log('✅ Venue claims table already exists!');
      }
      if (tableNames.includes('email_subscribers')) {
        console.log('✅ Email subscribers table already exists!');
      }
    }

    // Now let's try to access the tables directly
    console.log('');
    console.log('🧪 Testing table access...');
    
    try {
      const { data: venueTest, error: venueError } = await supabase
        .from('venues')
        .select('count')
        .limit(1);
        
      if (venueError) {
        console.log('❌ Venues table not accessible:', venueError.message);
        
        // Let's try to create it using a different method
        console.log('🔨 Attempting to create venues table...');
        
        // Insert dummy data to trigger table creation
        const { data: createVenue, error: createError } = await supabase
          .from('venues')
          .insert([{
            name: 'Test Venue',
            description: 'Test venue for table creation',
            type: 'Indoor',
            location: 'Miami',
            region: 'Miami-Dade',
            capacity_min: 50,
            capacity_max: 100,
            price_range: '$$',
            contact_phone: '305-555-0123',
            contact_email: 'test@example.com',
            address_street: '123 Test St',
            address_city: 'Miami',
            address_zip: '33101'
          }])
          .select();
          
        if (createError) {
          console.log('❌ Could not create venues table:', createError.message);
        } else {
          console.log('✅ Venues table created with test data!');
          
          // Remove test data
          await supabase
            .from('venues')
            .delete()
            .eq('name', 'Test Venue');
          console.log('🧹 Test data cleaned up');
        }
      } else {
        console.log('✅ Venues table is accessible!');
      }
    } catch (err) {
      console.log('❌ Venues table test failed:', err.message);
    }

    try {
      const { data: claimTest, error: claimError } = await supabase
        .from('venue_claims')
        .select('count')
        .limit(1);
        
      if (claimError) {
        console.log('❌ Venue claims table not accessible:', claimError.message);
      } else {
        console.log('✅ Venue claims table is accessible!');
      }
    } catch (err) {
      console.log('❌ Venue claims table test failed:', err.message);
    }

    try {
      const { data: emailTest, error: emailError } = await supabase
        .from('email_subscribers')
        .select('count')
        .limit(1);
        
      if (emailError) {
        console.log('❌ Email subscribers table not accessible:', emailError.message);
      } else {
        console.log('✅ Email subscribers table is accessible!');
      }
    } catch (err) {
      console.log('❌ Email subscribers table test failed:', err.message);
    }

    console.log('');
    console.log('📋 Summary:');
    console.log('If tables don\'t exist, you\'ll need to create them in the Supabase dashboard');
    console.log('SQL Editor: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/sql');

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

createTablesDirectSQL();
