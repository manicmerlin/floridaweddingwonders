import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';

// PATCH /api/admin/content-pipeline/topics/[id] — edit a queued topic.
// DELETE /api/admin/content-pipeline/topics/[id] — remove a queued topic.
//
// Both require super_admin. Cannot edit or delete a topic that's currently
// in_use or used to preserve audit trail (skip via PATCH if you want it
// out of rotation).

const PatchBody = z.object({
  topic: z.string().min(3).max(200).optional(),
  workingTitle: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  priority: z.number().int().min(1).max(10).optional(),
  season: z.enum(['any', 'spring', 'summer', 'fall', 'winter']).optional(),
  tags: z.array(z.string().max(40)).max(8).optional(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(['pending', 'skipped']).optional(),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getAppSession();
  if (!session?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await ctx.params;

  let parsed: z.infer<typeof PatchBody>;
  try {
    parsed = PatchBody.parse(await request.json());
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.issues.map((i) => i.message).join('; ')
        : 'Invalid body';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Refuse to edit a topic that's been claimed
  const { data: existing } = await admin
    .from('blog_topic_queue')
    .select('status')
    .eq('id', id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }
  if (existing.status === 'in_use' || existing.status === 'used') {
    return NextResponse.json(
      { error: `Cannot edit topic in status '${existing.status}'` },
      { status: 409 }
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.topic !== undefined) update.topic = parsed.topic;
  if (parsed.workingTitle !== undefined) update.working_title = parsed.workingTitle;
  if (parsed.description !== undefined) update.description = parsed.description;
  if (parsed.priority !== undefined) update.priority = parsed.priority;
  if (parsed.season !== undefined) update.season = parsed.season;
  if (parsed.tags !== undefined) update.tags = parsed.tags;
  if (parsed.notes !== undefined) update.notes = parsed.notes;
  if (parsed.status !== undefined) update.status = parsed.status;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true, noChanges: true });
  }

  const { error } = await admin
    .from('blog_topic_queue')
    .update(update)
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getAppSession();
  if (!session?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await ctx.params;
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from('blog_topic_queue')
    .select('status')
    .eq('id', id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }
  if (existing.status === 'in_use' || existing.status === 'used') {
    return NextResponse.json(
      { error: `Cannot delete topic in status '${existing.status}' — preserve audit trail` },
      { status: 409 }
    );
  }
  const { error } = await admin.from('blog_topic_queue').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
