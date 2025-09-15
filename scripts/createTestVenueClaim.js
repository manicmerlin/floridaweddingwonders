import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function createTestVenueClaim() {
  console.log('🧪 Creating test venue claim...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // First, let's get a venue from the database to create a claim for
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('id, name')
      .limit(1);

    if (venuesError || !venues?.length) {
      console.error('No venues found in database. Please run venue migration first.');
      return;
    }

    const testVenue = venues[0];
    console.log(`📍 Using venue: ${testVenue.name}`);

    // Create a test venue claim
    const { data: claim, error: claimError } = await supabase
      .from('venue_claims')
      .insert({
        venue_id: testVenue.id,
        user_email: 'test.owner@example.com',
        user_name: 'Test Venue Owner',
        user_phone: '(555) 123-4567',
        message: 'I am the owner of this venue and would like to claim it for management on Florida Wedding Wonders. I have all the necessary documentation to prove ownership.',
        status: 'pending'
      })
      .select()
      .single();

    if (claimError) {
      console.error('Error creating test claim:', claimError);
      return;
    }

    console.log('✅ Test venue claim created successfully!');
    console.log('🎯 Claim details:');
    console.log(`   - Venue: ${testVenue.name}`);
    console.log(`   - Owner: Test Venue Owner`);
    console.log(`   - Email: test.owner@example.com`);
    console.log(`   - Status: pending`);
    console.log(`   - Claim ID: ${claim.id}`);
    console.log('');
    console.log('🚀 Now you can:');
    console.log('   1. Go to http://localhost:3000/admin');
    console.log('   2. Click on "Pending Approvals" tab');
    console.log('   3. Test the approval workflow!');

  } catch (error) {
    console.error('❌ Failed to create test claim:', error);
  }
}

// Run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  createTestVenueClaim();
}

export default createTestVenueClaim;
