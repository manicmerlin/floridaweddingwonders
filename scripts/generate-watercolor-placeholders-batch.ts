/* eslint-disable no-console */
//
// Full watercolor placeholder batch — venues + dress shops.
//
// Decision per entry:
//   1. If row.images JSONB has a usable photo URL, restyle it with
//      gpt-image-1 (image-to-image, "Restyle this photograph as a
//      watercolor and ink illustration..."). Preserves the actual
//      building shape/landscape. Cost: medium quality = $0.042/image.
//   2. Otherwise, fall back to text-only DALL-E 3 with the same template
//      we used on the 5 approved samples. Cost: $0.040/image.
//
// Output: Supabase blog-images bucket, paths
//   placeholders/venues/<slug>.png
//   placeholders/dress-shops/<slug>.png
//
// Idempotent: lists each directory once at start and skips any slug whose
// PNG already exists. Re-running fills only the gaps.
//
// Concurrency: BATCH_SIZE in flight at once. Tune via --concurrency=N.
//
// Order: venues run first (priority), tier scale > growth > starter,
// alphabetical within tier — so the highest-value listings complete
// before any budget cap. Dress shops run after venues finish.
//
// Run:
//   export OPENAI_API_KEY=...
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npx tsx scripts/generate-watercolor-placeholders-batch.ts \
//        [--dry-run] [--concurrency=5] [--limit=N] [--venues-only]
//        [--dress-shops-only]

import OpenAI, { APIError } from 'openai';
import { toFile } from 'openai/uploads';
import { createSupabaseAdminClient } from '../src/lib/supabaseServer';

const STORAGE_BUCKET = 'blog-images';
const DRY_RUN = process.argv.includes('--dry-run');
const VENUES_ONLY = process.argv.includes('--venues-only');
const DRESS_ONLY = process.argv.includes('--dress-shops-only');
const CONCURRENCY = (() => {
  const a = process.argv.find((x) => x.startsWith('--concurrency='));
  return a ? Math.max(1, parseInt(a.slice('--concurrency='.length), 10)) : 5;
})();
const LIMIT = (() => {
  const a = process.argv.find((x) => x.startsWith('--limit='));
  return a ? parseInt(a.slice('--limit='.length), 10) : Infinity;
})();

const STYLE_ANCHOR =
  'Hand-painted vintage cartographic watercolor illustration. Loose ink linework with visible brushstrokes. ' +
  'Soft watercolor washes in dusty pastels — sage green, peach, dusty rose, cream, muted ochre. ' +
  'Aged cream paper texture with subtle paper grain. Editorial illustration in the style of a bespoke wedding ' +
  'invitation suite or vintage tourist map. Three-quarter architectural view of the building set in its landscape. ' +
  'NO photorealism, NO digital cleanness, NO cartoon style, NO clip-art. NO people, NO text, NO signs, NO logos, ' +
  'NO readable lettering of any kind.';

const TIER_RANK: Record<string, number> = { scale: 0, growth: 1, starter: 2 };

interface Entry {
  kind: 'venue' | 'dress-shop';
  slug: string;
  name: string;
  city: string | null;
  description: string | null;
  tags: string[];
  type: string | null;
  tier?: string;
  primaryImageUrl: string | null;
}

interface Result {
  slug: string;
  kind: 'venue' | 'dress-shop';
  path: string;
  name: string;
  publicUrl?: string;
  costCents?: number;
  mode?: 'image-edit' | 'text-only';
  skipped?: string;
  error?: string;
}

function pickPrimaryImageUrl(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  const valid = images.filter(
    (x): x is Record<string, unknown> => !!x && typeof x === 'object' && typeof x.url === 'string' && (x.url as string).startsWith('http')
  );
  if (valid.length === 0) return null;
  const primary = valid.find((x) => x.isPrimary === true);
  return String((primary ?? valid[0]).url);
}

