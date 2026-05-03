// Phase 7A — Weekly content agent orchestration.
//
// One function: runWeeklyContentAgent. Called by /api/cron/weekly-blog-draft.
// Idempotent at the DB level via the unique partial index on
// agent_runs(agent_name, run_date) — if the cron retries, the second
// INSERT fails cleanly and the endpoint returns "already-ran".
//
// The four phases:
//   1. Open an agent_runs row (status='started')
//   2. Pick a topic — highest priority pending row in blog_topic_queue,
//      or AI-generate 5 new ones if the queue is empty
//   3. Draft the post via Claude using the Voice Charter as the primary
//      spec. Two calls: (a) full MDX draft, (b) metadata (Pinterest
//      titles, related venues, reading time)
//   4. Insert pending_posts row, mark agent_run success, send admin email
//
// All Claude calls accumulate token usage so the agent_runs row records
// model + tokens_in + tokens_out + cost_cents for cost-tracking.
//
// Voice version: bumped each time the Voice Charter materially changes.
// agent_runs.metadata.voice_version records which voice produced each
// post — useful when iterating on tone or comparing engagement across
// charter versions. Bump VOICE_VERSION in lockstep with VOICE_CHARTER.

import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import { getAllPosts } from '@/lib/blog';
import { getVenues } from '@/lib/catalog';
import { Venue } from '@/types';
import { generateImagesForPost, isImageGenConfigured, type ImageGenResult } from './imageGen';

const AGENT_NAME = 'weekly-blog-draft';
const MODEL = 'claude-opus-4-7';
const VOICE_VERSION = 'v3.1-blended-conversational';

// Anchor "current year" in the prompt so drafts don't accidentally cite
// 2025 prices (the v3 sample did, mid-2026). Bump in lockstep with the
// calendar.
const CURRENT_YEAR = 2026;

// VOICE CHARTER — tonal lock for every post. The voice is HOW we write.
// The blend instructions below cover WHAT we write about and how voice
// + utility coexist. Both required. Bump VOICE_VERSION when either
// block materially changes; future runs are tagged with the new version.
//
// v3 blend rationale: pure narrative-column posts (v2) would have built
// brand love but ranked badly for transactional searches. Pure utility
// posts (v1, the existing 10) read like SEO content. The blend gives us
// both — voice carries the reading experience, the practical numbers
// give Google something to index.
const VOICE_CHARTER = `VOICE CHARTER — sharp, stylish relationship columnist narrating a modern love story.

Tone:
- Playful, witty, and effortlessly charming
- Observational, with clever insights about love, dating, and commitment
- Lightly sarcastic in a warm, self-aware way (never negative or cynical)
- Confident and emotionally intelligent
- Romantic, but grounded in real-life moments and relatable experiences

Writing style:
- Read like a personal column or narrated inner monologue
- Include rhetorical questions and thought-provoking reflections
- Use short, punchy lines mixed with slightly longer, flowing sentences
- Feel conversational, like you're letting the reader in on a secret
- Blend humor with sincerity — make the reader smile and feel something

Narrative approach:
- Open with a relatable observation about relationships, dating, or weddings
- Build into a mini story or scenario (a moment of doubt, excitement, realization, etc.)
- Transition into the idea of finding "the one" — and mirror that with finding the perfect venue
- Introduce the venue naturally as the place where everything clicks
- Describe the venue through sensory, emotional storytelling (not listing features)
- Close with a memorable, reflective line about love, timing, or meaningful choices

Guidelines:
- Speak directly to the reader as if offering insider perspective
- Keep it engaging, never overly formal or corporate
- Avoid clichés unless they are cleverly reimagined
- Do NOT sound like an advertisement — this should feel like a story that just happens to feature a venue`;

