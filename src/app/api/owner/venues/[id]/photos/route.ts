import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import {
  requireOwnership,
  resolveVenueIdFromParam,
} from '@/lib/ownerDashboard';
import { tierFeatures } from '@/lib/tierFeatures';

// POST /api/owner/venues/[id]/photos     — upload one image (multipart/form-data, field "file")
// DELETE /api/owner/venues/[id]/photos?photoId=...  — remove one image
//
// Tier-gated photo cap: starter=2, growth=∞, scale=∞ (per tierFeatures).
// Photos are stored in the existing `venue-photos` bucket and the URL is
// pushed into `venues.images` JSONB.

const BUCKET = 'venue-photos';

interface VenueImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const venueId = await resolveVenueIdFromParam(params.id);
  if (!venueId) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

  const owned = await requireOwnership(session.user.id, venueId);
  if (!owned && !session.isSuperAdmin) {
    return NextResponse.json({ error: 'Not your venue' }, { status: 403 });
  }
  const venue = owned?.venue;

  // Tier cap
  const tier = venue?.tier ?? 'starter';
  const cap = tierFeatures(tier).maxPhotos;
  const currentImages: VenueImage[] = Array.isArray(venue?.images) ? venue.images : [];
  if (Number.isFinite(cap) && currentImages.length >= cap) {
    return NextResponse.json(
      {
        error: `Your ${tier} plan allows up to ${cap} photo${cap === 1 ? '' : 's'}. Upgrade to Growth or Scale to add more.`,
        code: 'photo_cap_reached',
      },
      { status: 403 }
    );
  }

  // Read multipart body
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 8MB)' }, { status: 413 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image uploads allowed' }, { status: 415 });
  }

  const admin = createSupabaseAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const photoId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `venues/${venueId}/${photoId}-${safeName}`;

  const fileBytes = await file.arrayBuffer();
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(path, fileBytes, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadErr) {
    console.error('photo upload failed:', uploadErr);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  const newImage: VenueImage = {
    id: photoId,
    url: pub.publicUrl,
    alt: venue?.name ? `${venue.name} photo` : 'Venue photo',
    isPrimary: currentImages.length === 0, // first upload becomes primary
  };

  const updatedImages = [...currentImages, newImage];
  const { error: updateErr } = await admin
    .from('venues')
    .update({ images: updatedImages })
    .eq('id', venueId);
  if (updateErr) {
    console.error('photo metadata write failed:', updateErr);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, image: newImage, total: updatedImages.length });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const venueId = await resolveVenueIdFromParam(params.id);
  if (!venueId) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

  const owned = await requireOwnership(session.user.id, venueId);
  if (!owned && !session.isSuperAdmin) {
    return NextResponse.json({ error: 'Not your venue' }, { status: 403 });
  }

  const photoId = request.nextUrl.searchParams.get('photoId');
  if (!photoId) {
    return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
  }

  const venue = owned?.venue;
  const currentImages: VenueImage[] = Array.isArray(venue?.images) ? venue.images : [];
  const removed = currentImages.find((i) => i.id === photoId);
  if (!removed) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }
  const remaining = currentImages.filter((i) => i.id !== photoId);
  // If the removed photo was primary, promote the next remaining one.
  if (removed.isPrimary && remaining.length > 0 && !remaining.some((i) => i.isPrimary)) {
    remaining[0] = { ...remaining[0], isPrimary: true };
  }

  // Best-effort delete the storage object too. Don't fail the API if it 404s.
  const admin = createSupabaseAdminClient();
  const url = removed.url;
  const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (match) {
    await admin.storage.from(BUCKET).remove([match[1]]).catch(() => null);
  }

  const { error: updateErr } = await admin
    .from('venues')
    .update({ images: remaining })
    .eq('id', venueId);
  if (updateErr) {
    console.error('photo delete metadata write failed:', updateErr);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, total: remaining.length });
}
