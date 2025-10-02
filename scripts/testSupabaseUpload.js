const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  console.log('🧪 Testing Supabase Storage upload...\n');
  
  try {
    // Create a simple test file
    const testContent = 'This is a test file';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testPath = 'test/test-file.txt';
    
    console.log('📤 Attempting upload to venue-photos bucket...');
    
    // Try to upload
    const { data, error } = await supabase.storage
      .from('venue-photos')
      .upload(testPath, testBlob, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('❌ Upload failed:', error);
      console.error('\nPossible issues:');
      console.error('1. Bucket policies not set correctly');
      console.error('2. RLS (Row Level Security) blocking uploads');
      console.error('3. Anon key doesn\'t have upload permissions');
      return;
    }
    
    console.log('✅ Upload successful!', data);
    
    // Try to get public URL
    const { data: urlData } = supabase.storage
      .from('venue-photos')
      .getPublicUrl(testPath);
    
    console.log('✅ Public URL:', urlData.publicUrl);
    
    // Clean up
    console.log('\n🧹 Cleaning up test file...');
    await supabase.storage
      .from('venue-photos')
      .remove([testPath]);
    
    console.log('✅ Test complete! Supabase upload is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpload();
