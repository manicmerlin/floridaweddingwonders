/* eslint-disable no-console */
//
// Suit-shop watercolor generation — varied INTERIOR scenes via gpt-image-2.
//
// Mirrors regen-dress-shop-watercolors-v2.ts: 8 archetypes assigned
// deterministically by slug hash, sequential pacing with retry. The scenes
// are male-formalwear focused (no brides, no dresses) so the suit-shop
// directory reads visually distinct from the dress-shop directory.
//
// Run:
//   export OPENAI_API_KEY=...
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npx tsx scripts/regen-suit-shop-watercolors.ts [--dry-run] [--limit=N] [--model=gpt-image-1.5]

import OpenAI from 'openai';
import { createSupabaseAdminClient } from '../src/lib/supabaseServer';

const STORAGE_BUCKET = 'blog-images';
const MODEL = (() => {
  const a = process.argv.find((x) => x.startsWith('--model='));
  return a ? a.slice('--model='.length) : 'gpt-image-1.5';
})();
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = (() => {
  const a = process.argv.find((x) => x.startsWith('--limit='));
  return a ? parseInt(a.slice('--limit='.length), 10) : Infinity;
})();
const PER_CALL_DELAY_MS = 12_000;

const STYLE_TAIL =
  'Watercolor and ink illustration, hand-painted vintage editorial style — loose ' +
  'ink linework, soft pastel watercolor palette with muted earth tones, navy and ' +
  'charcoal accents, cream-paper texture background, painterly. No people\'s faces ' +
  'visible, no readable text or signage, no logos, no captions. Composition should ' +
  'evoke a refined men\'s formalwear atmosphere in a Florida boutique.';

const ARCHETYPES: { id: string; label: string; scene: string }[] = [
  { id: 'A', label: 'wide-interior',     scene: 'Wide interior of an elegant men\'s formalwear boutique. Long racks of suits and tuxedos lined along walls, a leather chesterfield sofa in the foreground, polished hardwood floors, brass fixtures, soft daylight from tall windows.' },
  { id: 'B', label: 'tailor-at-work',    scene: 'A tailor in a vest and shirtsleeves pinning the lapel of a gray suit jacket on a male mannequin, scissors and chalk in a leather tray nearby. Seen from the side, hands and forearms only, no face visible.' },
  { id: 'C', label: 'bowties-cufflinks', scene: 'Macro still life — a row of silk bow ties in navy, burgundy and ivory laid on a marble surface, a small wooden box of mother-of-pearl cufflinks slightly open beside them, a silver collar bar.' },
  { id: 'D', label: 'three-tuxedos',     scene: 'Three black tuxedos on wooden hangers displayed against a paneled wall — one peak-lapel, one shawl-collar, one notch-lapel. A pocket-square fold and a polished black shoe at the base of each.' },
  { id: 'E', label: 'fabric-bolts',      scene: 'A wall-to-ceiling shelf of folded fabric bolts in muted navy, charcoal, taupe and sage, with measuring tapes draped over the edge of an oak counter and a wooden tailor\'s ruler propped diagonally.' },
  { id: 'F', label: 'whiskey-still',     scene: 'A still life on a side table — a tumbler of amber whiskey on a leather coaster, a folded silk pocket square, a vintage pocket watch on a chain, a slim leather notebook. Soft window light from above.' },
  { id: 'G', label: 'fitting-room',      scene: 'A man in a charcoal three-piece suit standing on a small carpeted platform facing a tri-fold mirror in a fitting room, seen from behind only. Brass coat hooks on the side wall, a velvet bench in the corner.' },
  { id: 'H', label: 'pocket-squares',    scene: 'A wooden display rack with a row of folded pocket squares fanned across the top — silk paisley, linen white, navy dot, burgundy floral — and a silver tie clip on the shelf below. Brass-frame mirror in the background.' },
];

function hashSlugToIdx(slug: string, mod: number): number {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) + h + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % mod;
}

function buildPrompt(shop: { name: string; shop_type: string | null; city: string | null }, scene: string): string {
  const cityBit = shop.city ? ` in ${shop.city}, Florida` : ' in Florida';
  const typeBit = shop.shop_type ? `${shop.shop_type.replace('-', ' ')} ` : '';
  return (
    `An interior scene at ${shop.name}, a ${typeBit}men's formalwear boutique${cityBit}. ` +
    `${scene} ${STYLE_TAIL}`
  );
}

interface Shop { slug: string; name: string; shop_type: string | null; city: string | null; }
interface Result { slug: string; name: string; archetypeId: string; publicUrl?: string; error?: string; }

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function generateOne(client: OpenAI, shop: Shop): Promise<Result> {
  const archetype = ARCHETYPES[hashSlugToIdx(shop.slug, ARCHETYPES.length)];
  const prompt = buildPrompt(shop, archetype.scene);
  console.log(`  → ${shop.slug} [${archetype.id}/${archetype.label}]`);

  if (DRY_RUN) {
    console.log(`     PROMPT: ${prompt.slice(0, 140)}…`);
    return { slug: shop.slug, name: shop.name, archetypeId: archetype.id };
  }

  const maxAttempts = 3;
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const resp = await client.images.generate({
        model: MODEL,
        prompt,
        size: '1024x1024',
        n: 1,
        // gpt-image-1 / 1.5 / 2 return base64 by default
      });
      const b64 = (resp.data?.[0] as { b64_json?: string } | undefined)?.b64_json;
      if (!b64) throw new Error('no b64_json in response');
      const buf = Buffer.from(b64, 'base64');

      const supabase = createSupabaseAdminClient();
      const path = `suit-shops/${shop.slug}.png`;
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, buf, { contentType: 'image/png', upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      return { slug: shop.slug, name: shop.name, archetypeId: archetype.id, publicUrl: pub.publicUrl };
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      const retriable = /429|5\d\d|ETIMEDOUT|ECONNRESET|fetch failed/i.test(msg);
      if (attempt >= maxAttempts || !retriable) {
        return { slug: shop.slug, name: shop.name, archetypeId: archetype.id, error: msg };
      }
      const backoff = 5_000 * Math.pow(2, attempt - 1);
      console.log(`     retry ${attempt}/${maxAttempts} in ${backoff}ms (${msg.slice(0, 80)})`);
      await sleep(backoff);
    }
  }
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY required');
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('suit_shops')
    .select('slug, name, shop_type, city')
    .order('slug', { ascending: true })
    .limit(LIMIT === Infinity ? 1000 : LIMIT);
  if (error) throw error;
  const shops = (data ?? []) as Shop[];
  console.log(`Generating watercolors for ${shops.length} suit shops (model=${MODEL}, dry-run=${DRY_RUN})…`);

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const results: Result[] = [];
  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i];
    const r = await generateOne(client, shop);
    results.push(r);
    if (r.error) console.log(`     ✗ ${r.error.slice(0, 100)}`);
    else if (r.publicUrl) console.log(`     ✓ ${r.publicUrl}`);
    if (i < shops.length - 1 && !DRY_RUN) await sleep(PER_CALL_DELAY_MS);
  }

  const ok = results.filter((r) => !r.error).length;
  const fail = results.filter((r) => r.error).length;
  console.log(`\nDone. ${ok} success, ${fail} failed.`);
  if (fail > 0) {
    console.log('\nFailures:');
    results.filter((r) => r.error).forEach((r) => console.log(`  ${r.slug}: ${r.error}`));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
