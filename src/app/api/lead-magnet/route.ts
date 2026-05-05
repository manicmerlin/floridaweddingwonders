import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import { sanitizeEmail, validateData } from '@/lib/validation';

// Hard-coded so the endpoint can return the link in the response without a
// round-trip lookup. Lives at /downloads/florida-wedding-planning-checklist.pdf
// in the public/ folder.
const CHECKLIST_PDF_PATH = '/downloads/florida-wedding-planning-checklist.pdf';

// Allowlisted source values — keeps the table from getting polluted with
// arbitrary strings and gives us a stable set to segment on later.
const ALLOWED_SOURCES = ['blog', 'venues', 'vendors', 'dress-shops', 'home', 'unknown'] as const;

const LeadMagnetSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  source: z.enum(ALLOWED_SOURCES).default('unknown'),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = await validateData(LeadMagnetSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.errors },
      { status: 400 }
    );
  }

  const email = sanitizeEmail(validation.data.email);
  const source = validation.data.source;

  // Persist via the admin client (service-role bypasses RLS for INSERT,
  // which keeps the policy strict — anon role has INSERT but no SELECT,
  // so once captured the row is invisible to anyone but service-role).
  // If the table doesn't exist yet (migration not applied), we still
  // return the PDF so the user-facing flow doesn't break — capture
  // resumes the moment the migration is applied.
  let persisted = false;
  let alreadyCaptured = false;
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from('lead_magnet_subscribers')
      .insert({ email, source });
    if (error) {
      // Postgres unique-violation code = 23505 (email already captured).
      // Don't treat that as failure — surface it as alreadyCaptured so
      // the UI can show "you're already on the list".
      if (error.code === '23505') {
        alreadyCaptured = true;
      } else if (error.code === '42P01') {
        // 42P01 = relation does not exist. Migration hasn't been applied
        // yet. Log and degrade gracefully — the user still gets the PDF.
        console.warn(
          '[lead-magnet] lead_magnet_subscribers table missing — apply database/lead-magnet-schema.sql'
        );
      } else {
        // Unexpected DB error. Don't 500 — still return the PDF so the
        // user gets value, but log loudly so we notice.
        console.error('[lead-magnet] insert error', error.code, error.message);
      }
    } else {
      persisted = true;
    }
  } catch (e) {
    // createSupabaseAdminClient throws if SUPABASE_SERVICE_ROLE_KEY isn't
    // set — log and continue. PDF link still goes out.
    console.error('[lead-magnet] admin client unavailable', e instanceof Error ? e.message : e);
  }

  return NextResponse.json(
    {
      success: true,
      pdfUrl: CHECKLIST_PDF_PATH,
      message: alreadyCaptured
        ? "You're already on the list — here's the checklist again."
        : 'Thanks! Your checklist download is ready.',
      persisted,
      alreadyCaptured,
    },
    { status: 200 }
  );
}
