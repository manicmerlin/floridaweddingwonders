import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';

// GET  /api/profile  — return the caller's profile (lead-qualification fields)
// PATCH /api/profile  — write lead-qualification to profiles row
//
// The Phase 1 inquiry form stored {weddingDate, guestCount, budgetMin/Max,
// preferences} in localStorage. This route migrates that to the profiles
// table for signed-in users — read on form load (prefill), write on submit.

const PatchBody = z.object({
  fullName:    z.string().max(120).optional(),
  phone:       z.string().max(40).optional().nullable(),
  weddingDate: z.string().date().optional().nullable(),
  guestCount:  z.number().int().nonnegative().max(10000).optional().nullable(),
  budgetMin:   z.number().int().nonnegative().optional().nullable(),
  budgetMax:   z.number().int().nonnegative().optional().nullable(),
  preferences: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function GET() {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ profile: null }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id, email, full_name, phone, wedding_date, guest_count, budget_min, budget_max, preferences')
    .eq('id', session.user.id)
    .maybeSingle();

  return NextResponse.json({ profile: data ?? null });
}

export async function PATCH(request: NextRequest) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  let parsed: z.infer<typeof PatchBody>;
  try {
    parsed = PatchBody.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.issues.map((i) => i.message).join('; ') : 'Invalid body';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (parsed.fullName !== undefined)    update.full_name = parsed.fullName;
  if (parsed.phone !== undefined)       update.phone = parsed.phone;
  if (parsed.weddingDate !== undefined) update.wedding_date = parsed.weddingDate;
  if (parsed.guestCount !== undefined)  update.guest_count = parsed.guestCount;
  if (parsed.budgetMin !== undefined)   update.budget_min = parsed.budgetMin;
  if (parsed.budgetMax !== undefined)   update.budget_max = parsed.budgetMax;
  if (parsed.preferences !== undefined) update.preferences = parsed.preferences;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true, noChanges: true });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('profiles').update(update).eq('id', session.user.id);
  if (error) {
    console.error('profile update failed:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
