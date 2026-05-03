/* eslint-disable no-console */
//
// scripts/backfill-blog-images.ts
//
// Phase 7D — backfills DALL-E hero + Pinterest images for the 10 live blog
// posts in src/posts/. Reuses the Phase 7B generateImagesForPost() helper
// for the OpenAI + Supabase Storage round-trip; only the prompt-building
// is local to this script (the agent runs Claude to write prompts in real-
// time, but the backfill works from already-published bodies, so a
// template prompt built from frontmatter + the lede paragraph is enough).
//
// Behavior:
//   1. Parse each .md's frontmatter
//   2. Skip if `image:` already points to a Supabase URL (idempotent — re-runs
//      after a partial success only fill in the missing posts)
//   3. Build a contextual DALL-E prompt from title + description + first
//      paragraph of body
//   4. Call generateImagesForPost with hero=1024×1024, pinterest=1024×1792
//   5. Rewrite the .md frontmatter: replace `image:` with the Supabase
//      hero URL, insert `pinterestImage:` immediately below
//
// Sizes vs. Phase 7B cron defaults:
//   - cron: 1792×1024 hero (16:9), $0.080
//   - backfill: 1024×1024 hero (square), $0.040 — matches the existing
//     blog hero crop better and saves cost. Pinterest stays at 1024×1792.
//
// Run with:
//   export OPENAI_API_KEY=...
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npx tsx scripts/backfill-blog-images.ts [--dry-run]

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { generateImagesForPost } from '../src/lib/agents/content/imageGen';

const DRY_RUN = process.argv.includes('--dry-run');
const POSTS_DIR = join(process.cwd(), 'src/posts');

interface PostFile {
  filename: string;
  slug: string;
  fullPath: string;
  frontmatter: Record<string, any>;
  body: string;
  rawSource: string;
}

