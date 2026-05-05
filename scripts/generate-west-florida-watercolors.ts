// Generate watercolor placeholders for the 28 newly-inserted West Florida
// venues. Reuses the per-venue_type architectural anchor prompts from
// regen-venue-watercolors-v2.ts. Runs sequentially with 12s spacing +
// retry/backoff on 429/5xx/network. ~$1.12 total at $0.04/image (DALL-E 3
// standard 1024×1024).
//
// Run:
//   npx tsx scripts/generate-west-florida-watercolors.ts [--dry-run] [--skip-slugs=a,b,c]

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

// New venue slugs from the bulk insert (28 total).
const NEW_VENUE_SLUGS = [
  'the-birchwood-st-petersburg',
  'nova-535-unique-event-space-st-petersburg',
  'davis-islands-garden-club-tampa',
  'bilmar-beach-resort-treasure-island',
  'harborside-chapel-safety-harbor',
  'marie-selby-botanical-gardens-sarasota',
  'sarasota-garden-club-sarasota',
  'mar-vista-dockside-restaurant-pub-longboat-key',
  'pier-22-bradenton',
  'the-bishop-museum-of-science-and-nature-bradenton',
  'evergrove-estate-sarasota',
  'anna-maria-island-inn-bradenton-beach',
  'sandbar-restaurant-anna-maria',
  'beach-house-waterfront-restaurant-bradenton-beach',
  'the-sunset-by-gulf-drive-cafe-bradenton-beach',
  'bali-hai-beach-resort-holmes-beach',
  'the-heitman-house-fort-myers',
  'the-tree-house-fort-myers',
  'edison-and-ford-winter-estates-fort-myers',
  'the-veranda-fort-myers',
  'rumrunners-cape-coral',
  'sanibel-community-house-sanibel',
  'tween-waters-island-resort-spa-captiva',
  'historic-palm-cottage-naples',
  'the-escalante-hotel-naples',
  'bella-vista-ranch-naples',
  'shangri-la-springs-bonita-springs',
  'sola-gratia-estate-marco-island',
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
        console.log(`[dry-run] would upload ${key} (${buffer.length} bytes)`);
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
