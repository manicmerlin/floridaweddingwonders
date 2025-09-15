const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testDatabase() {
  console.log('🧪 Testing database setup...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 1: Check if email_subscribers table exists
  console.log('📧 Testing email_subscribers table...');
  try {
    const { data, error } = await supabase
      .from('email_subscribers')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ email_subscribers table not found:', error.message);
      return false;
    } else {
      console.log('✅ email_subscribers table exists!');
    }
  } catch (err) {
    console.log('❌ email_subscribers test failed:', err.message);
    return false;
  }

  // Test 2: Check if venues table exists
  console.log('🏛️ Testing venues table...');
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ venues table not found:', error.message);
      return false;
    } else {
      console.log('✅ venues table exists!');
    }
  } catch (err) {
    console.log('❌ venues test failed:', err.message);
    return false;
  }

  // Test 3: Check if venue_claims table exists
  console.log('📋 Testing venue_claims table...');
  try {
    const { data, error } = await supabase
      .from('venue_claims')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ venue_claims table not found:', error.message);
      return false;
    } else {
      console.log('✅ venue_claims table exists!');
    }
  } catch (err) {
    console.log('❌ venue_claims test failed:', err.message);
    return false;
  }

  console.log('');
  console.log('🎉 All tables exist! Database setup was successful!');
  console.log('');
  console.log('🔄 Ready for next steps:');
  console.log('   1. ✅ Test coming soon email capture');
  console.log('   2. ✅ Migrate 130 venues to database');
  console.log('   3. ✅ Set up photo storage');
  console.log('   4. ✅ Deploy to production');
  
  return true;
}

testDatabase();
