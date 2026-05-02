import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabasePublicClient } from '@/lib/supabaseServer';

// POST /api/analytics/view
// Body: { venueId: uuid, visitorCookie: string, isUnique: boolean, referrer?: string }
//
// Fire-and-forget view recorder. Public-INSERT RLS lets the anon client
// write; we only ever READ owner-facing analytics through the service-role
// path (owner dashboard).

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({
  venueId: z.string().uuid(),
  visitorCookie: z.string().min(1).max(64).optional(),
  isUnique: z.boolean().default(false),
  referrer: z.string().max(2000).optional().nullable(),
});

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await request.json());
  } catch {
    // Be lenient — drop the request silently rather than surface validation
    // errors to the analytics beacon. This is best-effort observability.
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null;
  const supabase = createSupabasePublicClient();

  try {
    await supabase.from('venue_views').insert({
      venue_id: parsed.venueId,
      visitor_cookie: parsed.visitorCookie ?? null,
      is_unique: parsed.isUnique,
      referrer: parsed.referrer ?? null,
      user_agent: userAgent,
    });
  } catch {
    /* analytics is fire-and-forget; never surface insert failures */
  }

  return NextResponse.json({ ok: true });
}
