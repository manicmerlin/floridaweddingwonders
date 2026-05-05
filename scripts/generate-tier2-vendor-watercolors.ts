// Generate watercolor placeholders for the 120 Tier 2 vendors. Reuses
// the per-category archetype prompts from regen-vendor-watercolors.ts —
// the 4 essential categories (planner, photographer, florist, baker)
// each have 1-2 archetype scenes that get hash-assigned by slug.
//
//   export OPENAI_API_KEY=sk-...
//   npx tsx scripts/generate-tier2-vendor-watercolors.ts

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '/Users/bennettbonta/SoFloWeddingVenues/.env.production' });
config({ path: '.env.local', override: true });

const STORAGE_BUCKET = 'blog-images';
const PER_CALL_DELAY_MS = 12_000;

const NEW_VENDOR_SLUGS = [
  // Tampa Bay (20)
  'events-by-lindsay-j-tampa', 'eventfull-weddings-tampa', 'the-olive-tree-weddings-tampa', 'aulen-events-st-petersburg', 'special-moments-event-planning-largo',
  'stills-by-hernan-tampa', 'djamel-photography-tampa', 'carography-studios-tampa', 'alera-weddings-st-petersburg', 'mcneile-photography-st-petersburg',
  'marigold-flower-co-tampa', 'bruce-wayne-florals-st-petersburg', 'arms-of-persephone-floral-design-st-petersburg', 'garden-of-eden-floral-designs-clearwater', 'art-le-fleur-flowers-and-gifts-clearwater',
  'hands-on-sweets-tampa', 'wandering-whisk-bakeshop-pinellas-park', 'the-artistic-whisk-st-petersburg', 'cakes-by-carolynn-st-petersburg', 'lavender-ridge-photography-st-petersburg',
  // Sarasota-Bradenton (20)
  'captivated-by-weddings-sarasota', 'laura-detwiler-events-sarasota', 'precious-moments-events-sarasota', 'karen-and-company-event-planning-bradenton', 'always-special-events-bradenton',
  'sandhill-photography-bradenton', 'love-and-style-photography-sarasota', 'lindsey-white-photography-sarasota', 'photography-by-lisa-e-bradenton', 'jaeger-haus-photography-bradenton',
  'uprooted-rose-sarasota', 'fliorens-sarasota', 'sarasota-fleurs-sarasota', 'blooms-by-the-beach-bradenton-beach', 'eden-floral-creations-bradenton',
  'a-slice-of-heaven-custom-cakes-lakewood-ranch', 'wonder-cake-creations-sarasota', 'paisanos-italian-bakery-sarasota', 'cakes-by-ron-sarasota', 'hometown-desserts-anna-maria',
  // Southwest Florida (20)
  'sbs-weddings-and-events-naples', 'lyane-mor-events-naples', 'amber-jane-weddings-naples', 'lexi-and-co-weddings-and-events-naples', 'florida-wedding-design-cape-coral',
  'luminaire-foto-naples', 'millers-photo-and-film-naples', 'maria-glassford-photography-fort-myers', 'lori-kelly-photography-fort-myers', 'sea-soul-studios-north-fort-myers',
  'jardin-floral-design-naples', 'naples-picasso-flowers-naples', 'suellens-floral-company-cape-coral', 'floral-artistry-of-sanibel-estero', 'madelaine-signature-flowers-bonita-springs',
  'ema-sweets-boutique-cakes-naples', 'sweetified-bakery-marco-island', 'sassy-cakes-of-naples-naples', 'ladycakes-bakery-cape-coral', 'mikkelsens-pastry-shop-naples',
  // Northeast Florida (20)
  'kelsi-elizabeth-events-st-augustine', 'heather-hagin-events-ponte-vedra-beach', 'details-event-design-fernandina-beach', 'lulu-events-co-jacksonville', 'amelia-island-weddings-amelia-island',
  'monarch-studio-st-augustine', 'sarah-hedden-photography-jacksonville', 'lisa-silva-photography-ponte-vedra-beach', 'jensen-bell-photography-amelia-island', 'page-teahan-photography-amelia-island',
  'jade-violet-wedding-floral-st-augustine', 'tula-rose-floral-and-event-design-st-augustine', 'liz-stewart-floral-design-jacksonville-beach', 'the-heirloom-yard-amelia-island', 'fleurs-de-vedra-ponte-vedra-beach',
  'sweet-tiffanys-saint-johns', 'lulis-bakery-st-augustine', 'filigree-cake-design-jacksonville', 'cake-and-cookie-art-by-janine-saint-johns', 'nana-teresas-bake-shop-fernandina-beach',
  // Central Florida (20)
  'blush-by-brandee-gaar-orlando', 'bella-sposa-events-orlando', 'winter-park-wedding-company-winter-park', 'l3-events-sanford', 'yasmen-katrina-events-kissimmee',
  'mary-fosky-photography-orlando', 'jennifer-holly-photography-orlando', 'cherise-takes-pictures-winter-park', 'sierra-ford-photography-mount-dora', 'bonnie-whicher-photography-mount-dora',
  'ashley-jane-photography-sanford', 'dream-designs-florist-orlando', 'bluegrass-chic-floral-orlando', 'bloomed-and-rooted-winter-park', 'atmospheres-of-winter-park-winter-park',
  'claudias-pearl-florist-mount-dora', 'petals-by-design-orlando', 'sprinkles-custom-cakes-winter-park', 'le-petit-sweet-mount-dora', 'linas-cakes-by-design-sanford',
  // Panhandle (20)
  'kiss-the-bride-weddings-miramar-beach', 'the-eventful-planner-destin', 'fancy-events-santa-rosa-beach', 'destin-to-wed-event-planning-destin', 'southern-frills-weddings-and-events-pensacola',
  'pure7-studios-santa-rosa-beach', 'jessie-barksdale-photography-rosemary-beach', 'erika-dame-photography-santa-rosa-beach', 'weddings-by-adina-destin', 'stephen-teekell-photography-port-st-joe',
  'bella-flora-30a-santa-rosa-beach', 'bloom-flower-artistry-seaside', 'couture-florals-and-events-destin', 'fiore-of-pensacola-pensacola', 'sassy-sunflower-apalachicola',
  'bonne-vie-specialty-custom-cakes-santa-rosa-beach', 'sweet-henriettas-inlet-beach', 'sweetly-sisters-santa-rosa-beach', 'wade-cakes-and-weddings-pensacola', 'forgotten-coast-cakes-apalachicola',
];

