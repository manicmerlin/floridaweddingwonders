// Server-only data layer for venue_reviews. Public API uses the anon-key
// client (RLS gates 'approved' rows); admin moderation uses service-role.

import { createSupabasePublicClient, createSupabaseAdminClient } from './supabaseServer';
import type { Venue } from '../types';

export interface VenueReviewRow {
  id: string;
  venue_id: string;
  profile_id: string | null;
  reviewer_name: string;
  reviewer_email: string | null;
  rating: number;
  title: string | null;
  body: string;
  wedding_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface PublicReview {
  id: string;
  reviewerName: string;
  rating: number;
  title: string | null;
  body: string;
  weddingDate: string | null;
  submittedAt: string;
}

export interface AggregateRating {
  average: number;
  count: number;
}

/**
 * Returns approved reviews for a venue, newest first. Public RLS allows
 * anyone (anon + auth) to read approved rows, so this uses the public client.
 */
export async function getApprovedReviewsForVenue(
  venueUuid: string,
  limit = 50
): Promise<PublicReview[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('venue_reviews')
    .select('id, reviewer_name, rating, title, body, wedding_date, submitted_at')
    .eq('venue_id', venueUuid)
    .eq('status', 'approved')
    .order('submitted_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('getApprovedReviewsForVenue:', error.message);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    reviewerName: r.reviewer_name,
    rating: r.rating,
    title: r.title,
    body: r.body,
    weddingDate: r.wedding_date,
    submittedAt: r.submitted_at,
  }));
}

/**
 * Returns the aggregate rating for a venue across approved reviews. Used
 * for VenueCard star display and JSON-LD aggregateRating.
 */
export async function getAggregateRatingForVenue(
  venueUuid: string
): Promise<AggregateRating | null> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('venue_reviews')
    .select('rating')
    .eq('venue_id', venueUuid)
    .eq('status', 'approved');
  if (error || !data || data.length === 0) return null;
  const sum = data.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
  return { average: sum / data.length, count: data.length };
}

/**
 * Bulk-fetch aggregate ratings for many venues at once. Used to decorate
 * VenueCards on listing pages without N+1 queries.
 */
export async function getAggregateRatingsForVenues(
  venueUuids: string[]
): Promise<Record<string, AggregateRating>> {
  if (venueUuids.length === 0) return {};
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('venue_reviews')
    .select('venue_id, rating')
    .in('venue_id', venueUuids)
    .eq('status', 'approved');
  if (error || !data) return {};
  const byVenue: Record<string, number[]> = {};
  for (const r of data as Array<{ venue_id: string; rating: number }>) {
    (byVenue[r.venue_id] ||= []).push(r.rating);
  }
  const out: Record<string, AggregateRating> = {};
  for (const venueId of Object.keys(byVenue)) {
    const ratings = byVenue[venueId];
    out[venueId] = {
      average: ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length,
      count: ratings.length,
    };
  }
  return out;
}

/**
 * Decorate a list of venues with their aggregate review ratings in a single
 * batched query. Used by listing pages so VenueCard can show stars without
 * triggering N+1 reads.
 */
export async function decorateVenuesWithRatings<T extends Venue>(
  venues: T[]
): Promise<T[]> {
  if (venues.length === 0) return venues;
  // venue.uuid is the Postgres UUID; rowToVenue always populates it (see
  // src/lib/catalog.ts). The optional in src/types is a legacy artifact.
  const uuids = venues
    .map((v) => v.uuid)
    .filter((u): u is string => typeof u === 'string');
  const ratings = await getAggregateRatingsForVenues(uuids);
  return venues.map((v) => {
    const r = v.uuid ? ratings[v.uuid] : undefined;
    if (!r) return v;
    return {
      ...v,
      reviews: { rating: r.average, count: r.count, reviews: [] },
    };
  });
}

// ---------------------------------------------------------------------------
// Admin moderation queries
// ---------------------------------------------------------------------------

export interface ModerationReview extends PublicReview {
  status: 'pending' | 'approved' | 'rejected';
  venueId: string;
  venueName: string;
  venueSlug: string;
  reviewerEmail: string | null;
}

/**
 * All pending reviews across all venues, newest first. Service-role read.
 * Caller must verify the user is super_admin before calling.
 */
export async function getPendingReviews(limit = 100): Promise<ModerationReview[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('venue_reviews')
    .select(
      'id, venue_id, reviewer_name, reviewer_email, rating, title, body, wedding_date, status, submitted_at, venues:venue_id(name, slug)'
    )
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    id: r.id,
    reviewerName: r.reviewer_name,
    reviewerEmail: r.reviewer_email,
    rating: r.rating,
    title: r.title,
    body: r.body,
    weddingDate: r.wedding_date,
    status: r.status,
    submittedAt: r.submitted_at,
    venueId: r.venue_id,
    venueName: r.venues?.name ?? '(unknown)',
    venueSlug: r.venues?.slug ?? '',
  }));
}
