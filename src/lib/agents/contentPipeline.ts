// Server-only data layer for the content pipeline (admin-facing). Reads
// from agent_runs, blog_topic_queue, pending_posts via the service-role
// client; the calling page enforces super_admin via requireSuperAdmin.

import { createSupabaseAdminClient } from '@/lib/supabaseServer';

export interface PendingPostSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  status: 'pending' | 'edited' | 'approved' | 'rejected' | 'published';
  generatedAt: string;
  reviewedAt: string | null;
  publishedAt: string | null;
  topicId: string | null;
  agentRunId: string | null;
  githubCommitSha: string | null;
  rejectionReason: string | null;
  /** Full MDX body — included on the detail view, omitted from list to
   *  keep payloads small. */
  bodyMdx?: string;
  frontmatter?: Record<string, unknown>;
}

export interface TopicRow {
  id: string;
  topic: string;
  workingTitle: string | null;
  description: string | null;
  priority: number;
  season: string | null;
  tags: string[] | null;
  source: 'human' | 'agent' | 'imported';
  status: 'pending' | 'in_use' | 'used' | 'skipped';
  usedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AgentRunRow {
  id: string;
  agentName: string;
  runDate: string;
  status: 'started' | 'success' | 'partial' | 'failed';
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  model: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  costCents: number | null;
  output: Record<string, unknown> | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Pending posts
// ---------------------------------------------------------------------------

export async function listPendingPosts(): Promise<PendingPostSummary[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('pending_posts')
    .select(
      'id, slug, title, description, category, status, generated_at, reviewed_at, published_at, topic_id, agent_run_id, github_commit_sha, rejection_reason'
    )
    .order('generated_at', { ascending: false })
    .limit(100);
  return (data ?? []).map(rowToPendingPost);
}

export async function getPendingPost(id: string): Promise<PendingPostSummary | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('pending_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;
  return {
    ...rowToPendingPost(data),
    bodyMdx: data.body_mdx,
    frontmatter: data.frontmatter,
  };
}

function rowToPendingPost(r: any): PendingPostSummary {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    category: r.category,
    status: r.status,
    generatedAt: r.generated_at,
    reviewedAt: r.reviewed_at,
    publishedAt: r.published_at,
    topicId: r.topic_id,
    agentRunId: r.agent_run_id,
    githubCommitSha: r.github_commit_sha,
    rejectionReason: r.rejection_reason,
  };
}

// ---------------------------------------------------------------------------
// Topic queue
// ---------------------------------------------------------------------------

export async function listTopics(): Promise<TopicRow[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('blog_topic_queue')
    .select('*')
    .order('status', { ascending: true })  // pending first
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });
  return (data ?? []).map((r: any) => ({
    id: r.id,
    topic: r.topic,
    workingTitle: r.working_title,
    description: r.description,
    priority: r.priority,
    season: r.season,
    tags: r.tags,
    source: r.source,
    status: r.status,
    usedAt: r.used_at,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Agent runs
// ---------------------------------------------------------------------------

export async function listAgentRuns(limit = 50): Promise<AgentRunRow[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('agent_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    agentName: r.agent_name,
    runDate: r.run_date,
    status: r.status,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    durationMs: r.duration_ms,
    model: r.model,
    tokensIn: r.tokens_in,
    tokensOut: r.tokens_out,
    costCents: r.cost_cents,
    output: r.output,
    error: r.error,
  }));
}
