import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import { getAppSession } from '@/lib/authServer';

// POST /api/admin/claims/[id]/approve
//   (no body required)
//
// Admin approves a pending claim_request. Inserts/updates a venue_ownership
// row to status='active' and stamps reviewed_at on the claim. For paid
// tiers, the claim gets approved separately by the Stripe webhook on
// payment success — admins approve directly only for the starter tier.

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAppSession();
  if (!session || !session.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const claimId = params.id;
  const admin = createSupabaseAdminClient();

  const { data: claim, error: fetchErr } = await admin
    .from('claim_requests')
    .select('id, venue_id, profile_id, status')
    .eq('id', claimId)
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
  if (!claim.profile_id) {
    return NextResponse.json(
      { error: 'Claim has no associated profile (anonymous claim cannot be granted ownership).' },
      { status: 400 }
    );
  }

  // Upsert the ownership row.
  const { data: existingOwnership } = await admin
    .from('venue_ownerships')
    .select('id, status')
    .eq('profile_id', claim.profile_id)
    .eq('venue_id', claim.venue_id)
    .maybeSingle();

  if (existingOwnership) {
    await admin
      .from('venue_ownerships')
      .update({
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: session.user.id,
      })
      .eq('id', existingOwnership.id);
  } else {
    await admin.from('venue_ownerships').insert({
      profile_id: claim.profile_id,
      venue_id: claim.venue_id,
      role: 'owner',
      status: 'active',
      approved_at: new Date().toISOString(),
      approved_by: session.user.id,
    });
  }

  await admin
    .from('claim_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
    })
    .eq('id', claimId);

  return NextResponse.json({ success: true });
}