// STRUCTURAL BLEND — the resolution of voice ↔ utility. This rides
// alongside the voice charter in every draft prompt.
//
// v3.1 update: dropped the "4-6 data points" requirement — that pushed
// drafts toward encyclopedia entries (latitude 25.7, UV index 10-11) that
// broke the spell. People learn through story and relatability, not through
// coordinates. Replaced with the friend-not-researcher framing + the
// "would I say this number out loud?" self-test.
const STRUCTURAL_BLEND = `STRUCTURAL BLEND — every post must carry the voice AND deliver real practical value.

You are a friend who's been to a hundred Florida weddings, not a researcher who's read about them. The voice is how you write. The useful information is what you say about it. Both required.

- YES include consequences, prices, capacity ranges, vendor truths — these are what readers actually need ("A Naples ballroom for 200 will run you $18-32k once you account for the linens line item nobody warned you about" — the number lands like real talk)
- YES use occasional H2 headers as evocative narrative beats, not utility headers ("The night the bartender saved everything" not "Bar service tips")
- YES name specific outcomes through story: "the bridesmaids glowed highlighter-yellow at noon" beats "UV index hits 10-11 by midday"; "eucalyptus wilts in forty-five minutes" beats "humidity averages 70-80%"
- YES use lists ONLY when content genuinely demands enumeration, with a witty intro line per item — never as a bullet dump
- NO tables — restructure as flowing prose
- NO encyclopedia stats: latitudes, UV indexes, humidity percentages, climate categories. The result of those numbers makes it in via story; the numbers themselves do not.
- WEATHER as experienced (a hot afternoon, the kind of muggy that ruins blowouts, golden hour stretching) is fine and welcome. Weather as measured (latitude, UV index, dew point, sun angle) is not. Same rule for any technical specifics: keep the lived consequence, drop the meteorological coordinates.
- THE TEST: before you write any number, ask "would I say this out loud in a conversation with a friend over dinner?" If the answer is no (latitude, percentage, climate-zone label), replace it with the experience that number describes. If the answer is yes (price band, capacity, sunset time, fee), keep it.
- END every post with a memorable, reflective line about love/timing/meaningful choices, then a soft CTA to /quotes/request
- INCLUDE 2-3 short quotable lines (<140 chars each) marked with <!-- caption --> immediately after on its own line — these double as social captions`;

// Per-million pricing (cents) for Opus 4.7 — used to estimate cost_cents.
// Prices recompute easily; this is rough but useful.
const COST_PER_MILLION_INPUT = 1500;  // $15.00 / 1M input tokens
const COST_PER_MILLION_OUTPUT = 7500; // $75.00 / 1M output tokens

const resend = new Resend(process.env.RESEND_API_KEY);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentRunResult {
  status: 'success' | 'already-ran' | 'failed' | 'partial';
  agentRunId?: string;
  pendingPostId?: string;
  topic?: string;
  title?: string;
  error?: string;
  costCents?: number;
}

interface DraftResult {
  slug: string;
  title: string;
  description: string;
  category: string;
  bodyMdx: string;
  tokensIn: number;
  tokensOut: number;
}

interface MetadataResult {
  pinterestTitleVariants: string[];
  metaDescription: string;
  relatedVenueSlugs: string[];
  readingTimeMin: number;
  tags: string[];
  /** Phase 7B — image prompt generated by Claude in the same call so we
   *  don't pay for a third Anthropic round-trip. The orchestrator hands
   *  this to imageGen.ts. */
  imagePrompt: string;
  tokensIn: number;
  tokensOut: number;
}

// ---------------------------------------------------------------------------
// Public entrypoint
// ---------------------------------------------------------------------------

