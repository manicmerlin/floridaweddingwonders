// Generate watercolor placeholders for the 24 Tier 2 dress shops. Reuses
// the 8 interior archetype scenes from regen-dress-shop-watercolors-v2.ts
// hash-assigned by slug for determinism.
//
//   export OPENAI_API_KEY=sk-...
//   npx tsx scripts/generate-tier2-shop-watercolors.ts

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '/Users/bennettbonta/SoFloWeddingVenues/.env.production' });
config({ path: '.env.local', override: true });

const STORAGE_BUCKET = 'blog-images';
const PER_CALL_DELAY_MS = 12_000;

const NEW_SHOP_SLUGS = [
  'ivory-and-lace-bridal-boutique-tampa', 'isabel-oneil-bridal-collection-tampa', 'the-dressing-room-st-petersburg', 'ab2b-boutique-clearwater',
  'calvet-couture-bridal-sarasota', 'the-perfect-dress-of-sarasota-sarasota', 'tie-the-knot-boutique-bradenton', 'something-blue-bridal-boutique-bradenton',
  'palm-bridal-naples', 'loretta-bridal-boutique-bonita-springs', 'pure-bridal-boutique-fort-myers', 'the-white-closet-bridal-fort-myers',
  'tebault-bridal-st-augustine', 'love-a-bridal-boutique-jacksonville-beach', 'curve-bridal-collection-atlantic-beach', 'beauty-within-bridal-fernandina-beach',
  'white-blossom-bridal-orlando', 'maria-del-pilar-bridal-boutique-orlando', 'the-bridal-finery-winter-park', 'ivy-bridal-shop-altamonte-springs',
  'margaret-ellen-bridal-santa-rosa-beach', 'simply-elegant-bridal-fort-walton-beach', 'bridal-suite-pensacola-pensacola', 'amore-bridal-studio-pensacola',
];

// 8 interior archetype scenes for variety. Hash-assigned by slug.
const SCENES = [
  'wide interior view of a bridal boutique with rows of white wedding dresses on dress forms, soft daylight from a tall window, plush cream-colored fitting bench in foreground',
  'three white wedding gowns on dress forms standing in a sunlit boutique, with garlands of pampas grass and dried florals draped overhead',
  'an elegant private fitting room interior with a tufted blush velvet chaise, gold-framed full-length mirror, and a single wedding dress on a hanger to the side',
  'close-up still-life of layered ivory bridal lace, satin ribbon, a pair of pearl drop earrings, and a delicate floral hairpiece arranged on a marble vanity',
  'a curated cathedral-length veil display backlit by a sunny window in a bridal boutique, with crystal hairpieces on velvet trays in the foreground',
  'a celebratory bridal showroom corner with a champagne ice bucket, two coupe glasses, a small vase of fresh peonies, and a fitted wedding dress on a mannequin',
  'a bridal boutique back room with a long satin train of a wedding dress spread elegantly across a vintage wooden floor, soft side-lit by a tall arched window',
  'a tea-tray flat-lay on a marble surface with a bone-china teacup, a small vase of garden roses, lace fabric swatches, and a leather appointment book stamped with a bridal monogram',
];

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildPrompt(shop: { name: string; city: string | null; slug: string }): string {
  const scene = SCENES[djb2(shop.slug) % SCENES.length];
  const cityBit = shop.city ? ` in ${shop.city}, Florida` : '';
  return (
    `Watercolor and ink illustration of ${shop.name}, a bridal boutique${cityBit}. ` +
    `Composition: ${scene}. Hand-painted vintage cartographic style with loose ink linework, ` +
    `soft pastel watercolor washes in muted earth tones (ivory, blush, sage, taupe), ` +
    `cream-paper texture background, editorial illustration. No people, no text, ` +
    `no signage with readable letters, no logos, no captions, no labels, no faces.`
  );
}

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function generateOne(openai: OpenAI, supabase: any, shop: any) {
  const prompt = buildPrompt(shop);
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const res = await openai.images.generate({
        model: 'dall-e-3', prompt, size: '1024x1024', n: 1, style: 'vivid', response_format: 'b64_json',
      });
      const b64 = res.data?.[0]?.b64_json;
      if (!b64) throw new Error('no image');
      const buffer = Buffer.from(b64, 'base64');
      const key = `placeholders/dress-shops/${shop.slug}.png`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(key, buffer, {
        contentType: 'image/png', upsert: true,
      });
      if (error) throw new Error(`upload: ${error.message}`);
      return;
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      const status = e?.status ?? 0;
      if (attempt < 3 && (status === 429 || (status >= 500 && status < 600) || /network|timeout|fetch/i.test(msg))) {
        const backoff = 30_000 * attempt;
        console.warn(`  attempt ${attempt} failed (${status}) — sleep ${backoff / 1000}s`);
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
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

  console.log(`Generating ${NEW_SHOP_SLUGS.length} dress-shop watercolors.`);
  const { data: shops, error } = await supabase
    .from('dress_shops')
    .select('slug, name, city')
    .in('slug', NEW_SHOP_SLUGS);
  if (error) { console.error(error); process.exit(1); }

  const failures: { slug: string; error: string }[] = [];
  let succeeded = 0;
  for (let i = 0; i < (shops ?? []).length; i++) {
    const s = shops![i];
    console.log(`[${i + 1}/${shops!.length}] ${s.slug}`);
    try {
      await generateOne(openai, supabase, s);
      succeeded++;
      console.log('  ✓ uploaded');
    } catch (e: any) {
      failures.push({ slug: s.slug, error: e?.message ?? String(e) });
      console.error(`  ✗ ${e?.message}`);
    }
    if (i < shops!.length - 1) await sleep(PER_CALL_DELAY_MS);
  }

  console.log(`\nDone. ${succeeded}/${shops!.length} succeeded, ${failures.length} failed.`);
  if (failures.length > 0) {
    console.log('Failures:');
    for (const f of failures) console.log(`  ${f.slug}: ${f.error}`);
  }
  console.log(`Estimated cost: ~$${(succeeded * 0.04).toFixed(2)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
