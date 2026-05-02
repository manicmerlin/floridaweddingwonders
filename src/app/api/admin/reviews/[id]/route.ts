import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';

// PATCH /api/admin/reviews/[id]
//
// Admin-only review state transition. Body: { status: 'approved' | 'rejected' }.
// Sets reviewed_at and reviewed_by atomically.

const Body = z.object({
  status: z.enum(['approved', 'rejected']),
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

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? err.issues.map((i) => i.message).join('; ')
        : 'Invalid body';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('venue_reviews')
    .update({
      status: parsed.status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
    })
    .eq('id', id);

  if (error) {
    console.error('admin review update failed:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