export async function runWeeklyContentAgent(): Promise<AgentRunResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { status: 'failed', error: 'ANTHROPIC_API_KEY not set' };
  }

  const admin = createSupabaseAdminClient();

  // 1) Open the agent_runs row — fails on the unique partial index if
  //    today's run already exists.
  const { data: runRow, error: insErr } = await admin
    .from('agent_runs')
    .insert({
      agent_name: AGENT_NAME,
      status: 'started',
      model: MODEL,
    })
    .select('id')
    .single();

  if (insErr) {
    if (insErr.code === '23505') {
      // Unique violation — today's run already exists.
      return { status: 'already-ran' };
    }
    console.error('agent_runs insert failed:', insErr);
    return { status: 'failed', error: insErr.message };
  }
  const agentRunId = runRow!.id as string;

  try {
    const result = await executeRun(agentRunId);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('weekly content agent failed:', err);
    await admin
      .from('agent_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error: msg,
      })
      .eq('id', agentRunId);
    return { status: 'failed', agentRunId, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Inner orchestration
// ---------------------------------------------------------------------------

async function executeRun(agentRunId: string): Promise<AgentRunResult> {
  const admin = createSupabaseAdminClient();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // Total cost accumulator
  let totalTokensIn = 0;
  let totalTokensOut = 0;

  // 2) Pick a topic
  const topic = await pickOrGenerateTopic(anthropic, (ti, to) => {
    totalTokensIn += ti;
    totalTokensOut += to;
  });
  if (!topic) {
    throw new Error('No topic available and topic-generation failed');
  }

  // Mark the topic as in_use so a parallel run wouldn't pick it up.
  await admin
    .from('blog_topic_queue')
    .update({ status: 'in_use', used_by_run: agentRunId, used_at: new Date().toISOString() })
    .eq('id', topic.id);

  // 3) Pull venue catalog for the prompt. Voice charter (top of file) is
  //    the single voice spec — no few-shot examples since the existing 10
  //    posts are utility-style and would drag the model toward list-form.
  const venues = await getVenues();

  // 4) Draft the post
  const draft = await draftPost(anthropic, topic, venues);
  totalTokensIn += draft.tokensIn;
  totalTokensOut += draft.tokensOut;

  // 5) Generate metadata
  const metadata = await generateMetadata(anthropic, draft, venues);
  totalTokensIn += metadata.tokensIn;
  totalTokensOut += metadata.tokensOut;

  // 6) Generate images (Phase 7B). Wrapped in try/catch so DALL-E content
  //    rejection / network blip / Storage error doesn't fail the whole run —
  //    post still lands, admin can manually re-trigger image gen later.
  let imageResult: Awaited<ReturnType<typeof generateImagesForPost>> | null = null;
  if (isImageGenConfigured() && metadata.imagePrompt) {
    try {
      imageResult = await generateImagesForPost({
        slug: draft.slug,
        imagePrompt: metadata.imagePrompt,
        postId: '', // not needed for path-key, kept for future audit
      });
      if (imageResult.errors.length > 0) {
        console.warn('image gen partial failure:', imageResult.errors);
      }
    } catch (e) {
      console.warn('image gen threw:', e);
    }
  }

  // 7) Compose final MDX with frontmatter (now includes image URLs when present)
  const finalMdx = composeMdx(draft, metadata, imageResult);

  // 8) Insert pending_posts row
  const { data: postRow, error: postErr } = await admin
    .from('pending_posts')
    .insert({
      slug: draft.slug,
      title: draft.title,
      description: metadata.metaDescription,
      category: draft.category,
      body_mdx: finalMdx,
      frontmatter: {
        title: draft.title,
        description: metadata.metaDescription,
        category: draft.category,
        tags: metadata.tags,
        relatedVenues: metadata.relatedVenueSlugs,
        readingTimeMin: metadata.readingTimeMin,
        pinterestTitleVariants: metadata.pinterestTitleVariants,
      },
      status: 'pending',
      topic_id: topic.id,
      agent_run_id: agentRunId,
      // Phase 7B image columns — null when image gen is unconfigured or failed
      image_url: imageResult?.imageUrl ?? null,
      pinterest_image_url: imageResult?.pinterestImageUrl ?? null,
      image_prompt: imageResult?.imagePrompt ?? metadata.imagePrompt ?? null,
      image_cost_cents: imageResult?.costCents ?? null,
    })
    .select('id, slug, title')
    .single();

  if (postErr || !postRow) {
    throw new Error(`pending_posts insert failed: ${postErr?.message}`);
  }

  // 9) Mark agent_run success with cost + token counts. agent_runs.cost_cents
  //    tracks Anthropic only; image cost lives on pending_posts so cost
  //    accounting per surface stays clean.
  const costCents = estimateCostCents(totalTokensIn, totalTokensOut);
  await admin
    .from('agent_runs')
    .update({
      status: 'success',
      completed_at: new Date().toISOString(),
      tokens_in: totalTokensIn,
      tokens_out: totalTokensOut,
      cost_cents: costCents,
      output: {
        topic_id: topic.id,
        topic: topic.topic,
        post_id: postRow.id,
        post_slug: postRow.slug,
        image_url: imageResult?.imageUrl ?? null,
        pinterest_image_url: imageResult?.pinterestImageUrl ?? null,
        image_cost_cents: imageResult?.costCents ?? 0,
        image_errors: imageResult?.errors ?? [],
      },
      metadata: {
        voice_version: VOICE_VERSION,
      },
    })
    .eq('id', agentRunId);

  // 9) Email admin (best-effort — don't fail the run if email send fails)
  await sendAdminNotification({
    postId: postRow.id,
    title: postRow.title,
    slug: postRow.slug,
    topic: topic.topic,
    costCents,
  }).catch((e) => {
    console.warn('admin notification email failed:', e);
  });

  return {
    status: 'success',
    agentRunId,
    pendingPostId: postRow.id,
    topic: topic.topic,
    title: postRow.title,
    costCents,
  };
}

// ---------------------------------------------------------------------------
// Topic selection
// ---------------------------------------------------------------------------

interface TopicRow {
  id: string;
  topic: string;
  working_title: string | null;
  description: string | null;
  season: string | null;
  tags: string[] | null;
}

async function pickOrGenerateTopic(
  anthropic: Anthropic,
  recordTokens: (ti: number, to: number) => void
): Promise<TopicRow | null> {
  const admin = createSupabaseAdminClient();

  // Try the queue first — highest priority pending, oldest first as tiebreaker.
  const { data } = await admin
    .from('blog_topic_queue')
    .select('id, topic, working_title, description, season, tags')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1);
  if (data && data.length > 0) return data[0] as TopicRow;

  // Queue is empty — ask Claude for 5 new topic ideas and insert them.
  const generated = await generateTopicIdeas(anthropic, recordTokens);
  if (generated.length === 0) return null;

  const inserted = await admin
    .from('blog_topic_queue')
    .insert(
      generated.map((g) => ({
        topic: g.topic,
        working_title: g.workingTitle,
        description: g.description,
        priority: g.priority,
        season: g.season ?? 'any',
        tags: g.tags,
        source: 'agent',
      }))
    )
    .select('id, topic, working_title, description, season, tags, priority')
    .order('priority', { ascending: false });
  if (inserted.error || !inserted.data) return null;
  return inserted.data[0] as TopicRow;
}

