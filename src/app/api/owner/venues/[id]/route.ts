import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import {
  requireOwnership,
  resolveVenueIdFromParam,
} from '@/lib/ownerDashboard';

// PATCH /api/owner/venues/[id]
// Body: { description?, contactPhone?, contactEmail?, contactWebsite?,
//         capacityText?, addressStreet?, addressZip?, amenities?, tags? }
//
// Owner-only edit endpoint. Restricts the column allowlist server-side —
// owner can update narrative/contact fields but NOT tier, slug, legacy_id,
// uuid, or anything that affects ownership/billing. Those go through admin
// or Stripe webhook paths.

const Body = z.object({
  description:    z.string().max(5000).optional(),
  contactPhone:   z.string().max(40).optional().nullable(),
  contactEmail:   z.string().email().max(255).optional().nullable(),
  contactWebsite: z.string().url().max(500).optional().nullable(),
  capacityText:   z.string().max(2000).optional().nullable(),
  addressStreet:  z.string().max(255).optional().nullable(),
  addressZip:     z.string().max(20).optional().nullable(),
  amenities:      z.array(z.string().max(255)).max(60).optional(),
  tags:           z.array(z.string().max(80)).max(40).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const venueId = await resolveVenueIdFromParam(params.id);
  if (!venueId) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

  const owned = await requireOwnership(session.user.id, venueId);
  if (!owned && !session.isSuperAdmin) {
    return NextResponse.json({ error: 'Not your venue' }, { status: 403 });
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

  // If owner sets a real contact_email, mark it real so the inquiry route
  // delivers directly instead of routing to LEAD_FALLBACK_EMAIL.
  const update: Record<string, unknown> = {};
  if (parsed.description !== undefined)    update.description = parsed.description;
  if (parsed.contactPhone !== undefined)   update.contact_phone = parsed.contactPhone;
  if (parsed.contactEmail !== undefined) {
    update.contact_email = parsed.contactEmail;
    update.contact_email_real = !!parsed.contactEmail;
  }
  if (parsed.contactWebsite !== undefined) update.contact_website = parsed.contactWebsite;
  if (parsed.capacityText !== undefined)   update.capacity_text = parsed.capacityText;
  if (parsed.addressStreet !== undefined)  update.address_street = parsed.addressStreet;
  if (parsed.addressZip !== undefined)     update.address_zip = parsed.addressZip;
  if (parsed.amenities !== undefined)      update.amenities = parsed.amenities;
  if (parsed.tags !== undefined)           update.tags = parsed.tags;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true, noChanges: true });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('venues').update(update).eq('id', venueId);
  if (error) {
    console.error('owner venue update failed:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
