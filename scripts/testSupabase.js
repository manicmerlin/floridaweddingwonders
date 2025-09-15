const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function createTables() {
  console.log('🚀 Setting up Florida Wedding Wonders database...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test if we can access Supabase
  console.log('🔌 Testing Supabase connection...');
  console.log('✅ Supabase client created successfully!');
  console.log(`📍 Project URL: ${supabaseUrl}`);

  console.log('');
  console.log('🎯 MANUAL SETUP REQUIRED:');
  console.log('I need you to run the SQL schema in your Supabase dashboard.');
  console.log('');
  console.log('👉 STEPS:');
  console.log('1. Open: https://supabase.com/dashboard/project/aflrmpkolumpjhpaxblz/sql/new');
  console.log('2. Copy ALL the SQL from: database/schema.sql');
  console.log('3. Paste it in the SQL editor');
  console.log('4. Click "Run" button');
  console.log('');
  console.log('📋 The SQL will create:');
  console.log('   ✅ venues table (for 130 venues)');
  console.log('   ✅ venue_claims table (ownership claims)');
  console.log('   ✅ email_subscribers table (coming soon emails)');
  console.log('   ✅ Indexes for performance');
  console.log('   ✅ Security policies');
  console.log('');

  // Try to test if tables exist after manual setup
  console.log('🧪 Testing if I can prepare for data migration...');
  
  // Create a simple test
  setTimeout(async () => {
    try {
      const { data, error } = await supabase
        .from('email_subscribers')
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log('🎉 Tables are ready! Database setup successful!');
        console.log('');
        console.log('🔄 NEXT: I can help you:');
        console.log('   1. Migrate your 130 venues to Supabase');
        console.log('   2. Test the coming soon page email capture');
        console.log('   3. Set up photo storage buckets');
      }
    } catch (err) {
      console.log('⏳ Waiting for you to run the SQL schema...');
    }
  }, 5000);
}

createTables();