interface GeneratedTopic {
  topic: string;
  workingTitle: string;
  description: string;
  priority: number;
  season: string;
  tags: string[];
}

async function generateTopicIdeas(
  anthropic: Anthropic,
  recordTokens: (ti: number, to: number) => void
): Promise<GeneratedTopic[]> {
  const allPosts = getAllPosts();
  const existingTitles = allPosts.map((p) => `- ${p.title}`).join('\n');

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You're the editorial director for Florida Wedding Wonders, a Florida wedding venue catalog. Every post we publish blends a sharp, stylish columnist voice with real practical info — search engines see actionable content, readers feel like they're being let in on something. Topics can be utility-shaped (budgets, timelines, regional guides) — the voice handles the blending later.

We have these blog posts already published:

${existingTitles}

Generate 5 NEW topics for the queue. Requirements:
- Florida-specific, not generic wedding advice
- Should not duplicate or overlap meaningfully with the existing posts
- Practical, opinionated, useful — but not pure SEO filler
- A reader should be able to imagine both the search query that brings them here AND the emotional reason they're searching it
- Mix of seasonal (some winter/summer-specific) and evergreen
- Range across topics: vendors, planning, design, guests, logistics, budget

Return JSON only — no commentary, no markdown fences:
{"topics":[
  {"topic":"slug-friendly-topic","workingTitle":"Working title (search-friendly is fine)","description":"1-2 sentence brief","priority":7,"season":"any|spring|summer|fall|winter","tags":["tag1","tag2"]},
  ...4 more
]}

Priority: 1-10, higher = more time-sensitive or higher value.`,
      },
    ],
  });

  recordTokens(response.usage.input_tokens, response.usage.output_tokens);
  const text = response.content
    .filter((c): c is Anthropic.TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('\n');

  try {
    const cleaned = stripJsonFences(text);
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed.topics)) return [];
    return parsed.topics.slice(0, 5).map((t: any) => ({
      topic: String(t.topic ?? '').trim(),
      workingTitle: String(t.workingTitle ?? '').trim(),
      description: String(t.description ?? '').trim(),
      priority: clampInt(t.priority, 1, 10, 5),
      season: ['any', 'spring', 'summer', 'fall', 'winter'].includes(t.season)
        ? t.season
        : 'any',
      tags: Array.isArray(t.tags) ? t.tags.slice(0, 5).map(String) : [],
    }));
  } catch (e) {
    console.error('topic-gen JSON parse failed:', e, text.slice(0, 500));
    return [];
  }
}

// ---------------------------------------------------------------------------
// Draft generation
// ---------------------------------------------------------------------------

async function draftPost(
  anthropic: Anthropic,
  topic: TopicRow,
  venues: Venue[]
): Promise<DraftResult> {
  // Surface a small subset of venues for the prompt so Claude can name-drop
  // accurately without sending 130 venues. Pick a varied 24-venue sample.
  const venueSample = venues.slice(0, 24).map((v) => ({
    slug: v.slug,
    name: v.name,
    city: v.address.city,
    type: v.venueType,
  }));

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `You're a writer for Florida Wedding Wonders. Read the Voice Charter and the Structural Blend below in full before drafting — both are required, equally.

${VOICE_CHARTER}

---

${STRUCTURAL_BLEND}

---

TOPIC FOR THIS POST:
- Topic: ${topic.topic}
- Working title: ${topic.working_title ?? '(none — pick something evocative but search-friendly)'}
- Brief: ${topic.description ?? '(none)'}
- Season: ${topic.season ?? 'any'}
- Tags: ${(topic.tags ?? []).join(', ')}

REAL FLORIDA VENUES YOU CAN WEAVE IN (link by slug as /venues/[slug]):

${venueSample.map((v) => `- ${v.name} — ${v.type} venue in ${v.city} (slug: ${v.slug})`).join('\n')}

Plus 100+ more in the catalog. Don't fabricate venue names — only use ones from the list above. Reference 4-7 of them through sensory, emotional storytelling — the way the light falls on the courtyard, the moment a couple knows this is the place — and weave the real practical detail (capacity, region, what they're known for) into the same sentence the venue appears in.

