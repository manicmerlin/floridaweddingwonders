// Test inserting a photo record into Supabase database
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log('🧪 Testing database insert...\n');

  const testPhoto = {
    id: 'test-photo-' + Date.now(),
    venue_id: '1',
    url: 'https://aflrmpkolumpjhpaxblz.supabase.co/storage/v1/object/public/venue-photos/test.jpg',
    alt: 'Test Photo',
    is_primary: true,
    uploaded_by: 'test-user'
  };

  console.log('📤 Inserting test photo:', testPhoto);

  const { data, error } = await supabase
    .from('venue_photos')
    .insert(testPhoto)
    .select();

  if (error) {
    console.error('❌ Insert failed:', error);
    return false;
  }

  console.log('✅ Insert successful:', data);

  // Now try to read it back
  console.log('\n📥 Reading back from database...');

  const { data: readData, error: readError } = await supabase
    .from('venue_photos')
    .select('*')
    .eq('id', testPhoto.id);

  if (readError) {
    console.error('❌ Read failed:', readError);
    return false;
  }

  console.log('✅ Read successful:', readData);

  // Clean up - delete the test record
  console.log('\n🧹 Cleaning up...');

  const { error: deleteError } = await supabase
    .from('venue_photos')
    .delete()
    .eq('id', testPhoto.id);

  if (deleteError) {
    console.error('❌ Delete failed:', deleteError);
    return false;
  }

  console.log('✅ Test completed successfully!\n');
  return true;
}

testInsert().then(success => {
  process.exit(success ? 0 : 1);
});
