// Phase 7B — image generation for weekly content agent.
//
// Generates two DALL-E 3 images per post:
//   1. Hero    — 1792×1024 (16:9 landscape). Used for blog detail page,
//                OG fallback, listing thumbnails.
//   2. Pinterest — 1024×1792 (9:16 portrait). Pinterest's recommended
//                aspect ratio is 2:3; 9:16 is close enough that the
//                pin renders well, and DALL-E 3 doesn't natively output
//                1024×1536. Could crop to true 2:3 server-side later if
//                visual QA flags the difference.
//
// Both images are uploaded to the Supabase Storage `blog-images` bucket
// at `posts/<slug>/featured.png` and `posts/<slug>/pinterest.png`. Public
// URLs are persisted to pending_posts.image_url / pinterest_image_url.
//
// Cost: standard quality at 1024×1792 / 1792×1024 is $0.080 each in 2026,
// so $0.16 total per post. Tracked in pending_posts.image_cost_cents.
//
// Failure model: every step is wrapped so a DALL-E content-policy
// rejection or a network blip doesn't fail the whole run. The orchestrator
// calls this in a try/catch — missing images mean the post still lands
// (with the gradient placeholder) and admin can manually re-trigger
// generation later.

import OpenAI from 'openai';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';

const STORAGE_BUCKET = 'blog-images';
const DALLE_MODEL = 'dall-e-3';

// 2026 standard-quality DALL-E 3 pricing (cents per image).
const COST_CENTS_LANDSCAPE_STANDARD = 8;
const COST_CENTS_PORTRAIT_STANDARD = 8;

// Style anchor — appended to every image prompt so the brand look is
// consistent across posts even when the contextual prompt varies.
const STYLE_ANCHOR =
  'Editorial wedding photography, warm natural light, candid composition, ' +
  'cinematic film grain, no text overlay, no logos, no signs, no readable text, ' +
  'no faces in close-up, no recognizable people. Florida setting.';

export interface ImageGenResult {
  imageUrl: string | null;
  pinterestImageUrl: string | null;
  imagePrompt: string | null;
  costCents: number;
  /** Per-image errors, if any. The orchestrator records these on the
   *  agent_runs row's metadata so debugging is easy. */
  errors: string[];
}

export function isImageGenConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Generate a hero (16:9) and Pinterest (9:16) image for a post and upload
 * both to Supabase Storage. Returns public URLs and cost; logs partial
 * failures rather than throwing so the orchestrator can finish the run.
 */
export async function generateImagesForPost(args: {
  slug: string;
  imagePrompt: string;
  postId: string;
}): Promise<ImageGenResult> {
  const result: ImageGenResult = {
    imageUrl: null,
    pinterestImageUrl: null,
    imagePrompt: args.imagePrompt,
    costCents: 0,
    errors: [],
  };

  if (!process.env.OPENAI_API_KEY) {
    result.errors.push('OPENAI_API_KEY not configured');
    return result;
  }
  if (!args.imagePrompt || args.imagePrompt.length < 20) {
    result.errors.push('imagePrompt missing or too short');
    return result;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const composedPrompt = `${args.imagePrompt}\n\n${STYLE_ANCHOR}`;

  // Generate the two images in parallel — DALL-E 3 supports it and we
  // halve wall-clock time. Each call is independently caught so one
  // succeeding when the other fails still produces partial output.
  const [heroResult, pinResult] = await Promise.all([
    generateOneImage(openai, composedPrompt, '1792x1024').catch((err) => ({
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    })),
    generateOneImage(openai, composedPrompt, '1024x1792').catch((err) => ({
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    })),
  ]);

  if (heroResult.ok) {
    const upload = await uploadToStorage(
      args.slug,
      'featured.png',
      heroResult.bytes
    ).catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : String(e) }));
    if (upload.ok) {
      result.imageUrl = upload.publicUrl;
      result.costCents += COST_CENTS_LANDSCAPE_STANDARD;
    } else {
      result.errors.push(`hero upload failed: ${upload.error}`);
    }
  } else {
    result.errors.push(`hero gen failed: ${heroResult.error}`);
  }

  if (pinResult.ok) {
    const upload = await uploadToStorage(
      args.slug,
      'pinterest.png',
      pinResult.bytes
    ).catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : String(e) }));
    if (upload.ok) {
      result.pinterestImageUrl = upload.publicUrl;
      result.costCents += COST_CENTS_PORTRAIT_STANDARD;
    } else {
      result.errors.push(`pinterest upload failed: ${upload.error}`);
    }
  } else {
    result.errors.push(`pinterest gen failed: ${pinResult.error}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// DALL-E call
// ---------------------------------------------------------------------------

type GenerateOk = { ok: true; bytes: Buffer };
type GenerateErr = { ok: false; error: string };

async function generateOneImage(
  openai: OpenAI,
  prompt: string,
  size: '1792x1024' | '1024x1792'
): Promise<GenerateOk | GenerateErr> {
  // Request URL response (default). DALL-E URLs expire in ~1 hour, so we
  // fetch + re-host immediately. The alternative (`response_format: 'b64_json'`)
  // skips the fetch but doubles the response payload size, and OpenAI
  // recommends URL for HD-size requests.
  const result = await openai.images.generate({
    model: DALLE_MODEL,
    prompt,
    n: 1,
    size,
    quality: 'standard',
    response_format: 'url',
  });

  const url = result.data?.[0]?.url;
  if (!url) {
    return { ok: false, error: 'OpenAI returned no image URL' };
  }

  const fetched = await fetch(url);
  if (!fetched.ok) {
    return { ok: false, error: `image fetch failed: ${fetched.status}` };
  }
  const arrayBuffer = await fetched.arrayBuffer();
  return { ok: true, bytes: Buffer.from(arrayBuffer) };
}

// ---------------------------------------------------------------------------
// Storage upload
// ---------------------------------------------------------------------------

type UploadOk = { ok: true; publicUrl: string };
type UploadErr = { ok: false; error: string };

async function uploadToStorage(
  slug: string,
  filename: string,
  bytes: Buffer
): Promise<UploadOk | UploadErr> {
  const admin = createSupabaseAdminClient();
  const path = `posts/${slug}/${filename}`;

  const { error } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, {
      contentType: 'image/png',
      upsert: true, // overwrite on regeneration — convenient for re-runs
    });
  if (error) {
    return { ok: false, error: error.message };
  }

  const { data } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    return { ok: false, error: 'getPublicUrl returned no URL' };
  }
  return { ok: true, publicUrl: data.publicUrl };
}