ADDITIONAL CONTEXT:
- Current year: ${CURRENT_YEAR}. When you cite prices, contracts, or "this year's" anything, anchor to ${CURRENT_YEAR}, not 2025.
- Length: 1500-2200 words. Lean toward the higher end — the blend needs room for both the voice and the practical detail to breathe.
- Markdown body only — NO frontmatter (frontmatter is added separately).
- Title should be SEO-friendly (keyword-rich enough that Google understands the topic) but the body itself reads as a column. Example: "How Much Does a Florida Wedding Cost in ${CURRENT_YEAR}?" is the title; the body still opens with a relatable scene before any numbers land.
- Useful information IS required (prices, capacity, sunset times, fees, vendor truths) — but route it all through the friend-not-researcher / "would I say this number out loud?" filter from the Structural Blend above. Outcomes through story, not encyclopedia stats.

Return JSON only — no commentary, no markdown fences:
{"slug":"slug-friendly","title":"Final post title","description":"meta description ~150 chars","category":"Wedding Planning|Venues|Wedding Budget","body":"full markdown body, no h1, starts with the lede paragraph"}`,
      },
    ],
  });

  const text = response.content
    .filter((c): c is Anthropic.TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('\n');

  let parsed: any;
  try {
    parsed = JSON.parse(stripJsonFences(text));
  } catch (e) {
    throw new Error(
      `draft JSON parse failed: ${e instanceof Error ? e.message : String(e)}\nRaw: ${text.slice(0, 500)}`
    );
  }

  return {
    slug: slugify(parsed.slug || parsed.title),
    title: String(parsed.title ?? topic.working_title ?? 'Untitled').trim(),
    description: String(parsed.description ?? '').trim(),
    category: String(parsed.category ?? 'Wedding Planning').trim(),
    bodyMdx: String(parsed.body ?? '').trim(),
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens,
  };
}

// ---------------------------------------------------------------------------
// Metadata generation
// ---------------------------------------------------------------------------

async function generateMetadata(
  anthropic: Anthropic,
  draft: DraftResult,
  venues: Venue[]
): Promise<MetadataResult> {
  const venueSlugMap = new Map(venues.map((v) => [v.slug, v]));

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `Given this Florida wedding blog post draft, produce metadata. The post blends a sharp, stylish columnist voice with real practical info (price bands, capacity, vendor names, etc.). Metadata should match — search-friendly enough to rank, warm enough to feel like part of the same voice.

TITLE: ${draft.title}
DESCRIPTION: ${draft.description}

POST BODY:
${draft.bodyMdx.slice(0, 4500)}${draft.bodyMdx.length > 4500 ? '\n[... continues ...]' : ''}

