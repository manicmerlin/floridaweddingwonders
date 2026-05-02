/* eslint-disable no-console */
//
// scripts/fix-venue-types.ts
//
// Targeted venue_type corrections for venues mis-classified by the original
// migration's inferVenueType. The classifier checks `garden`/`outdoor` tag
// before `historic`, so any historic estate with grounds got mis-categorized
// as "garden" instead of "historic". Pre-Phase-5 cleanup so filter pages and
// hyperlocal landings rank venues under the right type.
//
// Each row is: legacy_id, expected current type, proposed type. The script
// only updates rows whose current type matches the expectation — if the
// data has shifted under us (manual edit, re-migration), it skips and warns
// rather than blindly clobbering.
//
// Run with:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npx tsx scripts/fix-venue-types.ts [--commit]
//
// Without --commit: dry-run, prints proposed updates and exits.

import { createClient } from '@supabase/supabase-js';

const COMMIT = process.argv.includes('--commit');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

interface Fix {
  legacyId: string;
  name: string;
  expected: string;
  proposed: string;
  reason: string;
  confidence: 'high' | 'medium';
}

// High-confidence: name + tag both clearly signal the proposed type
const HIGH_CONFIDENCE: Fix[] = [
  { legacyId: '1',   name: 'Ancient Spanish Monastery',                  expected: 'garden',   proposed: 'historic', confidence: 'high', reason: 'monastery — historic landmark' },
  { legacyId: '2',   name: 'Hialeah Park Racing & Casino',               expected: 'garden',   proposed: 'historic', confidence: 'high', reason: '1925 historic park, ballroom + clubhouse' },
  { legacyId: '9',   name: 'Vizcaya Museum & Gardens',                   expected: 'garden',   proposed: 'historic', confidence: 'high', reason: 'iconic museum estate' },
  { legacyId: '10',  name: 'The Cooper Estate',                          expected: 'garden',   proposed: 'historic', confidence: 'high', reason: 'estate' },
  { legacyId: '11',  name: 'Curtiss Mansion',                            expected: 'garden',   proposed: 'historic', confidence: 'high', reason: 'mansion' },
  { legacyId: '12',  name: 'Thalatta Estate',                            expected: 'garden',   proposed: 'historic', confidence: 'high', reason: 'estate' },
  { legacyId: '13',  name: 'Deering Estate',                             expected: 'garden',   proposed: 'historic', confidence: 'high', reason: 'iconic Miami estate' },
  { legacyId: '15',  name: 'Historic Walton House',                      expected: 'garden',   proposed: 'historic', confidence: 'high', reason: '"Historic" in name' },
  { legacyId: '25',  name: 'Bonnet House Museum & Gardens',              expected: 'garden',   proposed: 'historic', confidence: 'high', reason: 'museum' },
  { legacyId: '50',  name: 'Lady Jean Ranch',                            expected: 'garden',   proposed: 'rustic',   confidence: 'high', reason: 'ranch' },
  { legacyId: '108', name: 'The Garden at the Oldest House Museum',      expected: 'garden',   proposed: 'historic', confidence: 'high', reason: 'oldest house = historic' },
  { legacyId: '118', name: 'Ernest Hemingway Home & Museum',             expected: 'garden',   proposed: 'historic', confidence: 'high', reason: 'iconic Key West landmark' },
  { legacyId: '128', name: 'Ever After Farms Tropical Grove Barn',       expected: 'garden',   proposed: 'rustic',   confidence: 'high', reason: 'barn' },
];

// Medium-confidence: judgment call — ship if approved, otherwise leave
const MEDIUM_CONFIDENCE: Fix[] = [
  { legacyId: '8',   name: 'Coastal Yacht Charters',                     expected: 'ballroom', proposed: 'modern',   confidence: 'medium', reason: 'yacht charter; modern is closest available type' },
  { legacyId: '24',  name: 'Deer Creek Country Club',                    expected: 'garden',   proposed: 'ballroom', confidence: 'medium', reason: 'country club: ballroom is the reception space' },
  { legacyId: '67',  name: 'Vineyards Country Club',                     expected: 'garden',   proposed: 'ballroom', confidence: 'medium', reason: 'country club: ballroom is the reception space' },
  { legacyId: '120', name: 'Bagatelle Restaurant',                       expected: 'historic', proposed: 'modern',   confidence: 'medium', reason: 'Wynwood bistro — historic tag looks wrong' },
];

const ALL_FIXES = [...HIGH_CONFIDENCE, ...MEDIUM_CONFIDENCE];

async function main() {
  console.log(`fix-venue-types running in ${COMMIT ? 'COMMIT' : 'DRY-RUN'} mode\n`);

  const ids = ALL_FIXES.map((f) => f.legacyId);
  const { data: rows, error } = await supabase
    .from('venues')
    .select('legacy_id, name, venue_type')
    .in('legacy_id', ids);
  if (error || !rows) {
    console.error('Could not fetch venues:', error?.message);
    process.exit(1);
  }
  const byId = new Map<string, any>();
  for (const r of rows) byId.set(r.legacy_id, r);

  type Plan = Fix & { actual: string; status: 'apply' | 'skip-mismatch' | 'skip-already-correct' | 'skip-missing' };
  const plan: Plan[] = ALL_FIXES.map((f) => {
    const dbRow = byId.get(f.legacyId);
    if (!dbRow) return { ...f, actual: '(missing)', status: 'skip-missing' };
    if (dbRow.venue_type === f.proposed) return { ...f, actual: dbRow.venue_type, status: 'skip-already-correct' };
    if (dbRow.venue_type !== f.expected) return { ...f, actual: dbRow.venue_type, status: 'skip-mismatch' };
    return { ...f, actual: dbRow.venue_type, status: 'apply' };
  });

  const toApply = plan.filter((p) => p.status === 'apply');
  const skipped = plan.filter((p) => p.status !== 'apply');

  console.log(`Plan: ${toApply.length} updates / ${skipped.length} skipped\n`);
  for (const p of plan) {
    const tag = p.status === 'apply'
      ? '✓'
      : p.status === 'skip-already-correct'
      ? '·'
      : '!';
    console.log(`  ${tag} [${p.legacyId.padStart(3)}] ${p.confidence.padEnd(6)}  ${p.actual.padEnd(8)} -> ${p.proposed.padEnd(8)}  ${p.name}`);
    if (p.status === 'skip-mismatch') {
      console.log(`        skipped: expected current=${p.expected}, found=${p.actual}`);
    } else if (p.status === 'skip-already-correct') {
      console.log(`        already at proposed value`);
    } else if (p.status === 'skip-missing') {
      console.log(`        skipped: legacy_id not found in DB`);
    } else {
      console.log(`        reason:  ${p.reason}`);
    }
  }

  if (!COMMIT) {
    console.log('\nDry run. Re-run with --commit to apply.');
    return;
  }

  for (const p of toApply) {
    const { error: upErr } = await supabase
      .from('venues')
      .update({ venue_type: p.proposed })
      .eq('legacy_id', p.legacyId);
    if (upErr) {
      console.error(`  FAILED ${p.legacyId}: ${upErr.message}`);
      process.exit(1);
    }
    console.log(`  updated ${p.legacyId} (${p.name})`);
  }
  console.log(`\nDone. ${toApply.length} rows updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
