import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';

// POST /api/admin/content-pipeline/posts/[id]/reject
//
// Mark a pending post rejected with an optional reason. Also frees the
// source topic back to 'pending' so a future cron run can re-attempt
// the topic with a fresh draft (rejecting because the draft was bad
// shouldn't burn the topic).

const Body = z.object({
  reason: z.string().max(500).optional().nullable(),
  /** When true, the source topic is marked 'skipped' instead of returned
   *  to the queue. Use when the topic itself is the problem, not the draft. */
  skipTopic: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getAppSession();
  if (!session?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await ctx.params;

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await request.json().catch(() => ({})));
  } catch {
    parsed = {};
  }

  const admin = createSupabaseAdminClient();
  const { data: post } = await admin
    .from('pending_posts')
    .select('topic_id')
    .eq('id', id)
    .maybeSingle();

  await admin
    .from('pending_posts')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
      rejection_reason: parsed.reason ?? null,
    })
    .eq('id', id);

  // Topic disposition
  if (post?.topic_id) {
    await admin
      .from('blog_topic_queue')
      .update({
        status: parsed.skipTopic ? 'skipped' : 'pending',
        used_by_run: null,
        used_at: null,
      })
      .eq('id', post.topic_id);
  }

  return NextResponse.json({ success: true });
}
