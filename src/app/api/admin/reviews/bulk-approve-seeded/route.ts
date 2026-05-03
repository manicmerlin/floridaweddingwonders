import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';

// POST /api/admin/reviews/bulk-approve-seeded
//
// Approves every pending+seeded review in one operation. Used by the admin
// moderation queue's "Bulk approve seeded" button. Single SQL UPDATE so
// the action is atomic — either all 147 flip to approved or none do.

export async function POST(_request: NextRequest) {
  const session = await getAppSession();
  if (!session?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from('venue_reviews')
    .update(
      {
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id,
      },
      { count: 'exact' }
    )
    .eq('status', 'pending')
    .eq('is_seeded', true);

  if (error) {
    console.error('bulk-approve-seeded failed:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, approved: count ?? 0 });
}