Generate JSON:
{
  "pinterestTitleVariants": ["3 Pinterest-pin title variants. Each must be searchable (include 1-2 of the post's actual topic keywords) AND have a small editorial hook — warmer than pure SEO copy, more direct than pure essay. Examples of the blend: 'Florida Wedding Costs in ${CURRENT_YEAR}: What No One Tells You', 'The Real Math on a Naples Beach Wedding', 'Florida Wedding Venues by Region: A Field Guide'. Max 60 chars each."],
  "metaDescription": "tightened ~155 char meta. Hooky opener, then makes the practical value of the post obvious so search-result clicks happen. Rewrite if the existing one is weak.",
  "relatedVenueSlugs": ["match the venue count in the body — between 4 and 7 typically. Don't trim, don't invent. Look at every /venues/<slug> link in the body and return that exact set of slugs."],
  "readingTimeMin": 9,
  "tags": ["3 to 5 tags. Mix utility tags (planning, budget, beach, vendors) with theme tags where they fit (engagement, choosing the venue) — both sides because the post itself is both."],
  "imagePrompt": "A single DALL-E 3 prompt for a hero image that matches THIS specific post's mood. Florida wedding scene, editorial film photography, warm natural light, candid. No text overlay, no faces in close-up, no logos. The prompt should evoke the post's specific vibe — if the post is about color palettes, name the palette; if it's about a Naples ballroom, describe the room; if it's about hurricane season, describe a wedding-day scene that captures the resilience of it. ~80-150 words. Will be used at both 16:9 and 9:16 aspect ratios."
}

