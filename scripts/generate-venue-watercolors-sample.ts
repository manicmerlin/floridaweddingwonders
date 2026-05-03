/* eslint-disable no-console */
//
// Path A sample run — watercolor placeholder illustrations for 5 venues
// spanning the venue_type taxonomy. Pure preview: generates, uploads to
// Supabase blog-images/placeholders/venues/<slug>.png, returns URLs.
// Does NOT touch the venues table or wire anything into the live site.
//
// Run:
//   export OPENAI_API_KEY=...
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npx tsx scripts/generate-venue-watercolors-sample.ts [--dry-run]
//
// Cost: 5 images × 1024×1024 standard = $0.20.

import OpenAI from 'openai';
import { createSupabaseAdminClient } from '../src/lib/supabaseServer';

const STORAGE_BUCKET = 'blog-images';
const DALLE_MODEL = 'dall-e-3';
const DRY_RUN = process.argv.includes('--dry-run');

interface Pick {
  slug: string;
  name: string;
  city: string;
  /** Evocative descriptor for the prompt — replaces the generic venue_type
   *  label with something visually specific. */
  descriptor: string;
  /** Per-venue scene cue ("set in its tropical grove", "framed by oak trees"). */
  setting: string;
}

// Five picks across the venue_type taxonomy. Descriptors and settings
// pulled from the venues table's description + tags + city, then made
// evocative-not-categorical per the user's instruction.
const PICKS: Pick[] = [
  {
    slug: 'cheeca-lodge-and-spa-islamorada',
    name: "Cheeca Lodge & Spa",
    city: 'Islamorada',
    descriptor: 'iconic Florida Keys oceanfront resort with a pier and palm-lined beach',
    setting: 'set along the Atlantic with the pier extending into calm turquoise water and coconut palms framing the foreground',
  },
  {
    slug: 'hialeah-park-racing-and-casino-hialeah',
    name: 'Hialeah Park Racing & Casino',
    city: 'Hialeah',
    descriptor: '1920s Mediterranean revival landmark with flamingo lagoons and grand terraces',
    setting: 'with the iconic terra-cotta roofline, rose-colored archways, and a flamingo lagoon visible in the foreground',
  },
  {
    slug: 'fairchild-tropical-botanic-garden-coral-gables',
    name: 'Fairchild Tropical Botanic Garden',
    city: 'Coral Gables',
    descriptor: 'world-renowned tropical botanic garden with reflecting ponds and exotic flora',
    setting: 'set among lush palms, flowering trees, and a quiet reflecting pond with lily pads',
  },
  {
    slug: 'coral-gables-country-club-coral-gables',
    name: 'Coral Gables Country Club',
    city: 'Coral Gables',
    descriptor: 'classic Mediterranean revival country club with arched loggias',
    setting: 'with manicured lawns, a curving driveway, and tall royal palms framing the entrance',
  },
  {
    slug: 'ever-after-farms-tropical-grove-barn-homestead',
    name: 'Ever After Farms Tropical Grove Barn',
    city: 'Homestead',
    descriptor: 'rustic agricultural barn nestled inside a tropical fruit grove',
    setting: 'set among rows of mango and avocado trees with weathered wood siding and a pitched metal roof',
  },
];

const STYLE_ANCHOR =
  'Hand-painted vintage cartographic watercolor illustration. Loose ink linework with visible brushstrokes. ' +
  'Soft watercolor washes in dusty pastels — sage green, peach, dusty rose, cream, muted ochre. ' +
  'Aged cream paper texture with subtle paper grain. Editorial illustration in the style of a bespoke wedding ' +
  'invitation suite or vintage tourist map. Three-quarter architectural view of the building set in its landscape. ' +
  'NO photorealism, NO digital cleanness, NO cartoon style, NO clip-art. NO people, NO text, NO signs, NO logos, ' +
  'NO readable lettering of any kind.';

function buildPrompt(p: Pick): string {
  return (
    `Watercolor and ink illustration of ${p.name}, a ${p.descriptor} in ${p.city}, Florida — ` +
    `${p.setting}. ${STYLE_ANCHOR}`
  );
}

async function main() {
  const required = ['OPENAI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const k of required) {
    if (!process.env[k]) { console.error(`Missing ${k}`); process.exit(1); }
  }

  console.log(`generate-venue-watercolors-sample running in ${DRY_RUN ? 'DRY-RUN' : 'COMMIT'} mode`);
  console.log(`Generating ${PICKS.length} watercolor placeholders at 1024×1024 ($0.04 each → $${(PICKS.length * 4 / 100).toFixed(2)} max)\n`);

  const openai = DRY_RUN ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const admin = DRY_RUN ? null : createSupabaseAdminClient();

  const out: Array<{ slug: string; name: string; url?: string; error?: string }> = [];
  let cents = 0;

  for (const pick of PICKS) {
    const prompt = buildPrompt(pick);
    console.log(`▶  ${pick.slug}`);
    console.log(`   prompt: ${prompt.slice(0, 160)}…`);

    if (DRY_RUN) {
      out.push({ slug: pick.slug, name: pick.name });
      continue;
    }

    try {
      const result = await openai!.images.generate({
        model: DALLE_MODEL,
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid',
        response_format: 'url',
      });
      const url = result.data?.[0]?.url;
      if (!url) throw new Error('OpenAI returned no image URL');
      const fetched = await fetch(url);
      if (!fetched.ok) throw new Error(`image fetch ${fetched.status}`);
      const bytes = Buffer.from(await fetched.arrayBuffer());
      const path = `placeholders/venues/${pick.slug}.png`;
      const { error: upErr } = await admin!.storage
        .from(STORAGE_BUCKET)
        .upload(path, bytes, { contentType: 'image/png', upsert: true });
      if (upErr) throw new Error(`upload: ${upErr.message}`);
      const { data: pub } = admin!.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      const publicUrl = pub?.publicUrl;
      if (!publicUrl) throw new Error('getPublicUrl empty');
      cents += 4;
      console.log(`✓  ${pick.slug}: ${publicUrl}`);
      out.push({ slug: pick.slug, name: pick.name, url: publicUrl });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`✗  ${pick.slug}: ${msg}`);
      out.push({ slug: pick.slug, name: pick.name, error: msg });
    }
  }

  console.log(`\n--- summary ---`);
  console.log(`Generated:  ${out.filter(r => r.url).length}/${out.length}`);
  console.log(`Total cost: $${(cents / 100).toFixed(2)}`);
  console.log(`\n--- venue + URL pairs ---`);
  for (const r of out) {
    if (r.url) console.log(`${r.name}\n  ${r.url}`);
    else console.log(`${r.name}\n  ERROR: ${r.error}`);
  }
}

main().catch(e => { console.error('failed:', e); process.exit(1); });