function venueDescriptor(e: Entry): string {
  const tagBits = e.tags.slice(0, 3).join(', ');
  const typeBit = e.type ? `${e.type} ` : '';
  return `${typeBit}wedding venue${tagBits ? ` (${tagBits})` : ''}`.trim();
}

function dressShopDescriptor(e: Entry): string {
  const tagBits = e.tags.slice(0, 3).join(', ');
  const typeBit = e.type ? `${e.type} ` : '';
  return `${typeBit}bridal boutique${tagBits ? ` (${tagBits})` : ''}`.trim();
}

function buildTextPrompt(e: Entry): string {
  const descriptor = e.kind === 'venue' ? venueDescriptor(e) : dressShopDescriptor(e);
  const cityBit = e.city ? ` in ${e.city}, Florida` : ' in Florida';
  const descBit = e.description ? ` ${e.description.slice(0, 200)}` : '';
  return `Watercolor and ink illustration of ${e.name}, a ${descriptor}${cityBit}.${descBit} ${STYLE_ANCHOR}`;
}

function buildEditPrompt(e: Entry): string {
  const subject = e.kind === 'venue' ? 'wedding venue' : 'bridal boutique';
  return (
    `Restyle this photograph of ${e.name}, a Florida ${subject}, as a watercolor and ink illustration. ` +
    `Preserve the building's actual shape, layout, and landscape — the architecture must remain recognizable. ` +
    `Replace the photographic medium entirely with hand-painted watercolor. ${STYLE_ANCHOR}`
  );
}

async function loadEntries(admin: ReturnType<typeof createSupabaseAdminClient>): Promise<Entry[]> {
  const out: Entry[] = [];

  if (!DRESS_ONLY) {
    const { data, error } = await admin
      .from('venues')
      .select('slug, name, city, description, tags, venue_type, tier, images');
    if (error) throw new Error(`venues query: ${error.message}`);
    for (const r of data ?? []) {
      out.push({
        kind: 'venue',
        slug: r.slug,
        name: r.name,
        city: r.city,
        description: r.description,
        tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
        type: r.venue_type,
        tier: r.tier,
        primaryImageUrl: pickPrimaryImageUrl(r.images),
      });
    }
  }

  if (!VENUES_ONLY) {
    const { data, error } = await admin
      .from('dress_shops')
      .select('slug, name, city, description, tags, shop_type, images');
    if (error) throw new Error(`dress_shops query: ${error.message}`);
    for (const r of data ?? []) {
      out.push({
        kind: 'dress-shop',
        slug: r.slug,
        name: r.name,
        city: r.city,
        description: r.description,
        tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
        type: r.shop_type,
        primaryImageUrl: pickPrimaryImageUrl(r.images),
      });
    }
  }

  // Sort: venues before dress shops, then by tier (scale > growth > starter
  // for venues; dress-shops keep insertion alpha order from name sort).
  out.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'venue' ? -1 : 1;
    if (a.kind === 'venue') {
      const ta = TIER_RANK[a.tier ?? 'starter'] ?? 2;
      const tb = TIER_RANK[b.tier ?? 'starter'] ?? 2;
      if (ta !== tb) return ta - tb;
    }
    return a.name.localeCompare(b.name);
  });

  return out;
}

async function listExistingSlugs(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  dir: string
): Promise<Set<string>> {
  const { data, error } = await admin.storage.from(STORAGE_BUCKET).list(dir, {
    limit: 1000,
  });
  if (error) {
    console.warn(`list(${dir}): ${error.message} — assuming empty`);
    return new Set();
  }
  const slugs = new Set<string>();
  for (const row of data ?? []) {
    if (row.name?.endsWith('.png')) slugs.add(row.name.replace(/\.png$/, ''));
  }
  return slugs;
}

