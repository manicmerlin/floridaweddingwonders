/* eslint-disable no-console */
//
// scripts/seed-reviews.ts
//
// Generates 5-10 plausible 'pending' reviews per top 20 venues to kickstart
// social proof. The author still has to APPROVE each one in /admin/reviews
// before it's publicly visible — this script ONLY writes pending rows.
//
// **DO NOT RUN UNTIL THE SEED STRATEGY IS REVIEWED.** The plan is on the PR.
//
// Strategy (decided in Phase 4):
//   1. Pick the top 20 venues by tier (scale > growth > starter; ties → name).
//   2. For each venue, generate `Math.floor(Math.random() * 6) + 5` reviews
//      (i.e. 5-10).
//   3. Each review draws from a pool of human-written templates with
//      light variable substitution (venue name, season, food, ceremony spot).
//      The pool is intentionally small (12 templates) and randomized so a
//      reader scanning the site never sees two identical reviews back-to-back.
//   4. Ratings: 80% chance 5★, 15% chance 4★, 5% chance 3★. No 1-2★ in seed
//      — kickstart should be positive but believable.
//   5. Names: pulled from a small US wedding-couple-name pool, paired with a
//      random first/last combo. Email is left NULL.
//   6. Wedding date: random date in the last 24 months.
//
// Run with:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npx tsx scripts/seed-reviews.ts [--commit]
//
// Without `--commit`, runs in dry-run mode and prints what it would write.

import { createClient } from '@supabase/supabase-js';

const COMMIT = process.argv.includes('--commit');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// ---------------------------------------------------------------------------
// Templates — written by hand to read like a real couple
// ---------------------------------------------------------------------------

const TEMPLATES: string[] = [
  `We had our wedding at {venueName} in {season} {year} and it could not have gone better. The team coordinated everything from rehearsal through the last dance. Guests are STILL talking about the {detail}.`,
  `Booking {venueName} was the best decision we made for our wedding. Their event coordinator answered every question (and we had a lot), the venue itself photographed beautifully, and the {detail} was exactly what we wanted.`,
  `If you're touring venues in the area, put {venueName} on the list. We compared three other places before booking here and the value was significantly better — you get a real coordinator, not just a space.`,
  `{venueName} delivered. The {detail} was magical. The day-of coordinator handled every vendor handoff so we could just enjoy the wedding. Would 100% book again.`,
  `Our families are spread across the country and we needed somewhere everyone could enjoy. {venueName} nailed the brief — easy access, beautiful photos, food that everyone (including the picky eaters) raved about.`,
  `What we appreciated most was how transparent the pricing was. No surprise fees, no upsells the week of. The {detail} was as advertised, the staff was warm, and our timeline ran on schedule.`,
  `We had ${'{guestCount}'} guests and the room felt full but not crowded. The team has clearly done this many times — they handled cocktail-hour weather contingency without us even noticing.`,
  `Genuinely incredible. {venueName} made our wedding feel personal even though they host events constantly. The {detail} sealed it for us during our tour and the day itself exceeded those expectations.`,
  `Pros: gorgeous setting, attentive coordinator, food was excellent. Honest minor con: parking takes some thinking on weekends — plan a shuttle or include guidance in your invites. Worth it overall.`,
  `Booked here partially for the {detail}. Glad we did. The coordinator pre-meets to walk you through the day and the kitchen handled our dietary requests without batting an eye.`,
  `If you're a couple who doesn't want to micromanage, {venueName} is for you. We told them what we wanted and they delivered. Photos came back gorgeous. Guests have asked us where it was.`,
  `Truly a special venue. The {detail} alone is worth the visit. Our coordinator went above and beyond — last-minute timeline shuffle, no problem. Highly recommend.`,
];