// Per-category archetype anchors. Two scenes per category for variety —
// chosen by djb2 hash of slug for determinism.
const CATEGORY_SCENES: Record<string, string[]> = {
  planner: [
    'a wedding planner studio table layout with paper sketches, ribbon swatches, and floral mockups arranged on a marble desk in soft natural light',
    'an elegant wedding planning vignette with a leather portfolio open to a hand-drawn timeline, fountain pen, and ribbon-tied invitation suite on a wood table',
  ],
  photographer: [
    'a vintage medium-format camera resting on a stack of leather-bound wedding albums beside an open window with soft afternoon light',
    'a flat-lay of analog film rolls, a contact sheet, and a brass clipboard with a printed wedding ceremony program on a wooden tabletop',
  ],
  florist: [
    'a wedding floral design studio bench with overflowing buckets of garden roses, peonies, and eucalyptus, scissors and ribbon spool nearby in soft window light',
    'a vintage florist worktable with handmade bridal bouquet, scattered foliage clippings, and a watercolor color-palette card under a brass pendant lamp',
  ],
  baker: [
    'a multi-tier white wedding cake on a vintage cake stand with a piping bag, fresh florals scattered around the base, and an antique kitchen scale in soft natural light',
    'a quiet pastry studio counter with a half-decorated wedding cake, hand-piped sugar flowers, and a marble rolling pin beside open recipe pages',
  ],
};

const FALLBACK_SCENE = 'a vintage tabletop wedding-vendor still life with a paper sketch, ribbon, and a single white blossom in muted earth tones';

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildPrompt(vendor: { name: string; category: string | null; city: string | null; slug: string }): string {
  const scenes = (vendor.category && CATEGORY_SCENES[vendor.category]) || [FALLBACK_SCENE];
  const scene = scenes[djb2(vendor.slug) % scenes.length];
  const cityBit = vendor.city ? ` in ${vendor.city}, Florida` : '';
  return (
    `Watercolor and ink illustration of ${vendor.name}, a wedding vendor${cityBit}. ` +
    `Composition: ${scene}. Hand-painted vintage cartographic style with loose ink linework, ` +
    `soft pastel watercolor washes in muted earth tones, cream-paper texture background, ` +
    `editorial illustration. No people, no text, no signage with readable letters, ` +
    `no logos, no captions, no labels, no faces, no hands.`
  );
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateOne(openai: OpenAI, supabase: any, vendor: any) {
  const prompt = buildPrompt(vendor);
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
      const key = `placeholders/vendors/${vendor.slug}.png`;
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
  if (!apiKey) { console.error('Missing OPENAI_API_KEY'); process.exit(1); }
  const openai = new OpenAI({ apiKey });

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  console.log(`Generating ${NEW_VENDOR_SLUGS.length} vendor watercolors.`);

  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('slug, name, category, city')
    .in('slug', NEW_VENDOR_SLUGS);

  if (error) { console.error('Failed to load vendors:', error); process.exit(1); }

  const failures: { slug: string; error: string }[] = [];
  let succeeded = 0;
  for (let i = 0; i < (vendors ?? []).length; i++) {
    const v = vendors![i];
    console.log(`[${i + 1}/${vendors!.length}] ${v.slug} (${v.category})`);
    try {
      await generateOne(openai, supabase, v);
      succeeded++;
      console.log(`  ✓ uploaded`);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      failures.push({ slug: v.slug, error: msg });
      console.error(`  ✗ ${msg}`);
    }
    if (i < vendors!.length - 1) await sleep(PER_CALL_DELAY_MS);
  }

  console.log(`\nDone. ${succeeded}/${vendors!.length} succeeded, ${failures.length} failed.`);
  if (failures.length > 0) {
    console.log('Failures:');
    for (const f of failures) console.log(`  ${f.slug}: ${f.error}`);
  }
  console.log(`Estimated cost: ~$${(succeeded * 0.04).toFixed(2)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
