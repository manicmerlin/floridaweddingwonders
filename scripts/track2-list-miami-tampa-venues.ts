// Survey current Miami-Dade and Tampa Bay venues so the Track 2
// neighborhood-tagging UPDATEs target rows that actually exist.
//
//   npx tsx scripts/track2-list-miami-tampa-venues.ts

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '/Users/bennettbonta/SoFloWeddingVenues/.env.production' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const MIAMI_DADE_CITIES = [
  'Miami', 'Miami Beach', 'Coral Gables', 'Coconut Grove', 'Bal Harbour',
  'Surfside', 'Aventura', 'Sunny Isles Beach', 'Sunny Isles', 'Key Biscayne',
  'Doral', 'Hialeah', 'Homestead', 'Pinecrest', 'South Miami', 'North Miami',
  'North Miami Beach',
];

const TAMPA_BAY_CITIES = [
  'Tampa', 'St. Petersburg', 'St Petersburg', 'Saint Petersburg',
  'Clearwater', 'Treasure Island', 'St Pete Beach', 'St. Pete Beach',
  'Saint Pete Beach', 'Largo', 'Dunedin', 'Safety Harbor', 'Tarpon Springs',
  'Madeira Beach', 'Indian Rocks Beach', 'Belleair',
];

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('venues')
    .select('id, slug, name, city, address_street')
    .in('city', [...MIAMI_DADE_CITIES, ...TAMPA_BAY_CITIES])
    .order('city')
    .order('name');

  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`Total: ${data?.length ?? 0} venues across Miami-Dade + Tampa Bay`);
  console.log('---');
  for (const v of data ?? []) {
    console.log(`${v.city.padEnd(20)} | ${v.name.padEnd(50)} | ${v.address_street ?? '(no address)'}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
