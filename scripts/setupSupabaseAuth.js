const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aflrmpkolumpjhpaxblz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Setting up Supabase user authentication tables...\n');

// Read the SQL schema file
const schemaPath = path.join(__dirname, '../database/users-schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Parse SQL into individual statements
const statements = schema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const url = new URL(SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          resolve({ success: false, status: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function setupDatabase() {
  console.log(`Found ${statements.length} SQL statements to execute\n`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\n/g, ' ');
    
    console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);
    
    try {
      const result = await executeSQL(statement + ';');
      
      if (result.success) {
        console.log('✓ Success\n');
        successCount++;
      } else {
        console.log(`✗ Failed (${result.status}): ${result.data}\n`);
        errorCount++;
      }
    } catch (error) {
      console.log(`✗ Error: ${error.message}\n`);
      errorCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n=================================');
  console.log('Database Setup Complete');
  console.log('=================================');
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${statements.length}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some statements failed. This is often OK if tables already exist.');
    console.log('Check the errors above to ensure nothing critical failed.');
  } else {
    console.log('\n✓ All tables created successfully!');
  }
}

setupDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