async function main() {
  const required = ['OPENAI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const k of required) {
    if (!process.env[k]) {
      console.error(`Missing ${k}`);
      process.exit(1);
    }
  }

  console.log(`backfill-blog-images running in ${DRY_RUN ? 'DRY-RUN' : 'COMMIT'} mode\n`);

  const posts = loadPosts();
  console.log(`Found ${posts.length} posts in ${POSTS_DIR}\n`);

  const summary: Array<{
    slug: string;
    skipped?: string;
    heroUrl?: string | null;
    pinUrl?: string | null;
    cost?: number;
    errors?: string[];
  }> = [];

  for (const post of posts) {
    const existing = String(post.frontmatter.image ?? '');
    const hasSupabaseImage = existing.includes('/storage/v1/object/public/blog-images/');
    if (hasSupabaseImage) {
      summary.push({ slug: post.slug, skipped: 'already has Supabase image' });
      console.log(`·  ${post.slug}: already has Supabase image — skip`);
      continue;
    }

    const prompt = buildImagePromptForPost(post);

    if (DRY_RUN) {
      console.log(`✓  ${post.slug}: would generate`);
      console.log(`   prompt: ${prompt.slice(0, 140)}…`);
      summary.push({ slug: post.slug, skipped: 'dry-run' });
      continue;
    }

    console.log(`▶  ${post.slug}: generating...`);
    const result = await generateImagesForPost({
      slug: post.slug,
      imagePrompt: prompt,
      postId: '',
      heroSize: '1024x1024',
      pinterestSize: '1024x1792',
    });

    if (result.errors.length > 0) {
      console.log(`!  ${post.slug}: errors:`, result.errors);
    }

    if (result.imageUrl || result.pinterestImageUrl) {
      rewriteFrontmatter(post, result.imageUrl, result.pinterestImageUrl, prompt);
      console.log(
        `✓  ${post.slug}: hero=${result.imageUrl ? 'OK' : 'MISS'} pin=${result.pinterestImageUrl ? 'OK' : 'MISS'} cost=$${(result.costCents / 100).toFixed(2)}`
      );
    } else {
      console.log(`✗  ${post.slug}: no images produced — frontmatter unchanged`);
    }

    summary.push({
      slug: post.slug,
      heroUrl: result.imageUrl,
      pinUrl: result.pinterestImageUrl,
      cost: result.costCents,
      errors: result.errors,
    });
  }

  const totalCost = summary.reduce((acc, s) => acc + (s.cost ?? 0), 0);
  const generatedCount = summary.filter((s) => s.heroUrl || s.pinUrl).length;
  const skippedCount = summary.filter((s) => s.skipped).length;

  console.log('\n--- summary ---');
  console.log(`Generated:  ${generatedCount} posts (${generatedCount * 2} images)`);
  console.log(`Skipped:    ${skippedCount} posts`);
  console.log(`Total cost: $${(totalCost / 100).toFixed(2)}`);

  const failures = summary.filter((s) => s.errors && s.errors.length > 0);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  ${f.slug}:`, f.errors);
  }
}

// ---------------------------------------------------------------------------
// Frontmatter handling
// ---------------------------------------------------------------------------

function loadPosts(): PostFile[] {
  return readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((filename) => {
      const fullPath = join(POSTS_DIR, filename);
      const rawSource = readFileSync(fullPath, 'utf8');
      const parsed = matter(rawSource);
      return {
        filename,
        slug: filename.replace(/\.md$/, ''),
        fullPath,
        frontmatter: parsed.data,
        body: parsed.content,
        rawSource,
      };
    });
}

/**
 * Rewrite the post's .md file: replace the `image:` line with the new
 * Supabase URL and insert a `pinterestImage:` line immediately below.
 *
 * We do raw-string surgery rather than gray-matter's serializer because
 * gray-matter's stringifier reorders keys and reflows quote style, which
 * would produce noisy diffs across all 10 posts.
 */
function rewriteFrontmatter(
  post: PostFile,
  heroUrl: string | null,
  pinUrl: string | null,
  imagePrompt: string
): void {
  let raw = post.rawSource;

  // Replace the existing `image:` line. The line is somewhere between the
  // first and second `---` markers; matches whitespace-prefixed `image:`
  // followed by a quoted or unquoted value.
  if (heroUrl) {
    raw = raw.replace(
      /^image:\s*.*$/m,
      `image: "${heroUrl}"`
    );
  }

  // Insert pinterestImage: immediately after image:. If pinterestImage:
  // already exists, replace it instead.
  if (pinUrl) {
    if (/^pinterestImage:\s*.*$/m.test(raw)) {
      raw = raw.replace(/^pinterestImage:\s*.*$/m, `pinterestImage: "${pinUrl}"`);
    } else {
      raw = raw.replace(
        /^(image:\s*.*\n)/m,
        `$1pinterestImage: "${pinUrl}"\n`
      );
    }
  }

  // Stash the prompt as a comment near the top of the body for audit. Skipped
  // if there's already an HTML comment marker (don't double-stamp on re-run).
  if (imagePrompt && !raw.includes('<!-- imagePrompt:')) {
    const stamp = `\n<!-- imagePrompt: ${imagePrompt.replace(/-->/g, '— —')} -->\n`;
    // After the closing --- of frontmatter, before body. Use a regex that
    // matches the SECOND --- line.
    raw = raw.replace(/^---\s*\n([\s\S]*?)\n---\s*\n/, (m) => m + stamp);
  }

  writeFileSync(post.fullPath, raw, 'utf8');
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

/**
 * Build a DALL-E prompt from the post's frontmatter + first paragraph.
 *
 * Style anchor lives in imageGen.ts and is appended automatically inside
 * generateImagesForPost — don't duplicate it here.
 */
function buildImagePromptForPost(post: PostFile): string {
  const title = String(post.frontmatter.title ?? '');
  const description = String(post.frontmatter.description ?? '');
  const lede = post.body.split('\n').filter(Boolean)[0] ?? '';
  const ledeShort = lede.replace(/[#*_`]/g, '').slice(0, 280);

  // Map post topic to a visual scene primer. Order matters — more
  // specific matches first, since posts about timelines mention "time",
  // legal posts mention "beach permits", etc.
  const lower = (title + ' ' + description).toLowerCase();
  let scenePrimer = 'A magazine-quality wedding scene in Florida';
  if (/timeline|month-by-month|planning timeline/.test(lower)) {
    scenePrimer = 'A Florida wedding scene that suggests anticipation and arrival — venue ready, guests beginning to gather, soft late-afternoon light';
  } else if (/insurance|legal|permit/.test(lower)) {
    scenePrimer = 'A serene Florida wedding venue exterior or ceremony space at twilight — calm, considered, well-prepared, no people prominently in frame';
  } else if (/budget|cost|pricing|how much/.test(lower)) {
    scenePrimer = 'A tasteful Florida wedding reception scene that suggests careful planning and craft, table details and decor in the foreground';
  } else if (/vendor|checklist/.test(lower)) {
    scenePrimer = 'Behind-the-scenes Florida wedding craft moment — flowers being arranged, table settings being placed, bridal-suite quiet before the ceremony';
  } else if (/weather|season(?!al)|climate/.test(lower)) {
    scenePrimer = 'A Florida wedding outdoor scene capturing the season — light, palette, atmosphere, neither overly bright nor moody';
  } else if (/sunset|golden hour|ceremony time/.test(lower)) {
    scenePrimer = 'A Florida wedding ceremony scene precisely at golden hour, low warm sun, long soft shadows';
  } else if (/beach|beachfront|oceanfront|coastal/.test(lower)) {
    scenePrimer = 'A Florida beachfront wedding ceremony or reception scene at golden hour, sand-aisle and ocean horizon';
  } else if (/venue|choose|find|select/.test(lower)) {
    scenePrimer = 'A Florida wedding venue interior or grounds in late-afternoon light — historic or estate setting, photogenic and inviting';
  }

  return `${scenePrimer}.

Article context: ${description || title}

Lede excerpt for tone: ${ledeShort}`;
}

main().catch((e) => {
  console.error('backfill failed:', e);
  process.exit(1);
});
