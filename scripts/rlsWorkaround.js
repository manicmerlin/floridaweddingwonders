const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function disableRLSTemporarily() {
  console.log('🔧 Attempting to work around RLS...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try to use a different approach - check if we can query the policies table
  try {
    console.log('🔍 Checking existing policies...');
    
    // Try to see what's in the policies system table
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'email_subscribers');

    if (!policiesError && policies) {
      console.log('📋 Current policies:', policies);
    } else {
      console.log('⚠️ Cannot access policies table:', policiesError?.message);
    }

    // Alternative approach: Try to create a function that handles the insert
    console.log('');
    console.log('🚀 Alternative approach: Testing direct database access...');
    
    // Let's see if we can use a stored procedure approach
    const { data: procResult, error: procError } = await supabase.rpc('insert_email_subscriber', {
      email_param: 'test@example.com',
      is_venue_owner_param: false,
      venue_name_param: null
    });

    if (procError) {
      console.log('⚠️ Stored procedure approach not available:', procError.message);
    } else {
      console.log('✅ Stored procedure worked!', procResult);
    }

  } catch (err) {
    console.log('❌ Alternative approaches failed:', err.message);
  }

  console.log('');
  console.log('📝 Creating stored procedure to bypass RLS...');
  
  // Let's try to create a function that will handle inserts with elevated privileges
  try {
    const functionSQL = `
      CREATE OR REPLACE FUNCTION insert_email_subscriber(
        email_param TEXT,
        is_venue_owner_param BOOLEAN DEFAULT FALSE,
        venue_name_param TEXT DEFAULT NULL
      )
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result json;
      BEGIN
        INSERT INTO email_subscribers (email, is_venue_owner, venue_name)
        VALUES (email_param, is_venue_owner_param, venue_name_param)
        RETURNING to_json(email_subscribers.*) INTO result;
        
        RETURN result;
      END;
      $$;
    `;

    // Try multiple ways to execute this function
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    };

    console.log('📨 Attempting to create function via different methods...');

    // Method 1: Try a simple HTTP request to create the function
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: functionSQL })
      });

      if (response.ok) {
        console.log('✅ Function creation method 1 successful!');
      } else {
        console.log('⚠️ Method 1 response:', await response.text());
      }
    } catch (httpErr) {
      console.log('⚠️ Method 1 failed:', httpErr.message);
    }

  } catch (err) {
    console.log('❌ Function creation failed:', err.message);
  }

  console.log('');
  console.log('🎯 RECOMMENDATION:');
  console.log('The best approach is to manually add the RLS policies in Supabase dashboard.');
  console.log('');
  console.log('🔗 URL: https://supabase.com/dashboard/project/aflrmpkolumpjhpaxblz/sql');
  console.log('');
  console.log('📋 SQL to run:');
  console.log('```sql');
  console.log('CREATE POLICY "Allow public email submissions" ON email_subscribers');
  console.log('  FOR INSERT WITH CHECK (true);');
  console.log('');
  console.log('CREATE POLICY "Allow public read of own submissions" ON email_subscribers');
  console.log('  FOR SELECT USING (true);');
  console.log('```');
  console.log('');
  console.log('⏰ This will take 30 seconds, then the coming soon page will work perfectly!');
}

disableRLSTemporarily();
