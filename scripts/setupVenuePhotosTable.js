// Script to create the venue_photos table in Supabase
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupVenuePhotosTable() {
  console.log('🚀 Setting up venue_photos table in Supabase...\n');

  // Read the SQL file
  const sqlFile = path.resolve(process.cwd(), 'database/venue-photos-schema.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');

  console.log('📄 SQL to execute:');
  console.log(sql);
  console.log('\n⚠️  Note: You need to run this SQL in the Supabase SQL Editor');
  console.log('   Go to: https://supabase.com/dashboard/project/aflrmpkolumpjhpaxblz/sql/new');
  console.log('   Copy the SQL above and paste it there, then click "Run"');
  console.log('\n   After running the SQL, re-run this script with --test flag to verify\n');

  // Try to test if table exists
  if (process.argv.includes('--test')) {
    console.log('🧪 Testing if venue_photos table exists...\n');
    
    try {
      const { data, error } = await supabase
        .from('venue_photos')
        .select('*')
        .limit(1);

      if (error) {
        console.error('❌ Table does not exist or has an error:', error.message);
        return false;
      }

      console.log('✅ Table exists and is accessible!');
      return true;
    } catch (error) {
      console.error('❌ Error testing table:', error.message);
      return false;
    }
  }
}

setupVenuePhotosTable().then(success => {
  if (success !== undefined) {
    process.exit(success ? 0 : 1);
  }
});
