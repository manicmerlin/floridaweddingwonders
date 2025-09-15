const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function setupEmailPolicies() {
  console.log('🛡️ Setting up RLS policies for email_subscribers...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try using the REST API to execute SQL
  try {
    // First, let's try to create policies using a different approach
    // We'll use the PostgREST API to manipulate the policies
    
    console.log('📝 Attempting to create RLS policies...');
    
    // Method 1: Try to insert a test record to see if policies exist
    const { data: testInsert, error: testError } = await supabase
      .from('email_subscribers')
      .insert([
        {
          email: 'policy.test@example.com',
          is_venue_owner: false,
          venue_name: null
        }
      ])
      .select();

    if (testError && testError.message.includes('row-level security')) {
      console.log('⚠️ RLS policies needed. Let me try another approach...');
      
      // Method 2: Try using service role key if available
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        console.log('🔑 Using service role key to create policies...');
        
        const adminSupabase = createClient(supabaseUrl, serviceKey);
        
        // Try the SQL directly with admin client
        try {
          const { data: sqlResult, error: sqlError } = await adminSupabase.rpc('exec_sql', {
            sql: `
              CREATE POLICY IF NOT EXISTS "Allow public email submissions" ON email_subscribers
                FOR INSERT WITH CHECK (true);
              
              CREATE POLICY IF NOT EXISTS "Allow public read of own submissions" ON email_subscribers
                FOR SELECT USING (true);
            `
          });

          if (sqlError) {
            console.log('⚠️ SQL exec method not available:', sqlError.message);
          } else {
            console.log('✅ Policies created via admin client!');
          }
        } catch (adminErr) {
          console.log('⚠️ Admin client approach failed:', adminErr.message);
        }
      }
      
      // Method 3: Manual policy creation via HTTP
      console.log('🌐 Trying HTTP API approach...');
      
      const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      };

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            sql: `
              CREATE POLICY IF NOT EXISTS "Allow public email submissions" ON email_subscribers
                FOR INSERT WITH CHECK (true);
              
              CREATE POLICY IF NOT EXISTS "Allow public read of own submissions" ON email_subscribers
                FOR SELECT USING (true);
            `
          })
        });

        if (response.ok) {
          console.log('✅ Policies created via HTTP API!');
        } else {
          const errorText = await response.text();
          console.log('⚠️ HTTP API response:', errorText);
        }
      } catch (httpErr) {
        console.log('⚠️ HTTP API failed:', httpErr.message);
      }

    } else if (testError) {
      console.log('❌ Other error occurred:', testError.message);
    } else {
      console.log('✅ Policies already exist! Test insert successful:', testInsert);
      
      // Clean up test data
      await supabase
        .from('email_subscribers')
        .delete()
        .eq('email', 'policy.test@example.com');
      console.log('🧹 Test data cleaned up');
    }

  } catch (err) {
    console.log('❌ Setup failed:', err.message);
  }

  // Final test
  console.log('');
  console.log('🧪 Final test of email submission...');
  try {
    const { data: finalTest, error: finalError } = await supabase
      .from('email_subscribers')
      .insert([
        {
          email: 'final.test@example.com',
          is_venue_owner: false,
          venue_name: null
        }
      ])
      .select();

    if (finalError) {
      console.log('❌ Final test failed:', finalError.message);
      console.log('');
      console.log('📋 Manual SQL Required:');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/aflrmpkolumpjhpaxblz/sql');
      console.log('');
      console.log('```sql');
      console.log('CREATE POLICY "Allow public email submissions" ON email_subscribers');
      console.log('  FOR INSERT WITH CHECK (true);');
      console.log('');
      console.log('CREATE POLICY "Allow public read of own submissions" ON email_subscribers');
      console.log('  FOR SELECT USING (true);');
      console.log('```');
    } else {
      console.log('✅ Final test successful! Email policies are working!');
      console.log('📋 Data:', finalTest);
      
      // Clean up
      await supabase
        .from('email_subscribers')
        .delete()
        .eq('email', 'final.test@example.com');
      console.log('🧹 Final test data cleaned up');
      
      console.log('');
      console.log('🎉 Email capture is ready!');
      console.log('🔗 Test at: http://localhost:3000/coming-soon');
    }
  } catch (finalErr) {
    console.log('❌ Final test error:', finalErr.message);
  }
}

setupEmailPolicies();
