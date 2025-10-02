const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndSetupStorage() {
  console.log('🔍 Checking Supabase Storage configuration...\n');
  
  try {
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    console.log('📦 Existing buckets:');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    console.log('');
    
    // Check if venue-photos bucket exists
    const venuePhotosBucket = buckets.find(b => b.name === 'venue-photos');
    
    if (!venuePhotosBucket) {
      console.log('⚠️  venue-photos bucket not found');
      console.log('');
      console.log('📝 To create it:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/storage/buckets');
      console.log('   2. Click "Create bucket"');
      console.log('   3. Name: venue-photos');
      console.log('   4. Set as PUBLIC');
      console.log('   5. Click "Create bucket"');
      console.log('');
    } else {
      console.log('✅ venue-photos bucket exists');
      console.log(`   - Public: ${venuePhotosBucket.public ? 'Yes ✓' : 'No (needs to be public!)'}`);
      console.log('');
      
      if (!venuePhotosBucket.public) {
        console.log('⚠️  The bucket should be PUBLIC so images can be viewed');
        console.log('   To fix: Go to bucket settings and enable "Public bucket"');
        console.log('');
      }
    }
    
    console.log('✅ Storage check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndSetupStorage();
