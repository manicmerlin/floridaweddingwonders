import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';

// POST /api/admin/content-pipeline/topics — create a new topic in the queue.

const Body = z.object({
  topic: z.string().min(3).max(200),
  workingTitle: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  priority: z.number().int().min(1).max(10).optional(),
  season: z.enum(['any', 'spring', 'summer', 'fall', 'winter']).optional(),
  tags: z.array(z.string().max(40)).max(8).optional(),
  notes: z.string().max(500).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const session = await getAppSession();
  if (!session?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await request.json());
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.issues.map((i) => i.message).join('; ')
        : 'Invalid body';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('blog_topic_queue')
    .insert({
      topic: parsed.topic,
      working_title: parsed.workingTitle ?? null,
      description: parsed.description ?? null,
      priority: parsed.priority ?? 5,
      season: parsed.season ?? 'any',
      tags: parsed.tags ?? [],
      notes: parsed.notes ?? null,
      source: 'human',
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, id: data?.id });
}
