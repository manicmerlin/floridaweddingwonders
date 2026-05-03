/* eslint-disable no-console */
//
// scripts/fix-venue-photo-mappings.ts
//
// Phase 7C — repairs venue_photos.venue_id values that point at the wrong
// venues. When the photos were uploaded around 2025-10-02, they were
// assigned venue_id values matching the alphabetical order of venue names
// (audubon=3rd alphabetically, bagatelle=4th, etc.) but the venues table's
// legacy_id is the JSON-array index from the source data, which is a
// totally different ordering.
//
// Result: 14 of 17 photos were pointing at the wrong venues. Most visibly,
// the Emeril Lagasse Foundation card was showing Boca Lago Country Club's
// chandelier ballroom photo because both photo and venue happened to land
// at venue_id=6.
//
// This script identifies each photo by its stable id (img-<timestamp>-<rand>
// or curtiss-default-1) and rewrites venue_id to the correct legacy_id.
// Idempotent and defensive: only updates rows whose current venue_id
// matches the expected (broken) value, so re-runs after manual edits skip
// rather than clobber.
//
// Run with:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npx tsx scripts/fix-venue-photo-mappings.ts [--commit]

import { createClient } from '@supabase/supabase-js';

const COMMIT = process.argv.includes('--commit');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

interface PhotoFix {
  photoId: string;
  expectedCurrentVenueId: string;
  correctVenueId: string;
  intendedVenue: string;
  alt: string;
}

// Mapping derived from cross-referencing photos.alt against venues.name.
// Each row's correctVenueId is the actual legacy_id of the venue named in
// `intendedVenue` (verified earlier via a venues-table query).
const PHOTO_FIXES: PhotoFix[] = [
  // photo_id at venue_id="3" (alt=audubon-house) → should point at Audubon's actual legacy_id 100
  { photoId: 'img-1759445394832-r63fxju8g', expectedCurrentVenueId: '3',  correctVenueId: '100', intendedVenue: 'Audubon House & Tropical Gardens',                       alt: 'audubon-house' },
  { photoId: 'img-1759445499775-68fn4tj78', expectedCurrentVenueId: '4',  correctVenueId: '120', intendedVenue: 'Bagatelle Restaurant',                                   alt: 'bagatelle' },
  { photoId: 'img-1759445525811-gyazbzn28', expectedCurrentVenueId: '5',  correctVenueId: '85',  intendedVenue: "Baker's Cay Resort Key Largo",                           alt: 'bakerscay' },
  { photoId: 'img-1759445535244-bhp8itik7', expectedCurrentVenueId: '5',  correctVenueId: '85',  intendedVenue: "Baker's Cay Resort Key Largo",                           alt: 'bakers-cay-2' },
  { photoId: 'img-1759445560146-jftkh51cg', expectedCurrentVenueId: '6',  correctVenueId: '58',  intendedVenue: 'Boca Lago Country Club',                                  alt: 'boca' },
  { photoId: 'img-1759445581469-3y9fzbovd', expectedCurrentVenueId: '7',  correctVenueId: '25',  intendedVenue: 'Bonnet House Museum & Gardens',                          alt: 'bonnet house' },
  { photoId: 'img-1759445607694-ttu2dfiun', expectedCurrentVenueId: '8',  correctVenueId: '20',  intendedVenue: 'Briza on the Bay',                                       alt: 'briza' },
  { photoId: 'img-1759445645982-sa7licmps', expectedCurrentVenueId: '9',  correctVenueId: '94',  intendedVenue: "Bud N' Mary's Marina 'The Barn'",                        alt: 'bud-n-marys' },
  { photoId: 'img-1759445654343-zx0rfc1bs', expectedCurrentVenueId: '9',  correctVenueId: '94',  intendedVenue: "Bud N' Mary's Marina 'The Barn'",                        alt: 'bud-and-marys' },
  { photoId: 'img-1759445681846-hgpp2kchm', expectedCurrentVenueId: '10', correctVenueId: '60',  intendedVenue: 'Canopy by Hilton West Palm Beach',                       alt: 'canopy' },
  { photoId: 'img-1759445713664-73a3tns4m', expectedCurrentVenueId: '11', correctVenueId: '104', intendedVenue: 'Casa Marina Key West, Curio Collection by Hilton',       alt: 'casa-marina' },
  { photoId: 'img-1759445736664-yczwo179f', expectedCurrentVenueId: '12', correctVenueId: '90',  intendedVenue: 'Cheeca Lodge & Spa',                                     alt: 'checca-1' },
  { photoId: 'img-1759445743846-bdmdi4965', expectedCurrentVenueId: '12', correctVenueId: '90',  intendedVenue: 'Cheeca Lodge & Spa',                                     alt: 'checca-2' },
  { photoId: 'img-1759445764146-vm4ylqxs5', expectedCurrentVenueId: '13', correctVenueId: '8',   intendedVenue: 'Coastal Yacht Charters',                                 alt: 'coastal' },
];

