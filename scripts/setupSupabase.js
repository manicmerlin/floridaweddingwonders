const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function setupDatabase() {
  console.log('🚀 Setting up Florida Wedding Wonders database...');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test connection first
  console.log('🔌 Testing database connection...');
  const { data: testData, error: testError } = await supabase
    .from('_dummy_test_')
    .select('*')
    .limit(1);

  if (testError && !testError.message.includes('relation "_dummy_test_" does not exist')) {
    console.error('❌ Database connection failed:', testError);
    process.exit(1);
  }

  console.log('✅ Database connection successful!');

  // Create email_subscribers table first (simplest)
  console.log('📧 Creating email_subscribers table...');
  try {
    const { error: subscribersError } = await supabase
      .from('email_subscribers')
      .select('*')
      .limit(1);

    if (subscribersError && subscribersError.message.includes('does not exist')) {
      console.log('📧 Email subscribers table needs to be created manually in Supabase dashboard');
    } else {
      console.log('✅ Email subscribers table already exists');
    }
  } catch (err) {
    console.log('📧 Email subscribers table needs to be created manually');
  }

  console.log('🎉 Basic setup completed!');
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('1. Go to: https://supabase.com/dashboard/project/aflrmpkolumpjhpaxblz/editor');
  console.log('2. Click "SQL Editor" in the sidebar');
  console.log('3. Copy and paste the SQL from: database/schema.sql');
  console.log('4. Click "Run" to create all tables');
  console.log('');
  console.log('🔗 Quick link: https://supabase.com/dashboard/project/aflrmpkolumpjhpaxblz/sql/new');
}

setupDatabase().catch(console.error);
