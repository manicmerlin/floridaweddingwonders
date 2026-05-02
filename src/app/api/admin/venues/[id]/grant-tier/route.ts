import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import { getAppSession } from '@/lib/authServer';

// POST /api/admin/venues/[id]/grant-tier
//   { tier: 'starter' | 'growth' | 'scale', expiresAt?: ISO8601 }
//
// Manual tier grant — bypasses Stripe. Used for testing the featured/badge
// UX before any real payment infra is wired up, and as an admin escape
// hatch (e.g. honoring the "first 10 venues get a free year" Early Bird
// offer manually, or applying a refund-equivalent downgrade).
//
// Writes only to `venues.tier` and `tier_expires_at`. Does NOT create a
// `subscriptions` row — manual grants are deliberately distinct from
// Stripe-tracked revenue.

const Body = z.object({
  tier: z.enum(['starter', 'growth', 'scale']),
  expiresAt: z.string().datetime().optional().nullable(),
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
    const body = await request.json();
    parsed = Body.parse(body);
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.issues.map((i) => i.message).join('; ') : 'Invalid body';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // For starter and scale, expires_at is always null. Growth: caller can set,
  // or we default to now + 1 year as a sensible test value.
  let expires: string | null = null;
  if (parsed.tier === 'growth') {
    expires =
      parsed.expiresAt ??
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  }

  // Accept either UUID or legacy id ("1".."129") in the path. URL params
  // come in as strings either way; we just try both shapes.
  const admin = createSupabaseAdminClient();
  const venueLookup = /^[0-9a-f-]{36}$/i.test(params.id)
    ? admin.from('venues').select('id').eq('id', params.id)
    : admin.from('venues').select('id').eq('legacy_id', params.id);
  const { data: venue, error: lookupErr } = await venueLookup.maybeSingle();
  if (lookupErr || !venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  const { error: updateErr } = await admin
    .from('venues')
    .update({ tier: parsed.tier, tier_expires_at: expires })
    .eq('id', venue.id);
  if (updateErr) {
    console.error('grant-tier update failed:', updateErr);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    venueId: venue.id,
    tier: parsed.tier,
    expiresAt: expires,
  });
}
