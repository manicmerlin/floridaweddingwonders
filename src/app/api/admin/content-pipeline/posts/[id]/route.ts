import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';

// PATCH /api/admin/content-pipeline/posts/[id]
//
// Edit a pending post — body, title, description, slug, frontmatter.
// Used by the inline editor in /admin/content-pipeline before approval.
// Status transitions to 'edited' on first edit so the audit trail
// reflects human modification.

const Body = z.object({
  bodyMdx: z.string().min(100).max(50000).optional(),
  title: z.string().min(3).max(200).optional(),
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
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
    const msg =
      err instanceof z.ZodError
        ? err.issues.map((i) => i.message).join('; ')
        : 'Invalid body';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const update: Record<string, unknown> = { status: 'edited' };
  if (parsed.bodyMdx !== undefined) update.body_mdx = parsed.bodyMdx;
  if (parsed.title !== undefined) update.title = parsed.title;
  if (parsed.slug !== undefined) update.slug = parsed.slug;
  if (parsed.description !== undefined) update.description = parsed.description;
  if (parsed.category !== undefined) update.category = parsed.category;

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ success: true, noChanges: true });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('pending_posts').update(update).eq('id', id);
  if (error) {
    console.error('pending_posts edit failed:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
