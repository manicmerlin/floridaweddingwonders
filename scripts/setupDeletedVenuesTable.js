// Script to create the deleted_venues table in Supabase
import * as fs from 'fs';
import * as path from 'path';

console.log('🚀 Setting up deleted_venues table in Supabase...\n');

// Read the SQL file
const sqlFile = path.resolve(process.cwd(), 'database/deleted-venues-schema.sql');
const sql = fs.readFileSync(sqlFile, 'utf-8');

console.log('📄 SQL to execute:');
console.log(sql);
console.log('\n⚠️  Note: You need to run this SQL in the Supabase SQL Editor');
console.log('   Go to: https://supabase.com/dashboard/project/aflrmpkolumpjhpaxblz/sql/new');
console.log('   Copy the SQL above and paste it there, then click "Run"\n');