Rules:
- relatedVenueSlugs: scan the post body for inline markdown links of the form /venues/<slug> and return EVERY unique slug found. Match the body — don't truncate.
- readingTimeMin: word count / 200, rounded up. Blended posts are typically 8-11 min.
- pinterestTitleVariants: searchable + warm. Don't strip the keywords for emotional purity (we still need to rank); don't strip the warmth for keyword stuffing (we still need to read like the brand).
- imagePrompt: be specific to THIS post. Generic "Florida wedding" prompts produce generic images. Pull mood + visual cues from the post body itself.
- Return JSON only, no commentary, no markdown fences.`,
      },
    ],
  });

  const text = response.content
    .filter((c): c is Anthropic.TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('\n');

  let parsed: any;
  try {
    parsed = JSON.parse(stripJsonFences(text));
  } catch (e) {
    throw new Error(
      `metadata JSON parse failed: ${e instanceof Error ? e.message : String(e)}\nRaw: ${text.slice(0, 500)}`
    );
  }

  // Validate relatedVenueSlugs against the catalog — drop any that don't exist.
  // Also fall back to body-scan if Claude under-returns (v3.0 sometimes
  // proposed 2 venues even when the body had 5+ inline links).
  const proposedSlugs = (parsed.relatedVenueSlugs ?? [])
    .filter((s: unknown): s is string => typeof s === 'string')
    .filter((s: string) => venueSlugMap.has(s));
  const bodyMentionedSlugs = extractVenueSlugsFromBody(draft.bodyMdx).filter((s) =>
    venueSlugMap.has(s)
  );
  // Union the two sets, prefer Claude's order but ensure body mentions land.
  const slugSet = new Set<string>(proposedSlugs);
  for (const s of bodyMentionedSlugs) slugSet.add(s);
  const validSlugs = Array.from(slugSet).slice(0, 7);

  return {
    pinterestTitleVariants: Array.isArray(parsed.pinterestTitleVariants)
      ? parsed.pinterestTitleVariants.slice(0, 3).map(String)
      : [],
    metaDescription: String(parsed.metaDescription ?? draft.description).slice(0, 200),
    relatedVenueSlugs: validSlugs,
    readingTimeMin: clampInt(parsed.readingTimeMin, 1, 30, 8),
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).map(String) : [],
    imagePrompt: String(parsed.imagePrompt ?? '').trim(),
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens,
  };
}

/** Extract /venues/<slug> references from MDX body — fallback so the
 *  metadata pipeline stays accurate even if Claude under-returns. */
function extractVenueSlugsFromBody(body: string): string[] {
  const seen = new Set<string>();
  const re = /\/venues\/([a-z0-9][a-z0-9-]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m[1]) seen.add(m[1].toLowerCase());
  }
  return Array.from(seen);
}

// ---------------------------------------------------------------------------
// Final MDX assembly
// ---------------------------------------------------------------------------

function composeMdx(
  draft: DraftResult,
  metadata: MetadataResult,
  imageResult: ImageGenResult | null
): string {
  const today = new Date().toISOString().slice(0, 10);
  // Phase 7B: featured image URL falls back to the gradient placeholder so
  // the post still renders on the blog when image-gen is unconfigured/failed.
  const heroImage = imageResult?.imageUrl ?? '/images/blog/default-gradient.jpg';
  const fm = [
    '---',
    `title: ${yamlString(draft.title)}`,
    `description: ${yamlString(metadata.metaDescription)}`,
    `date: "${today}"`,
    `updatedAt: "${today}"`,
    'author: "Florida Wedding Wonders Team"',
    'authorBio: "Drafted by our editorial agent and reviewed by the Florida Wedding Wonders team before publishing."',
    `category: ${yamlString(draft.category)}`,
    `image: ${yamlString(heroImage)}`,
    // Pinterest image only emitted when present — the consuming /pin OG
    // route (Phase 6) generates a 2:3 dynamic image as a fallback when this
    // is missing.
    ...(imageResult?.pinterestImageUrl
      ? [`pinterestImage: ${yamlString(imageResult.pinterestImageUrl)}`]
      : []),
    'keywords:',
    ...metadata.tags.map((t) => `  - ${yamlString(t)}`),
    'tags:',
    ...metadata.tags.map((t) => `  - ${yamlString(t)}`),
    'relatedVenues:',
    ...metadata.relatedVenueSlugs.map((s) => `  - ${yamlString(s)}`),
    `excerpt: ${yamlString(draft.description)}`,
    '---',
    '',
  ].join('\n');
  return fm + draft.bodyMdx;
}

// ---------------------------------------------------------------------------
// Admin notification
// ---------------------------------------------------------------------------

async function sendAdminNotification(args: {
  postId: string;
  title: string;
  slug: string;
  topic: string;
  costCents: number;
}): Promise<void> {
  const adminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  if (adminEmails.length === 0) {
    console.warn('No SUPER_ADMIN_EMAILS configured — skipping notification');
    return;
  }

  const reviewUrl = `https://floridaweddingwonders.com/admin/content-pipeline?post=${args.postId}`;
  const costFmt = `$${(args.costCents / 100).toFixed(2)}`;

  await resend.emails.send({
    from: 'Florida Wedding Wonders <noreply@floridaweddingwonders.com>',
    to: adminEmails,
    subject: `📝 New blog draft ready: ${args.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#ec4899;margin:0 0 10px 0;">New blog draft ready for review</h1>
        <p style="color:#374151;font-size:15px;line-height:1.5;">
          The weekly content agent just drafted a new post.
        </p>
        <div style="background:#fdf2f8;border-left:4px solid #ec4899;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0 0 8px 0;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Topic</p>
          <p style="margin:0 0 12px 0;color:#111827;font-weight:600;">${escapeHtml(args.topic)}</p>
          <p style="margin:0 0 8px 0;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Title</p>
          <p style="margin:0 0 12px 0;color:#111827;font-weight:700;font-size:18px;">${escapeHtml(args.title)}</p>
          <p style="margin:0 0 8px 0;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Slug</p>
          <p style="margin:0;color:#374151;font-family:monospace;">${escapeHtml(args.slug)}</p>
        </div>
        <p style="color:#374151;">
          Cost to draft: <strong>${costFmt}</strong>
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${reviewUrl}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">
            Review draft →
          </a>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;">
          Sign in required. Direct link only works if you're already authenticated as super_admin.
        </p>
      </div>
    `,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripJsonFences(text: string): string {
  // Defensive — Claude usually returns clean JSON when asked, but
  // occasionally wraps in ```json fences anyway.
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function slugify(input: string): string {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function yamlString(value: string): string {
  // Quote and escape for YAML frontmatter. Conservative — wraps everything
  // in double quotes and escapes inner double quotes + backslashes.
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function estimateCostCents(tokensIn: number, tokensOut: number): number {
  const inCents = (tokensIn / 1_000_000) * COST_PER_MILLION_INPUT;
  const outCents = (tokensOut / 1_000_000) * COST_PER_MILLION_OUTPUT;
  return Math.ceil(inCents + outCents);
}
