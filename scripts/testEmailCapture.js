const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testEmailCapture() {
  console.log('🧪 Testing email capture functionality...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 1: Add a test email subscriber (regular user)
  console.log('📧 Testing regular email subscription...');
  try {
    const { data: regularUser, error: regularError } = await supabase
      .from('email_subscribers')
      .insert([
        {
          email: 'test.user@example.com',
          is_venue_owner: false,
          venue_name: null
        }
      ])
      .select();

    if (regularError) {
      console.log('❌ Regular user test failed:', regularError.message);
    } else {
      console.log('✅ Regular user email captured successfully!');
      console.log('📋 Data:', regularUser);
    }
  } catch (err) {
    console.log('❌ Regular user test error:', err.message);
  }

  // Test 2: Add a test venue owner
  console.log('');
  console.log('🏛️ Testing venue owner subscription...');
  try {
    const { data: venueOwner, error: venueError } = await supabase
      .from('email_subscribers')
      .insert([
        {
          email: 'venue.owner@example.com',
          is_venue_owner: true,
          venue_name: 'Test Wedding Venue'
        }
      ])
      .select();

    if (venueError) {
      console.log('❌ Venue owner test failed:', venueError.message);
    } else {
      console.log('✅ Venue owner email captured successfully!');
      console.log('📋 Data:', venueOwner);
    }
  } catch (err) {
    console.log('❌ Venue owner test error:', err.message);
  }

  // Test 3: Check all email subscribers
  console.log('');
  console.log('📊 Checking all email subscribers...');
  try {
    const { data: allSubscribers, error: fetchError } = await supabase
      .from('email_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.log('❌ Failed to fetch subscribers:', fetchError.message);
    } else {
      console.log(`✅ Total subscribers: ${allSubscribers.length}`);
      console.log('📋 Recent subscribers:');
      allSubscribers.slice(0, 5).forEach((sub, i) => {
        console.log(`   ${i + 1}. ${sub.email} ${sub.is_venue_owner ? '(Venue Owner: ' + sub.venue_name + ')' : '(Regular User)'} - ${new Date(sub.created_at).toLocaleString()}`);
      });
    }
  } catch (err) {
    console.log('❌ Fetch subscribers error:', err.message);
  }

  // Test 4: Clean up test data
  console.log('');
  console.log('🧹 Cleaning up test data...');
  try {
    const { error: cleanupError } = await supabase
      .from('email_subscribers')
      .delete()
      .in('email', ['test.user@example.com', 'venue.owner@example.com']);

    if (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    } else {
      console.log('✅ Test data cleaned up successfully!');
    }
  } catch (err) {
    console.log('⚠️ Cleanup error:', err.message);
  }

  console.log('');
  console.log('🎉 Email capture testing completed!');
  console.log('🌟 Coming soon page is ready to capture real emails!');
  console.log('🔗 Test it at: http://localhost:3000/coming-soon');
}

testEmailCapture();
