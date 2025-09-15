import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function setupTestClaim() {
  console.log('🧪 Setting up test venue claim...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Insert a test venue first
    console.log('📍 Creating test venue...');
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .insert({
        name: 'Test Wedding Venue',
        description: 'A beautiful test venue for weddings',
        type: 'ballroom',
        location: 'Miami, FL',
        region: 'Miami-Dade & Broward',
        capacity_min: 50,
        capacity_max: 200,
        price_range: '$5,000 - $15,000',
        amenities: ['parking', 'catering', 'sound_system'],
        images: [],
        contact_phone: '(305) 555-0123',
        contact_email: 'info@testvenue.com',
        contact_website: 'https://testvenue.com',
        address_street: '123 Test Street',
        address_city: 'Miami',
        address_state: 'Florida',
        address_zip: '33101',
        is_claimed: false
      })
      .select()
      .single();

    if (venueError) {
      console.error('Error creating venue:', venueError);
      return;
    }

    console.log('✅ Test venue created:', venue.name);

    // Create a test claim for this venue
    console.log('📋 Creating test venue claim...');
    const { data: claim, error: claimError } = await supabase
      .from('venue_claims')
      .insert({
        venue_id: venue.id,
        user_email: 'owner@testvenue.com',
        user_name: 'John Smith',
        user_phone: '(305) 555-0123',
        message: 'I am the owner of Test Wedding Venue and would like to claim it for premium listing management.',
        status: 'pending'
      })
      .select()
      .single();

    if (claimError) {
      console.error('Error creating claim:', claimError);
      return;
    }

    console.log('✅ Test venue claim created!');
    console.log('📋 Details:');
    console.log(`   - Venue: ${venue.name}`);
    console.log(`   - Owner: John Smith`);
    console.log(`   - Email: owner@testvenue.com`);
    console.log(`   - Claim ID: ${claim.id}`);
    console.log('');
    console.log('🚀 Now test the approval workflow:');
    console.log('   1. Go to http://localhost:3000/admin');
    console.log('   2. Click "Pending Approvals" tab');
    console.log('   3. Approve the claim to create user account');

  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  setupTestClaim();
}

export default setupTestClaim;
