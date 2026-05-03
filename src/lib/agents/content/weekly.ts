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
//   3. Draft the post via Claude with the existing 10 posts as voice
//      few-shot. Two calls: (a) full MDX draft, (b) metadata (Pinterest
//      titles, related venues, reading time)
//   4. Insert pending_posts row, mark agent_run success, send admin email
//
// All Claude calls accumulate token usage so the agent_runs row records
// model + tokens_in + tokens_out + cost_cents for cost-tracking.

import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import { getAllPosts } from '@/lib/blog';
import { getVenues } from '@/lib/catalog';
import { Venue } from '@/types';

const AGENT_NAME = 'weekly-blog-draft';
const MODEL = 'claude-opus-4-7';

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

  // 3) Pull voice few-shot examples + venue catalog for the prompt
  const [examplePosts, venues] = await Promise.all([
    Promise.resolve(pickFewShotExamples()),
    getVenues(),
  ]);

  // 4) Draft the post
  const draft = await draftPost(anthropic, topic, examplePosts, venues);
  totalTokensIn += draft.tokensIn;
  totalTokensOut += draft.tokensOut;

  // 5) Generate metadata
  const metadata = await generateMetadata(anthropic, draft, venues);
  totalTokensIn += metadata.tokensIn;
  totalTokensOut += metadata.tokensOut;

  // 6) Compose final MDX with frontmatter
  const finalMdx = composeMdx(draft, metadata);

  // 7) Insert pending_posts row
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
    })
    .select('id, slug, title')
    .single();

  if (postErr || !postRow) {
    throw new Error(`pending_posts insert failed: ${postErr?.message}`);
  }

  // 8) Mark agent_run success with cost + token counts
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
        content: `You're the editorial director for Florida Wedding Wonders, a Florida wedding venue catalog.

We have these blog posts already published:

${existingTitles}

Generate 5 NEW blog post topics for our queue. Requirements:
- Florida-specific, not generic wedding advice
- Should not duplicate or overlap meaningfully with the existing posts
- Practical, opinionated, useful — not SEO filler
- Mix of seasonal (some winter/summer-specific) and evergreen
- Range across different topics: vendors, planning, design, guests, logistics

Return JSON only — no commentary, no markdown fences. Format:
{"topics":[
  {"topic":"slug-friendly-topic","workingTitle":"Working Title","description":"1-2 sentence brief","priority":7,"season":"any|spring|summer|fall|winter","tags":["tag1","tag2"]},
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

function pickFewShotExamples(): { title: string; body: string }[] {
  // Two best-fit examples for voice transfer. Picked to span style: one
  // numbered/list-heavy ("Florida Wedding Planning Timeline"), one
  // narrative/sectioned ("Wedding Season in Florida").
  const all = getAllPosts();
  const want = ['florida-wedding-planning-timeline', 'wedding-season-florida-weather-guide'];
  const examples: { title: string; body: string }[] = [];
  for (const slug of want) {
    const found = all.find((p) => p.slug === slug);
    if (found) {
      // Truncate the body to keep prompt size reasonable. ~3000 chars is
      // enough to lock voice without blowing the context.
      const truncated = found.content.slice(0, 3000);
      examples.push({
        title: found.title,
        body: truncated + '\n\n[... post continues ...]',
      });
    }
  }
  return examples;
}

async function draftPost(
  anthropic: Anthropic,
  topic: TopicRow,
  fewShot: { title: string; body: string }[],
  venues: Venue[]
): Promise<DraftResult> {
  // Surface a small subset of venues for the prompt so Claude can name-drop
  // accurately without sending 130 venues. Pick a varied 24-venue sample.
  const venueSample = venues.slice(0, 24).map((v) => ({
    slug: v.slug,
    name: v.name,
    city: v.address.city,
    type: v.venueType,
    capacity: `${v.capacity.min}-${v.capacity.max}`,
  }));

  const exampleBlocks = fewShot
    .map((e) => `### Example: ${e.title}\n\n${e.body}`)
    .join('\n\n---\n\n');

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `You're the lead writer for Florida Wedding Wonders. Write a new blog post in our voice.

VOICE GUIDE (read carefully — match the cadence, opinionated tone, and Florida-first specificity):

${exampleBlocks}

---

TOPIC FOR THIS POST:
- Topic: ${topic.topic}
- Working title: ${topic.working_title ?? '(none — pick a strong one)'}
- Brief: ${topic.description ?? '(none)'}
- Season: ${topic.season ?? 'any'}
- Tags: ${(topic.tags ?? []).join(', ')}

REAL VENUES YOU CAN REFERENCE (link by slug as /venues/[slug]):

${venueSample.map((v) => `- ${v.name} (${v.city}, ${v.type}, ${v.capacity} guests, slug: ${v.slug})`).join('\n')}

Plus 100+ more venues in the catalog. Don't fabricate venue names — only use ones from the list above or generic mentions ("most resort venues in the Keys", etc.).

REQUIREMENTS:
- 1500-2200 words of substantive Florida-specific content
- Markdown body only — NO frontmatter (frontmatter is added separately)
- Open with a strong, opinionated lede that frames why generic advice fails for Florida
- Use H2 (##) and H3 (###) headers, real numbered/bulleted lists, occasional tables when the format helps
- Reference 2-4 real venues from the catalog using inline markdown links: [Venue Name](/venues/slug)
- Real data where possible: capacity ranges, regional weather patterns, price bands ($15k-$30k for X tier, etc.)
- End with a CTA that points to /quotes/request (the multi-quote form) — paraphrase, don't copy any prior post's CTA verbatim
- Avoid generic SEO filler. Avoid bulleted lists of obvious truisms. Be specific.

Return JSON only — no commentary, no markdown fences:
{"slug":"slug-friendly","title":"Final post title","description":"meta description ~150 chars","category":"Wedding Planning|Venues|Wedding Budget","body":"# H1\\n\\nfull markdown..."}`,
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
        content: `Given this Florida wedding blog post draft, produce metadata.

TITLE: ${draft.title}
DESCRIPTION: ${draft.description}

POST BODY:
${draft.bodyMdx.slice(0, 4500)}${draft.bodyMdx.length > 4500 ? '\n[... continues ...]' : ''}

Generate JSON:
{
  "pinterestTitleVariants": ["3 Pinterest-pin title variants (keyword-rich, hook-first, max 60 chars each)"],
  "metaDescription": "tightened ~155 char meta (rewrite if existing one is too long or weak)",
  "relatedVenueSlugs": ["3 to 5 venue slugs from the catalog that genuinely fit this post"],
  "readingTimeMin": 9,
  "tags": ["3 to 5 tags (planning, vendors, beach, design, etc.)"]
}

Rules:
- relatedVenueSlugs: ONLY use slugs that match venues already mentioned in the post body, OR clearly fit the topic. Don't invent.
- readingTimeMin: word count / 200, rounded up
- pinterestTitleVariants: pin titles, not duplicates of the article title; should make sense at glance
- Return JSON only, no commentary`,
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

  // Validate relatedVenueSlugs against the catalog — drop any that don't exist
  const validSlugs = (parsed.relatedVenueSlugs ?? [])
    .filter((s: unknown): s is string => typeof s === 'string')
    .filter((s: string) => venueSlugMap.has(s))
    .slice(0, 5);

  return {
    pinterestTitleVariants: Array.isArray(parsed.pinterestTitleVariants)
      ? parsed.pinterestTitleVariants.slice(0, 3).map(String)
      : [],
    metaDescription: String(parsed.metaDescription ?? draft.description).slice(0, 200),
    relatedVenueSlugs: validSlugs,
    readingTimeMin: clampInt(parsed.readingTimeMin, 1, 30, 8),
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).map(String) : [],
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens,
  };
}

// ---------------------------------------------------------------------------
// Final MDX assembly
// ---------------------------------------------------------------------------

function composeMdx(draft: DraftResult, metadata: MetadataResult): string {
  const today = new Date().toISOString().slice(0, 10);
  const fm = [
    '---',
    `title: ${yamlString(draft.title)}`,
    `description: ${yamlString(metadata.metaDescription)}`,
    `date: "${today}"`,
    `updatedAt: "${today}"`,
    'author: "Florida Wedding Wonders Team"',
    'authorBio: "Drafted by our editorial agent and reviewed by the Florida Wedding Wonders team before publishing."',
    `category: ${yamlString(draft.category)}`,
    'image: "/images/blog/default-gradient.jpg"',
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
