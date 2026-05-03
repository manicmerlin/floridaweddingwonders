/* eslint-disable no-console */
//
// scripts/generate-page-photos.ts
//
// Phase 7E — generate DALL-E hero photos for 5 high-traffic, image-poor
// landing pages. Pattern lifted from scripts/backfill-blog-images.ts but
// targeting the `pages/<slug>/hero.png` storage path instead of
// `posts/<slug>/featured.png`.
//
// Why a parallel script instead of extending generateImagesForPost?
// generateImagesForPost hardcodes `posts/<slug>/...` and is called by the
// production cron. Adding a path-prefix knob there for a one-off backfill
// risks the cron path. This script reuses imageGen's STYLE_ANCHOR + the
// same OpenAI call shape but talks to Supabase Storage directly.
//
// Run:
//   export OPENAI_API_KEY=...
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npx tsx scripts/generate-page-photos.ts [--dry-run]
//
// Cost: 5 images at 1792×1024 standard = $0.40. Well under the $0.50 cap.

import OpenAI from 'openai';
import { createSupabaseAdminClient } from '../src/lib/supabaseServer';

const STORAGE_BUCKET = 'blog-images';
const DALLE_MODEL = 'dall-e-3';
const DRY_RUN = process.argv.includes('--dry-run');
// --only=<slug> regenerates a single page (overwriting the existing
// hero.png, since upload uses upsert:true). Useful when one image's
// composition needs a redo without re-spending on the other four.
const ONLY_SLUG = (() => {
  const arg = process.argv.find((a) => a.startsWith('--only='));
  return arg ? arg.slice('--only='.length) : null;
})();
// --force overrides the idempotency check and regenerates even when
// hero.png already exists in storage.
const FORCE = process.argv.includes('--force');

// Same anchor used by imageGen.ts so brand look stays consistent across
// post heroes and page heroes.
const STYLE_ANCHOR =
  'Editorial wedding photography, warm natural light, candid composition, ' +
  'cinematic film grain, no text overlay, no logos, no signs, no readable text, ' +
  'no faces in close-up, no recognizable people. Florida setting.';

interface PageSpec {
  slug: string;
  /** Path label used in logs and the rationale in the PR body. */
  route: string;
  /** Why this slot was picked — surfaces in the PR body via the printed summary. */
  rationale: string;
  /** Specific scene primer for this page's subject. */
  scene: string;
  /** Subject-line context (mood + what the photo should evoke). */
  context: string;
}

const PAGES: PageSpec[] = [
  {
    slug: 'about',
    route: '/about',
    rationale:
      'Brand-story hero — needs a banner-friendly composition with strong negative space for headline overlay; the original was too busy across left/center/right thirds.',
    scene:
      'Wide editorial photograph of an empty Florida wedding ceremony arch at golden hour, viewed from a respectful distance. The arch sits in the lower-left third of the frame, draped with subtle white florals; the right two-thirds open to the Atlantic horizon and a vast warm sunset sky. Soft shadows from empty white chairs in the foreground curve toward the arch along a sand aisle. Strong negative space on the right for editorial-style headline overlay. Cinematic, painterly, magazine-cover quality',
    context:
      'A bilingual (English/Spanish) brand-story page about Miami natives who built a venue directory after living the wedding world from every angle. The image should feel intimate, considered, and uniquely Florida — not stock wedding photography. Banner-friendly composition: subject anchored to one side, the other side open for text overlay.',
  },
  {
    slug: 'venues',
    route: '/venues',
    rationale:
      'Highest-traffic catalog page in the directory and currently has no hero image at all — just a gradient. A wide banner above the search lifts the page\'s visual weight on the most-viewed surface.',
    scene:
      'A sweeping, photogenic Florida wedding venue exterior — historic estate or waterfront ballroom — late-afternoon light, manicured grounds, ceremony arch visible at distance',
    context:
      'The main directory page where couples browse hundreds of Florida wedding venues across regions and styles. The image should suggest abundance, quality, and aspiration — the kind of venue someone bookmarks.',
  },
  {
    slug: 'vendors',
    route: '/vendors',
    rationale:
      'Parallel catalog index for vendors (photographers, florists, DJs) — currently text on a dark gradient with no hero. Visual identity makes the section feel as polished as the venue catalog.',
    scene:
      'A behind-the-scenes Florida wedding craft moment — a florist arranging blooms on a reception table, soft window light, neutral tableware in the background',
    context:
      'Directory page where couples find wedding vendors — photographers, florists, caterers, DJs, planners. The image should evoke craft, attention to detail, and the human work behind a wedding day.',
  },
  {
    slug: 'dress-shops',
    route: '/dress-shops',
    rationale:
      'Bridal-shop catalog index has no hero — currently centered text on a dark gradient. A boutique-interior photo gives the section a clear bridal-shopping atmosphere distinct from venues and vendors.',
    scene:
      'A serene Florida bridal boutique interior — pastel walls, white dresses on satin hangers in soft focus, bright morning light through a window, no people in frame',
    context:
      'Directory page where Florida brides find bridal salons and dress designers. The image should feel calm, aspirational, and intimate — the kind of space a bride remembers.',
  },
  {
    slug: 'blog',
    route: '/blog',
    rationale:
      'The blog is now a meaningful SEO pillar (10 live posts with their own hero photos) and the index hero is still a flat gradient — adding a real photo here matches the polish the post pages already have.',
    scene:
      'A serene Florida wedding planning scene — open notebook, fresh flowers, a coffee cup, soft window light on a wood table, hint of a wedding venue or beach visible through the window',
    context:
      'Blog index page that lists wedding planning guides — timelines, venue selection, vendors, weather strategy. The image should suggest thoughtful preparation and Florida atmosphere without being literal about any single article.',
  },
];

