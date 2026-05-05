// Generate watercolor placeholders for the 73 Tier 1 statewide venues
// (NE Florida + Central Florida + Panhandle). Reuses the per-venue_type
// architectural anchor prompts from regen-venue-watercolors-v2.ts.
//
// Run:
//   export OPENAI_API_KEY=sk-...
//   npx tsx scripts/generate-tier1-statewide-watercolors.ts [--dry-run] [--skip-slugs=a,b,c]

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '/Users/bennettbonta/SoFloWeddingVenues/.env.production' });
config({ path: '.env.local', override: true });

const STORAGE_BUCKET = 'blog-images';
const PER_CALL_DELAY_MS = 12_000;
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_SLUGS = new Set<string>(
  (process.argv.find((a) => a.startsWith('--skip-slugs='))?.slice('--skip-slugs='.length) ?? '')
    .split(',')
    .filter(Boolean)
);

// All 73 Tier 1 statewide slugs from the bulk insert.
const NEW_VENUE_SLUGS = [
  // St. Augustine (10)
  'the-treasury-on-the-plaza-st-augustine',
  'the-white-room-st-augustine',
  'lightner-museum-st-augustine',
  'markland-house-at-flagler-college-st-augustine',
  'ximenez-fatio-house-museum-st-augustine',
  'pena-peck-house-st-augustine',
  '9-aviles-st-augustine',
  'the-kenwood-inn-st-augustine',
  'bliss-by-the-sea-crescent-beach',
  'ocean-sands-beach-boutique-inn-vilano-beach',
  // Jacksonville / Ponte Vedra / Amelia (15)
  'the-cummer-museum-of-art-and-gardens-jacksonville',
  'brick-and-beam-jacksonville',
  'the-glass-factory-jacksonville',
  'garden-club-of-jacksonville-jacksonville',
  'the-ribault-club-jacksonville',
  'casa-marina-hotel-and-restaurant-jacksonville-beach',
  'private-131-jacksonville-beach',
  'aqua-grill-ponte-vedra-beach',
  'south-ponte-vedra-ocean-club-ponte-vedra-beach',
  'bagby-properties-oceanfront-wedding-homes-ponte-vedra-beach',
  'hoyt-house-fernandina-beach',
  'amelia-island-williams-house-fernandina-beach',
  'florida-house-inn-fernandina-beach',
  'the-lesesne-house-fernandina-beach',
  'the-ocean-club-of-amelia-amelia-island',
  // Orlando / LBV / Apopka / Winter Garden (9)
  'dr-phillips-house-orlando',
  '1010-west-orlando',
  'd-space-orlando-orlando',
  'the-acre-orlando-orlando',
  'paradise-cove-lake-buena-vista',
  'the-highland-manor-apopka',
  'club-lake-venue-apopka',
  'hidden-barn-venue-apopka',
  'heller-hall-winter-garden',
  // Winter Park / Mount Dora / Sanford / Kissimmee (17)
  'casa-feliz-historic-home-museum-winter-park',
  'the-capen-house-winter-park',
  'azalea-lodge-at-mead-botanical-garden-winter-park',
  'chapel-and-cellar-winter-park',
  'knowles-memorial-chapel-at-rollins-college-winter-park',
  'sydonie-mansion-mount-dora',
  'lakeside-inn-mount-dora',
  'mount-dora-yacht-club-mount-dora',
  'pegasus-manor-mount-dora',
  '520-on-the-water-sanford',
  'historic-venue-1902-sanford',
  'sanford-galleon-sanford',
  'the-barn-at-hidden-oaks-farm-lake-mary',
  'pioneer-village-at-shingle-creek-kissimmee',
  'wanderlust-okto-orlando',
  'dockside-lake-nona-orlando',
  'lavender-on-the-lake-st-cloud',
  // 30A / Destin (14)
  'watercolor-inn-santa-rosa-beach',
  'the-pearl-hotel-rosemary-beach',
  'the-court-at-seaside-seaside',
  'bud-and-alleys-waterfront-restaurant-seaside',
  'lyceum-lawn-at-seaside-seaside',
  'the-chapel-at-seaside-seaside',
  'vue-on-30a-santa-rosa-beach',
  'hibiscus-coffee-and-guesthouse-santa-rosa-beach',
  'monet-monet-santa-rosa-beach',
  'eden-gardens-state-park-santa-rosa-beach',
  'camp-helen-state-park-inlet-beach',
  'old-florida-fish-house-santa-rosa-beach',
  'henderson-park-inn-destin',
  'marina-cafe-destin',
  // Pensacola / Apalachicola (8)
  'the-sanctuary-1905-pensacola',
  '511-palafox-pensacola',
  'palafox-wharf-waterfront-pensacola',
  'long-hollow-creatives-pensacola',
  'pier-suite-events-pensacola-beach',
  'the-gibson-inn-apalachicola',
  'coombs-inn-and-suites-apalachicola',
  'sunscape-and-seascape-cape-san-blas',
];

