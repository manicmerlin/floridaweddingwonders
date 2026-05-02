/* eslint-disable no-console */
//
// scripts/fix-capacity-parser.ts
//
// Targeted re-migration for ONLY capacity_min / capacity_max. The full
// migrate-catalog.ts would clobber owner-edited fields (uploaded photos,
// real contact emails, contact_email_real flag) since it writes the whole
// row from the source JSON. This script reads the source JSON, runs the
// FIXED parser, and updates only the two capacity columns when they
// differ from current DB values.
//
// Run with:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npx tsx scripts/fix-capacity-parser.ts [--commit]
//
// Without --commit: dry-run, prints the proposed updates and exits.
// With --commit: writes the updates via legacy_id.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMMIT = process.argv.includes('--commit');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Mirror of the fixed parseCapacity in scripts/migrate-catalog.ts. Kept here
// inline so this script is self-contained and doesn't import the larger
// migration module's side effects.
function parseCapacity(text: string | null | undefined): {
  min: number | null;
  max: number | null;
} {
  if (!text || typeof text !== 'string') return { min: null, max: null };
  const stripped = text.replace(/,/g, '');
  const numbers = (stripped.match(/\d{2,5}/g) ?? [])
    .map((s) => parseInt(s, 10))
    .filter((n) => n > 0 && n <= 10000);
  if (numbers.length === 0) return { min: null, max: null };
  if (numbers.length === 1) {
    const n = numbers[0];
    return { min: Math.floor(n * 0.5), max: n };
  }
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

async function main() {
  console.log(`fix-capacity-parser running in ${COMMIT ? 'COMMIT' : 'DRY-RUN'} mode\n`);

  const json = JSON.parse(
    readFileSync(resolve(process.cwd(), 'src/data/venues.json'), 'utf-8')
  );
  const sourceVenues: any[] = json.weddingVenues;

  // Pull current capacity values + names + legacy_ids from DB. We match by
  // legacy_id (= 1-based index from the JSON) since the migration uses that.
  const { data: dbRows, error } = await supabase
    .from('venues')
    .select('legacy_id, name, capacity_min, capacity_max, capacity_text');
  if (error || !dbRows) {
    console.error('Could not fetch venues:', error?.message);
    process.exit(1);
  }
  const byLegacyId = new Map<string, any>();
  for (const r of dbRows) byLegacyId.set(r.legacy_id, r);

  const updates: Array<{
    legacyId: string;
    name: string;
    oldMin: number | null;
    oldMax: number | null;
    newMin: number | null;
    newMax: number | null;
    sourceText: string;
  }> = [];

  sourceVenues.forEach((v, idx) => {
    const legacyId = String(idx + 1);
    const dbRow = byLegacyId.get(legacyId);
    if (!dbRow) return; // Not in DB — skip; full migration handles inserts.
    const fresh = parseCapacity(v.capacity);
    if (fresh.min !== dbRow.capacity_min || fresh.max !== dbRow.capacity_max) {
      updates.push({
        legacyId,
        name: v.name,
        oldMin: dbRow.capacity_min,
        oldMax: dbRow.capacity_max,
        newMin: fresh.min,
        newMax: fresh.max,
        sourceText:
          typeof v.capacity === 'string' ? v.capacity.slice(0, 100) : '(no text)',
      });
    }
  });

  console.log(`Found ${updates.length} venues with changed capacity:\n`);
  for (const u of updates) {
    console.log(
      `  [${u.legacyId.padStart(3)}] ${(u.oldMin + '-' + u.oldMax).padEnd(12)} -> ${(u.newMin + '-' + u.newMax).padEnd(12)}  ${u.name}`
    );
    console.log(`        src: ${u.sourceText}`);
  }

  if (!COMMIT) {
    console.log('\nDry run. Re-run with --commit to apply.');
    return;
  }

  for (const u of updates) {
    const { error: updErr } = await supabase
      .from('venues')
      .update({ capacity_min: u.newMin, capacity_max: u.newMax })
      .eq('legacy_id', u.legacyId);
    if (updErr) {
      console.error(`  FAILED ${u.legacyId}: ${updErr.message}`);
      process.exit(1);
    }
    console.log(`  updated ${u.legacyId} (${u.name})`);
  }
  console.log(`\nDone. ${updates.length} rows updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
