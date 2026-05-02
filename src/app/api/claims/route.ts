import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from '@/lib/supabaseServer';
import { getAppSession } from '@/lib/authServer';

// POST /api/claims
//   { venueSlug | venueId, name, email, phone?, businessName?,
//     relationshipToVenue?, notes?, intendedTier? }
//
// Inserts a row in claim_requests. Auth-gate: signed-in user, profile_id
// pinned to the caller. Anonymous claims (no auth) are NOT allowed in
// Phase 3A — keeps the spam surface small. Phase 3B can add a public form
// behind hCaptcha if needed.
//
// For paid intended_tiers (growth/scale), the client follows up with a
// POST /api/stripe/checkout — that route uses its own metadata to link the
// resulting subscription back to the claim_request. The webhook flips the
// claim to approved on payment success.
//
// For starter tier, the claim sits in `pending` until an admin approves
// via /api/admin/claims/[id]/approve.

const ClaimSchema = z.object({
  venueId: z.string().uuid().optional(),
  venueSlug: z.string().min(1).optional(),
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  phone: z.string().max(40).optional(),
  businessName: z.string().max(255).optional(),
  relationshipToVenue: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  intendedTier: z.enum(['starter', 'growth', 'scale']).optional(),
}).refine((d) => d.venueId || d.venueSlug, {
  message: 'venueId or venueSlug is required',
});

export async function POST(request: NextRequest) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json(
      { error: 'You must be signed in to submit a claim.' },
      { status: 401 }
    );
  }

  let parsed: z.infer<typeof ClaimSchema>;
  try {
    const body = await request.json();
    parsed = ClaimSchema.parse(body);
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.issues.map((i) => i.message).join('; ') : 'Invalid request body';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Resolve venue UUID (we accept either uuid or slug from the client).
  const supabase = createSupabaseServerClient();
  let venueRow: { id: string; name: string } | null = null;
  if (parsed.venueId) {
    const { data } = await supabase
      .from('venues')
      .select('id, name')
      .eq('id', parsed.venueId)
      .maybeSingle();
    venueRow = data;
  } else if (parsed.venueSlug) {
    const { data } = await supabase
      .from('venues')
      .select('id, name')
      .eq('slug', parsed.venueSlug)
      .maybeSingle();
    venueRow = data;
  }
  if (!venueRow) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  // Block duplicate pending claims by the same user for the same venue.
  // (UNIQUE on venue_ownerships handles ownership; here we want to keep the
  // claim queue clean.)
  const { data: existing } = await supabase
    .from('claim_requests')
    .select('id, status')
    .eq('venue_id', venueRow.id)
    .eq('profile_id', session.user.id)
    .in('status', ['pending', 'approved'])
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.status === 'approved'
            ? 'You have already claimed this venue.'
            : 'You already have a pending claim for this venue.',
        claimRequestId: existing.id,
        status: existing.status,
      },
      { status: 409 }
    );
  }

  // Insert via service-role to write the FK + email columns reliably.
  // RLS on claim_requests permits user inserts where profile_id = auth.uid()
  // anyway, but we bypass to avoid timing issues with the SSR cookie.
  const admin = createSupabaseAdminClient();
  const { data: inserted, error: insertErr } = await admin
    .from('claim_requests')
    .insert({
      venue_id: venueRow.id,
      profile_id: session.user.id,
      requester_email: parsed.email,
      requester_name: parsed.name,
      requester_phone: parsed.phone ?? null,
      business_name: parsed.businessName ?? null,
      relationship_to_venue: parsed.relationshipToVenue ?? null,
      notes: parsed.notes ?? null,
      intended_tier: parsed.intendedTier ?? 'starter',
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertErr) {
    console.error('claim insert failed:', insertErr);
    return NextResponse.json(
      { error: 'Could not save claim. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    claimRequestId: inserted!.id,
    venueId: venueRow.id,
    venueName: venueRow.name,
    intendedTier: parsed.intendedTier ?? 'starter',
  });
}