// Per-venue-type detail pools. Each phrase is a noun phrase that fits the
// templates' "the {detail}" / "for the {detail}" / "the {detail} was magical"
// patterns. A 5-star Hialeah Park review should NOT mention "sunset terrace";
// a beach venue review should NOT mention "restored woodwork". Picking from
// the type-correct pool is what makes seed reviews read as plausibly real.
const DETAILS_BY_TYPE: Record<string, string[]> = {
  beach: [
    'oceanfront ceremony spot',
    'sand-aisle setup',
    'sunset cocktail hour on the water',
    'beachfront bar service',
    'tiki-torch reception lighting',
    'open-air pavilion overlooking the gulf',
    'driftwood ceremony arch',
    'shoreline cocktail terrace',
  ],
  garden: [
    'mature-tree canopy over the ceremony',
    'manicured lawn for the reception',
    'orchid-filled greenhouse moment',
    'fountain-side cocktail area',
    'rose garden ceremony spot',
    'open-air dinner under string lights',
    'topiary-lined cocktail walk',
    'garden pavilion reception',
  ],
  ballroom: [
    'chandelier-lit reception',
    'plated dinner service',
    'dance floor lighting',
    'grand staircase entrance',
    'multi-room flow from cocktail to dinner',
    'climate-controlled ballroom space',
    'mezzanine cocktail layout',
    'champagne toast under the chandeliers',
  ],
  historic: [
    'original 1920s architecture',
    'restored ballroom',
    'period chandelier lighting',
    'grand-staircase first-look photos',
    'wraparound veranda for cocktail hour',
    'museum-quality interior detail',
    'gilded ceiling in the reception room',
    'historic courtyard ceremony',
  ],
  modern: [
    'floor-to-ceiling glass walls',
    'rooftop city views',
    'gallery-style cocktail space',
    'minimalist concrete floors',
    'open-loft reception layout',
    'sculptural lighting in the main room',
    'industrial-chic exposed beams',
    'skyline backdrop for the first dance',
  ],
  rustic: [
    'barn ceremony space',
    'string-light canopy over the dance floor',
    'farm-table family-style dinner',
    'hay-bale ceremony seating',
    'fire-pit cocktail hour',
    'open-air pavilion under the oaks',
    'horse-stable cocktail backdrop',
    'reclaimed-wood reception bar',
  ],
};

const FALLBACK_DETAILS = [
  'reception layout',
  'cocktail hour flow',
  'dinner service',
  'getting-ready suites',
];

const SEASONS = ['spring', 'summer', 'fall', 'winter'];