async function main() {
  console.log(`fix-venue-photo-mappings running in ${COMMIT ? 'COMMIT' : 'DRY-RUN'} mode\n`);

  const photoIds = PHOTO_FIXES.map((f) => f.photoId);
  const { data: rows, error } = await supabase
    .from('venue_photos')
    .select('id, venue_id, alt')
    .in('id', photoIds);
  if (error || !rows) {
    console.error('Could not fetch venue_photos:', error?.message);
    process.exit(1);
  }
  const byId = new Map<string, any>();
  for (const r of rows) byId.set(r.id, r);

  type Plan = PhotoFix & { actual: string; status: 'apply' | 'skip-already-correct' | 'skip-mismatch' | 'skip-missing' };
  const plan: Plan[] = PHOTO_FIXES.map((f) => {
    const r = byId.get(f.photoId);
    if (!r) return { ...f, actual: '(missing)', status: 'skip-missing' };
    if (String(r.venue_id) === f.correctVenueId) return { ...f, actual: String(r.venue_id), status: 'skip-already-correct' };
    if (String(r.venue_id) !== f.expectedCurrentVenueId) return { ...f, actual: String(r.venue_id), status: 'skip-mismatch' };
    return { ...f, actual: String(r.venue_id), status: 'apply' };
  });

  const toApply = plan.filter((p) => p.status === 'apply');
  const skipped = plan.filter((p) => p.status !== 'apply');

  console.log(`Plan: ${toApply.length} updates / ${skipped.length} skipped\n`);
  for (const p of plan) {
    const tag =
      p.status === 'apply' ? '✓' :
      p.status === 'skip-already-correct' ? '·' :
      '!';
    console.log(`  ${tag}  vid ${p.actual.padStart(4)} -> ${p.correctVenueId.padEnd(4)}  ${p.alt.padEnd(30)} (${p.intendedVenue})`);
    if (p.status === 'skip-mismatch') {
      console.log(`        skipped: expected current=${p.expectedCurrentVenueId}, found=${p.actual}`);
    } else if (p.status === 'skip-already-correct') {
      console.log(`        already at correct value`);
    } else if (p.status === 'skip-missing') {
      console.log(`        skipped: photo_id not found in venue_photos`);
    }
  }

  if (!COMMIT) {
    console.log('\nDry run. Re-run with --commit to apply.');
    return;
  }

  for (const p of toApply) {
    const { error: updErr } = await supabase
      .from('venue_photos')
      .update({ venue_id: p.correctVenueId })
      .eq('id', p.photoId);
    if (updErr) {
      console.error(`  FAILED ${p.photoId}: ${updErr.message}`);
      process.exit(1);
    }
    console.log(`  updated ${p.photoId} → venue_id=${p.correctVenueId} (${p.intendedVenue})`);
  }
  console.log(`\nDone. ${toApply.length} rows updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
