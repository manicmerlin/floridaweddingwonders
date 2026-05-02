import { NextRequest, NextResponse } from 'next/server';
import { getVenueByLegacyId, getVenueBySlug } from '@/lib/catalog';

// Public read-only endpoint backing the claim form's venue lookup.
// Accepts either a slug or a legacy numeric id so existing callers don't
// need to know about the URL change.
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const venue = /^\d+$/.test(slug)
    ? await getVenueByLegacyId(slug)
    : await getVenueBySlug(slug);
  if (!venue) {
    return NextResponse.json({ venue: null }, { status: 404 });
  }
  return NextResponse.json({ venue });
}