const FIRST_NAMES = [
  'Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia',
  'Harper', 'Evelyn', 'Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William',
  'Benjamin', 'Lucas', 'Henry', 'Alexander', 'Maria', 'Sofia', 'Camila', 'Lucia',
  'Diego', 'Mateo', 'Carlos', 'Gabriel',
];
const LAST_NAMES = [
  'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson',
  'Thompson', 'Reyes', 'Pereira', 'Nguyen', 'Patel', 'Cohen', 'Klein',
  'Anderson', 'Taylor', 'Wright', 'Robinson',
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomReviewerName(): string {
  return `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
}

function randomRating(): number {
  const r = Math.random();
  if (r < 0.05) return 3;
  if (r < 0.20) return 4;
  return 5;
}

function randomWeddingDate(): string {
  const now = Date.now();
  const monthsBack = Math.floor(Math.random() * 24);
  const d = new Date(now - monthsBack * 30 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

interface SeedReviewRow {
  venue_id: string;
  reviewer_name: string;
  reviewer_email: null;
  rating: number;
  title: string | null;
  body: string;
  wedding_date: string;
  status: 'pending';
  /** Phase 6: is_seeded flag so admin moderation can bulk-approve in one
   *  click via /api/admin/reviews/bulk-approve-seeded. The 147 existing
   *  rows from the Phase 4 seed run were backfilled to is_seeded=true via
   *  database/reviews-seed-marker-schema.sql. */
  is_seeded: true;
}

function detailsForType(venueType: string | null | undefined): string[] {
  if (venueType && DETAILS_BY_TYPE[venueType]) return DETAILS_BY_TYPE[venueType];
  return FALLBACK_DETAILS;
}

function buildReviewsForVenue(venue: {
  id: string;
  name: string;
  venueType: string | null;
}): SeedReviewRow[] {
  const count = Math.floor(Math.random() * 6) + 5; // 5-10
  const out: SeedReviewRow[] = [];
  const templatesUsedThisVenue = new Set<number>();
  const detailPool = detailsForType(venue.venueType);
  const detailsUsedThisVenue = new Set<string>();

  for (let i = 0; i < count; i++) {
    // Avoid reusing the same template within one venue's seed batch.
    let templateIdx = Math.floor(Math.random() * TEMPLATES.length);
    let attempts = 0;
    while (templatesUsedThisVenue.has(templateIdx) && attempts < 10) {
      templateIdx = Math.floor(Math.random() * TEMPLATES.length);
      attempts++;
    }
    templatesUsedThisVenue.add(templateIdx);

    // Same de-dupe for details — the small per-type pools mean repetition is
    // visible to readers, so prefer a fresh phrase when the pool isn't tapped.
    let detail = randomChoice(detailPool);
    let detailAttempts = 0;
    while (detailsUsedThisVenue.has(detail) && detailAttempts < 8) {
      detail = randomChoice(detailPool);
      detailAttempts++;
    }
    detailsUsedThisVenue.add(detail);

    const year = 2024 + Math.floor(Math.random() * 2);
    const guestCount = String(Math.floor(Math.random() * 150) + 60);

    const body = renderTemplate(TEMPLATES[templateIdx], {
      venueName: venue.name,
      detail,
      season: randomChoice(SEASONS),
      year: String(year),
      guestCount,
    });

    out.push({
      venue_id: venue.id,
      reviewer_name: randomReviewerName(),
      reviewer_email: null,
      rating: randomRating(),
      title: null,
      body,
      wedding_date: randomWeddingDate(),
      status: 'pending',
      is_seeded: true,
    });
  }
  return out;
}

async function main() {
  console.log(`seed-reviews running in ${COMMIT ? 'COMMIT' : 'DRY-RUN'} mode`);

  // Top 20 venues by tier — same ordering as the public listing. We fetch
  // venue_type so per-type detail pools land plausibly (no "sunset terrace"
  // for a historic ballroom).
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, tier, venue_type')
    .order('tier', { ascending: true })
    .order('name', { ascending: true })
    .limit(20);

  if (error || !venues) {
    console.error('Could not fetch venues:', error?.message);
    process.exit(1);
  }

  const allRows: SeedReviewRow[] = [];
  for (const v of venues) {
    const rows = buildReviewsForVenue({
      id: v.id,
      name: v.name,
      venueType: v.venue_type,
    });
    allRows.push(...rows);
    console.log(`  ${v.name} [${v.venue_type ?? '?'}]: ${rows.length} reviews queued`);
  }

  console.log(`\nTotal rows to write: ${allRows.length}`);

  if (!COMMIT) {
    console.log('\nDry run. Sample row:');
    console.log(JSON.stringify(allRows[0], null, 2));
    console.log('\nRe-run with --commit to insert.');
    return;
  }

  // Insert in chunks of 50 to stay well under any payload limit.
  const CHUNK = 50;
  for (let i = 0; i < allRows.length; i += CHUNK) {
    const chunk = allRows.slice(i, i + CHUNK);
    const { error: insErr } = await supabase.from('venue_reviews').insert(chunk);
    if (insErr) {
      console.error(`Chunk ${i / CHUNK + 1} failed:`, insErr.message);
      process.exit(1);
    }
    console.log(`  inserted chunk ${i / CHUNK + 1} (${chunk.length} rows)`);
  }

  console.log(`\nDone. ${allRows.length} pending reviews are queued for moderation at /admin/reviews.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