async function main() {
  const required = ['OPENAI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const k of required) {
    if (!process.env[k]) {
      console.error(`Missing ${k}`);
      process.exit(1);
    }
  }

  const targets = ONLY_SLUG ? PAGES.filter((p) => p.slug === ONLY_SLUG) : PAGES;
  if (ONLY_SLUG && targets.length === 0) {
    console.error(`--only=${ONLY_SLUG} matched no page (slugs: ${PAGES.map((p) => p.slug).join(', ')})`);
    process.exit(1);
  }

  console.log(`generate-page-photos running in ${DRY_RUN ? 'DRY-RUN' : 'COMMIT'} mode${ONLY_SLUG ? ` (only ${ONLY_SLUG})` : ''}${FORCE ? ' [FORCE]' : ''}\n`);
  console.log(`Generating ${targets.length} hero image${targets.length === 1 ? '' : 's'} at 1792×1024 ($0.08 each → $${(targets.length * 8 / 100).toFixed(2)} max)\n`);

  const openai = DRY_RUN ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const admin = DRY_RUN ? null : createSupabaseAdminClient();

  const results: Array<{
    slug: string;
    route: string;
    rationale: string;
    publicUrl?: string;
    skipped?: string;
    error?: string;
  }> = [];

  let totalCostCents = 0;

  for (const page of targets) {
    const prompt = imagePromptFromPage(page);
    console.log(`▶  ${page.route}`);
    console.log(`   prompt: ${prompt.slice(0, 140)}…`);

    if (DRY_RUN) {
      results.push({ slug: page.slug, route: page.route, rationale: page.rationale, skipped: 'dry-run' });
      continue;
    }

    // Idempotency: if the file already exists in storage, skip — unless
    // --force was passed (a regen). Storage upload uses upsert:true, so
    // forcing simply overwrites at the same path.
    const path = `pages/${page.slug}/hero.png`;
    if (!FORCE) {
      const existing = await checkExists(admin!, path);
      if (existing) {
        console.log(`·  ${page.route}: hero.png already in storage — skip (use --force to regen)`);
        results.push({
          slug: page.slug,
          route: page.route,
          rationale: page.rationale,
          publicUrl: existing,
          skipped: 'already exists',
        });
        continue;
      }
    }

    try {
      const bytes = await generateOneImage(openai!, prompt);
      const publicUrl = await uploadToStorage(admin!, path, bytes);
      totalCostCents += 8;
      console.log(`✓  ${page.route}: ${publicUrl}`);
      results.push({ slug: page.slug, route: page.route, rationale: page.rationale, publicUrl });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗  ${page.route}: ${msg}`);
      results.push({ slug: page.slug, route: page.route, rationale: page.rationale, error: msg });
    }
  }

  console.log('\n--- summary ---');
  console.log(`Generated:  ${results.filter((r) => r.publicUrl && !r.skipped).length}`);
  console.log(`Skipped:    ${results.filter((r) => r.skipped).length}`);
  console.log(`Failed:     ${results.filter((r) => r.error).length}`);
  console.log(`Total cost: $${(totalCostCents / 100).toFixed(2)}`);

  console.log('\n--- URLs (paste into src/lib/pageImages.ts) ---');
  for (const r of results) {
    if (r.publicUrl) {
      console.log(`  ${r.slug}: ${r.publicUrl}`);
    }
  }

  console.log('\n--- PR body rationales ---');
  for (const r of results) {
    console.log(`- **${r.route}** — ${r.rationale}`);
  }
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

/**
 * Build a DALL-E prompt for a non-post page. Mirrors imagePromptFromPost in
 * shape — scene primer + context — so the visual style matches.
 *
 * Style anchor is appended once, here, since this script doesn't go through
 * generateImagesForPost (which appends it itself).
 */
function imagePromptFromPage(page: PageSpec): string {
  return `${page.scene}.

Page context: ${page.context}

${STYLE_ANCHOR}`;
}

// ---------------------------------------------------------------------------
// OpenAI + Supabase
// ---------------------------------------------------------------------------

async function generateOneImage(openai: OpenAI, prompt: string): Promise<Buffer> {
  const result = await openai.images.generate({
    model: DALLE_MODEL,
    prompt,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
    style: 'vivid',
    response_format: 'url',
  });
  const url = result.data?.[0]?.url;
  if (!url) throw new Error('OpenAI returned no image URL');
  const fetched = await fetch(url);
  if (!fetched.ok) throw new Error(`image fetch failed: ${fetched.status}`);
  const arrayBuffer = await fetched.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToStorage(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  path: string,
  bytes: Buffer
): Promise<string> {
  const { error } = await admin.storage.from(STORAGE_BUCKET).upload(path, bytes, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw new Error(`storage upload failed: ${error.message}`);
  const { data } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('getPublicUrl returned no URL');
  return data.publicUrl;
}

async function checkExists(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  path: string
): Promise<string | null> {
  // list() in the parent folder and look for our filename. The list call is
  // cheap; a HEAD-equivalent isn't exposed by supabase-js for storage.
  const slashIdx = path.lastIndexOf('/');
  const dir = path.slice(0, slashIdx);
  const file = path.slice(slashIdx + 1);
  const { data } = await admin.storage.from(STORAGE_BUCKET).list(dir);
  if (data?.some((e) => e.name === file)) {
    const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return pub?.publicUrl ?? null;
  }
  return null;
}

main().catch((e) => {
  console.error('generate-page-photos failed:', e);
  process.exit(1);
});
