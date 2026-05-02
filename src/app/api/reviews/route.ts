import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import { getAppSession } from '@/lib/authServer';

// POST /api/reviews — public submit endpoint. Anonymous users + signed-in
// users can both submit. Submissions always start in 'pending'; the admin
// queue at /admin/reviews flips them to approved or rejected.
//
// We use the service-role client to insert (bypasses RLS) so that the
// `status='pending'` invariant is enforced server-side rather than relying
// on the client to set it correctly. The "anyone can submit" RLS policy
// would also work, but server-side-controlled status is safer.

const Body = z.object({
  venueUuid: z.string().uuid(),
  reviewerName: z.string().min(2).max(120),
  reviewerEmail: z.string().email().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional().nullable(),
  body: z.string().min(10).max(4000),
  weddingDate: z.string().date().optional().nullable(),
});

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
        : 'Invalid body';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const session = await getAppSession().catch(() => null);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('venue_reviews')
    .insert({
      venue_id: parsed.venueUuid,
      profile_id: session?.user.id ?? null,
      reviewer_name: parsed.reviewerName,
      reviewer_email: parsed.reviewerEmail ?? null,
      rating: parsed.rating,
      title: parsed.title ?? null,
      body: parsed.body,
      wedding_date: parsed.weddingDate ?? null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('reviews insert failed:', error);
    return NextResponse.json({ error: 'Could not submit review' }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data?.id, status: 'pending' });
}
