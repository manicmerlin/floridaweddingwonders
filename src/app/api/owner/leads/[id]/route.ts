import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';

// PATCH /api/owner/leads/[id]
// Body: { state?: 'new'|'viewed'|'responded'|'archived', ownerNotes?: string }
//
// Owner pipeline-state update. Authorized via venue_ownerships join — owner
// can only edit leads on venues they actively own.

const Body = z.object({
  state: z.enum(['new', 'viewed', 'responded', 'archived']).optional(),
  ownerNotes: z.string().max(2000).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
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

  const admin = createSupabaseAdminClient();

  // Look up the lead and confirm the caller owns the related venue.
  const { data: lead } = await admin
    .from('venue_leads')
    .select('id, venue_id, state, viewed_at')
    .eq('id', params.id)
    .maybeSingle();
  if (!lead) {
    return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
  }

  // venue_leads.venue_id is TEXT (legacy_id). Resolve to UUID, then check
  // ownership.
  let venueUuid: string | null = null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lead.venue_id)) {
    venueUuid = lead.venue_id;
  } else {
    const { data: vRow } = await admin
      .from('venues')
      .select('id')
      .eq('legacy_id', lead.venue_id)
      .maybeSingle();
    venueUuid = vRow?.id ?? null;
  }
  if (!venueUuid) {
    return NextResponse.json({ error: 'Inquiry venue missing' }, { status: 500 });
  }

  if (!session.isSuperAdmin) {
    const { data: ownership } = await admin
      .from('venue_ownerships')
      .select('id')
      .eq('profile_id', session.user.id)
      .eq('venue_id', venueUuid)
      .eq('status', 'active')
      .maybeSingle();
    if (!ownership) {
      return NextResponse.json({ error: 'Not your venue' }, { status: 403 });
    }
  }

  const update: Record<string, unknown> = {};
  if (parsed.state !== undefined) {
    update.state = parsed.state;
    if (parsed.state === 'viewed' && !lead.viewed_at) {
      update.viewed_at = new Date().toISOString();
    }
    if (parsed.state === 'responded') {
      update.responded_at = new Date().toISOString();
    }
  }
  if (parsed.ownerNotes !== undefined) update.owner_notes = parsed.ownerNotes;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true, noChanges: true });
  }

  const { error } = await admin.from('venue_leads').update(update).eq('id', params.id);
  if (error) {
    console.error('lead update failed:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