const TYPE_ANCHOR: Record<string, string> = {
  beach:    'exterior of an oceanfront wedding resort with palm trees, sand, and an ocean horizon, in daylight',
  historic: 'exterior three-quarter view of a historic Florida estate or mansion with detailed architectural ornament (tile roof, arched windows, columns)',
  garden:   'lush tropical garden venue with a stone gazebo, pergola, or floral arbor at center',
  ballroom: 'interior of a grand ballroom with chandeliers, tall windows, and round tables set for a wedding reception',
  modern:   'exterior three-quarter view of a contemporary glass-and-steel waterfront wedding venue, late-afternoon light',
  rustic:   'wooden Florida barn or farmhouse strung with warm string lights, set on a grassy field with palms or a fruit grove in the background',
};
const FALLBACK_ANCHOR = 'exterior three-quarter view of a Florida wedding venue building set in its landscape';

function buildPrompt(venue: { name: string; venue_type: string | null; city: string | null }): string {
  const anchor = (venue.venue_type && TYPE_ANCHOR[venue.venue_type]) ?? FALLBACK_ANCHOR;
  const cityBit = venue.city ? ` in ${venue.city}, Florida` : ' in Florida';
  return (
    `Watercolor and ink illustration of ${venue.name}, a wedding venue${cityBit}. ` +
    `Composition: ${anchor}. Show the building or venue itself, not symbolic objects ` +
    `like wedding rings, bouquets, or close-up details. Hand-painted vintage cartographic ` +
    `style with loose ink linework, soft pastel watercolor washes in muted earth tones, ` +
    `cream-paper texture background, editorial illustration. No people, no text, no ` +
    `signage with readable letters, no logos, no captions, no labels.`
  );
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateOne(openai: OpenAI, supabase: any, venue: any) {
  const prompt = buildPrompt(venue);
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const res = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        size: '1024x1024',
        n: 1,
        style: 'vivid',
        response_format: 'b64_json',
      });
      const b64 = res.data?.[0]?.b64_json;
      if (!b64) throw new Error('no image returned');
      const buffer = Buffer.from(b64, 'base64');
      const key = `placeholders/venues/${venue.slug}.png`;
      if (DRY_RUN) {
        console.log(`[dry-run] would upload ${key}`);
        return;
      }
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(key, buffer, {
        contentType: 'image/png',
        upsert: true,
      });
      if (error) throw new Error(`upload failed: ${error.message}`);
      return;
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      const status = e?.status ?? 0;
      if (attempt < 3 && (status === 429 || (status >= 500 && status < 600) || /network|timeout|fetch/i.test(msg))) {
        const backoff = 30_000 * attempt;
        console.warn(`  attempt ${attempt} failed (${status} ${msg.slice(0, 60)}) — sleeping ${backoff / 1000}s`);
        await sleep(backoff);
        continue;
      }
      throw e;
    }
  }
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY');
    process.exit(1);
  }
  const openai = new OpenAI({ apiKey });

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const slugsToProcess = NEW_VENUE_SLUGS.filter((s) => !SKIP_SLUGS.has(s));
  console.log(`Generating ${slugsToProcess.length} watercolors (skipped ${SKIP_SLUGS.size}).`);

  const { data: venues, error } = await supabase
    .from('venues')
    .select('slug, name, venue_type, city')
    .in('slug', slugsToProcess);

  if (error) {
    console.error('Failed to load venues:', error);
    process.exit(1);
  }

  const failures: { slug: string; error: string }[] = [];
  let succeeded = 0;
  for (let i = 0; i < (venues ?? []).length; i++) {
    const v = venues![i];
    console.log(`[${i + 1}/${venues!.length}] ${v.slug} (${v.venue_type})`);
    try {
      await generateOne(openai, supabase, v);
      succeeded++;
      console.log(`  ✓ uploaded`);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      failures.push({ slug: v.slug, error: msg });
      console.error(`  ✗ ${msg}`);
    }
    if (i < venues!.length - 1) {
      await sleep(PER_CALL_DELAY_MS);
    }
  }

  console.log(`\nDone. ${succeeded}/${venues!.length} succeeded, ${failures.length} failed.`);
  if (failures.length > 0) {
    console.log('Failures:');
    for (const f of failures) console.log(`  ${f.slug}: ${f.error}`);
  }
  console.log(`Estimated cost: ~$${(succeeded * 0.04).toFixed(2)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