async function generateOne(
  openai: OpenAI,
  admin: ReturnType<typeof createSupabaseAdminClient>,
  entry: Entry
): Promise<Result> {
  const dir = entry.kind === 'venue' ? 'placeholders/venues' : 'placeholders/dress-shops';
  const path = `${dir}/${entry.slug}.png`;
  const baseResult: Result = { slug: entry.slug, kind: entry.kind, path, name: entry.name };

  // Try image-to-image (gpt-image-1) when we have a usable photo URL.
  if (entry.primaryImageUrl) {
    try {
      const fetched = await fetch(entry.primaryImageUrl);
      if (!fetched.ok) throw new Error(`photo fetch ${fetched.status}`);
      const photoBytes = Buffer.from(await fetched.arrayBuffer());
      // gpt-image-1 accepts PNG/JPEG/WebP. The catalog images are JPEG/PNG
      // already; we forward the raw bytes labeled as PNG. The API tolerates
      // mismatched extensions in practice.
      const file = await toFile(photoBytes, 'photo.png', { type: 'image/png' });
      const editResp = await openai.images.edit({
        model: 'gpt-image-1',
        image: file,
        prompt: buildEditPrompt(entry),
        size: '1024x1024',
        quality: 'medium',
        n: 1,
      });
      const b64 = editResp.data?.[0]?.b64_json;
      if (!b64) throw new Error('gpt-image-1 returned no b64_json');
      const outBytes = Buffer.from(b64, 'base64');
      const { error: upErr } = await admin.storage
        .from(STORAGE_BUCKET)
        .upload(path, outBytes, { contentType: 'image/png', upsert: true });
      if (upErr) throw new Error(`upload: ${upErr.message}`);
      const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      return {
        ...baseResult,
        publicUrl: pub?.publicUrl,
        costCents: 4.2 as unknown as number,
        mode: 'image-edit',
      };
    } catch (e) {
      // Don't kill the whole run on one photo failure. Fall through to
      // text-only — better to ship a watercolor than a placeholder.
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`   ${entry.slug}: image-edit failed (${msg.slice(0, 80)}), falling back to text-only`);
    }
  }

  // Text-only fallback (DALL-E 3).
  const textResp = await openai.images.generate({
    model: 'dall-e-3',
    prompt: buildTextPrompt(entry),
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
    response_format: 'url',
  });
  const url = textResp.data?.[0]?.url;
  if (!url) throw new Error('dall-e-3 returned no URL');
  const fetched = await fetch(url);
  if (!fetched.ok) throw new Error(`dalle fetch ${fetched.status}`);
  const bytes = Buffer.from(await fetched.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, { contentType: 'image/png', upsert: true });
  if (upErr) throw new Error(`upload: ${upErr.message}`);
  const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return {
    ...baseResult,
    publicUrl: pub?.publicUrl,
    costCents: 4,
    mode: 'text-only',
  };
}

async function processBatch(
  openai: OpenAI,
  admin: ReturnType<typeof createSupabaseAdminClient>,
  entries: Entry[]
): Promise<Result[]> {
  const results = await Promise.all(
    entries.map(async (e) => {
      try {
        const r = await generateOne(openai, admin, e);
        const tag = r.mode === 'image-edit' ? '[edit]' : '[text]';
        console.log(`✓  ${tag} ${e.kind}/${e.slug}: ${r.publicUrl}`);
        return r;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const isQuota =
          msg.includes('insufficient_quota') ||
          msg.includes('billing_hard_limit') ||
          (err instanceof APIError && err.status === 429 && /quota|billing/i.test(msg));
        console.log(`✗  ${e.kind}/${e.slug}: ${msg.slice(0, 140)}`);
        return {
          slug: e.slug,
          kind: e.kind,
          name: e.name,
          path: `placeholders/${e.kind === 'venue' ? 'venues' : 'dress-shops'}/${e.slug}.png`,
          error: msg,
          ...(isQuota ? { quota: true } : {}),
        } as Result & { quota?: boolean };
      }
    })
  );
  return results;
}

