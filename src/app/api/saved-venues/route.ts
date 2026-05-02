import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import { resolveVenueIdFromParam } from '@/lib/ownerDashboard';

// GET    /api/saved-venues               — list caller's saved venue IDs
// POST   /api/saved-venues               — add (body: { venueIdOrSlug })
// DELETE /api/saved-venues?venueIdOrSlug — remove
//
// Auth-required. Anonymous users keep using localStorage on the client.

const Body = z.object({
  venueIdOrSlug: z.string().min(1),
});

export async function GET() {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ savedVenueIds: [] });
  }
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('saved_venues')
    .select('venue_id, saved_at, venues:venue_id(legacy_id, slug, name)')
    .eq('profile_id', session.user.id)
    .order('saved_at', { ascending: false });

  return NextResponse.json({
    saved: (data ?? []).map((row: any) => ({
      venueUuid: row.venue_id,
      legacyId: row.venues?.legacy_id ?? null,
      slug: row.venues?.slug ?? null,
      name: row.venues?.name ?? null,
      savedAt: row.saved_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const venueId = await resolveVenueIdFromParam(parsed.venueIdOrSlug);
  if (!venueId) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('saved_venues')
    .insert({ profile_id: session.user.id, venue_id: venueId });
  if (error) {
    if (error.code === '23505') {
      // Duplicate save — treat as success (idempotent).
      return NextResponse.json({ success: true, alreadySaved: true });
    }
    console.error('saved_venues insert failed:', error);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const idOrSlug = request.nextUrl.searchParams.get('venueIdOrSlug');
  if (!idOrSlug) return NextResponse.json({ error: 'venueIdOrSlug required' }, { status: 400 });

  const venueId = await resolveVenueIdFromParam(idOrSlug);
  if (!venueId) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

  const admin = createSupabaseAdminClient();
  await admin
    .from('saved_venues')
    .delete()
    .eq('profile_id', session.user.id)
    .eq('venue_id', venueId);
  return NextResponse.json({ success: true });
}
