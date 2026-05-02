import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import { getAppSession } from '@/lib/authServer';

// POST /api/admin/claims/[id]/reject
//   { reason?: string }
//
// Marks a pending claim_request as rejected with an optional reason.
// Does NOT touch venue_ownerships — if the claimant had a pending
// ownership row, it stays pending (admin can revoke separately).

const Body = z.object({
  reason: z.string().max(2000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAppSession();
  if (!session || !session.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let parsed: z.infer<typeof Body>;
  try {
    const body = await request.json().catch(() => ({}));
    parsed = Body.parse(body);
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.issues.map((i) => i.message).join('; ') : 'Invalid body';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: claim, error: fetchErr } = await admin
    .from('claim_requests')
    .select('id, status')
    .eq('id', params.id)
    .maybeSingle();
  if (fetchErr || !claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }
  if (claim.status !== 'pending') {
    return NextResponse.json(
      { error: `Claim is already ${claim.status}.` },
      { status: 409 }
    );
  }

  await admin
    .from('claim_requests')
    .update({
      status: 'rejected',
      rejection_reason: parsed.reason ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
    })
    .eq('id', params.id);

  return NextResponse.json({ success: true });
}