async function main() {
  const required = ['OPENAI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const k of required) {
    if (!process.env[k]) { console.error(`Missing ${k}`); process.exit(1); }
  }

  console.log(`generate-watercolor-placeholders-batch ${DRY_RUN ? '[DRY-RUN]' : '[COMMIT]'} concurrency=${CONCURRENCY} limit=${LIMIT === Infinity ? '∞' : LIMIT}`);
  if (VENUES_ONLY) console.log('mode: venues-only');
  if (DRESS_ONLY) console.log('mode: dress-shops-only');

  const admin = createSupabaseAdminClient();
  const openai = DRY_RUN ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  console.log('\nLoading entries from DB...');
  const entries = await loadEntries(admin);
  console.log(`  ${entries.filter((e) => e.kind === 'venue').length} venues, ${entries.filter((e) => e.kind === 'dress-shop').length} dress shops`);

  console.log('\nListing existing placeholders...');
  const existingVenues = await listExistingSlugs(admin, 'placeholders/venues');
  const existingDress = await listExistingSlugs(admin, 'placeholders/dress-shops');
  console.log(`  ${existingVenues.size} venue placeholders already in storage`);
  console.log(`  ${existingDress.size} dress-shop placeholders already in storage`);

  const todo = entries.filter((e) => {
    const set = e.kind === 'venue' ? existingVenues : existingDress;
    return !set.has(e.slug);
  }).slice(0, LIMIT);

  console.log(`\n${todo.length} entries to generate (${entries.length - todo.length} will be skipped — already done)`);

  if (DRY_RUN) {
    for (const e of todo) {
      const path = e.primaryImageUrl ? '[edit]' : '[text]';
      console.log(`  ${path} ${e.kind}/${e.slug} :: ${e.name}`);
    }
    return;
  }

  const allResults: Result[] = [];
  let totalCents = 0;
  let stopped = false;

  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const chunk = todo.slice(i, i + CONCURRENCY);
    const chunkResults = await processBatch(openai!, admin, chunk);
    allResults.push(...chunkResults);
    for (const r of chunkResults) {
      if (r.publicUrl && r.costCents) totalCents += r.costCents;
      if ((r as Result & { quota?: boolean }).quota) {
        stopped = true;
        console.log(`\n!! Quota exhausted — stopping batch. Spent ~$${(totalCents / 100).toFixed(2)} so far.`);
        break;
      }
    }
    if (stopped) break;
    console.log(`   progress: ${Math.min(i + CONCURRENCY, todo.length)}/${todo.length} | spent ~$${(totalCents / 100).toFixed(2)}`);
  }

  const ok = allResults.filter((r) => r.publicUrl);
  const failed = allResults.filter((r) => r.error);
  const totalProcessed = ok.length;
  const remaining = todo.length - allResults.length;

  console.log('\n=== summary ===');
  console.log(`Generated:   ${totalProcessed}`);
  console.log(`Failed:      ${failed.length}`);
  console.log(`Remaining:   ${remaining} (un-attempted, not in storage)`);
  console.log(`Image-edit:  ${ok.filter((r) => r.mode === 'image-edit').length}`);
  console.log(`Text-only:   ${ok.filter((r) => r.mode === 'text-only').length}`);
  console.log(`Total cost:  $${(totalCents / 100).toFixed(2)}`);

  if (failed.length) {
    console.log('\nFailures:');
    for (const f of failed.slice(0, 20)) console.log(`  ${f.kind}/${f.slug}: ${f.error?.slice(0, 120)}`);
    if (failed.length > 20) console.log(`  ... and ${failed.length - 20} more`);
  }

  console.log('\n=== sample URLs (5 spread across types) ===');
  const seen = new Set<string>();
  for (const r of ok) {
    const tagKey = r.kind;
    if (seen.has(tagKey + (ok.indexOf(r) % 5))) continue;
    if (seen.size >= 5) break;
    seen.add(tagKey + (ok.indexOf(r) % 5));
    console.log(`  ${r.name}\n    ${r.publicUrl}`);
  }
}

main().catch((e) => { console.error('batch failed:', e); process.exit(1); });
