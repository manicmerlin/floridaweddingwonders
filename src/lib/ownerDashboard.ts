// Server-only data helpers for the venue-owner dashboard.
//
// All reads use service-role client + explicit ownership checks so we don't
// rely on RLS for authorization (RLS is defense-in-depth). Every public
// function takes a `profileId` and verifies it matches the row before
// returning data.

import { createSupabaseAdminClient } from './supabaseServer';
import { tierFeatures, type Tier } from './tierFeatures';

export interface OwnedVenueSummary {
  ownershipId: string;
  venueId: string;
  legacyId: string | null;
  slug: string;
  name: string;
  city: string | null;
  tier: Tier;
  imageCount: number;
  // Last 30d analytics
  views30d: number;
  uniqueViews30d: number;
  newLeadsCount: number;     // state='new'
  totalLeadsLifetime: number;
  ownershipStatus: 'active' | 'pending' | 'revoked';
}

/**
 * List every venue this profile owns (status='active') with summary stats.
 * Returns [] if the profile owns nothing — caller renders the empty-state.
 */
export async function getOwnedVenues(profileId: string): Promise<OwnedVenueSummary[]> {
  const admin = createSupabaseAdminClient();

  const { data: ownerships, error: oErr } = await admin
    .from('venue_ownerships')
    .select('id, venue_id, status')
    .eq('profile_id', profileId)
    .eq('status', 'active');
  if (oErr || !ownerships || ownerships.length === 0) return [];

  const venueIds = ownerships.map((o: any) => o.venue_id);

  const [{ data: venues }, { data: views }, { data: leads }] = await Promise.all([
    admin
      .from('venues')
      .select('id, legacy_id, slug, name, city, tier, images')
      .in('id', venueIds),
    admin
      .from('venue_views')
      .select('venue_id, is_unique, viewed_at')
      .in('venue_id', venueIds)
      .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    admin
      .from('venue_leads')
      .select('venue_id, state'),
  ]);

  const venueRows = (venues ?? []) as any[];
  const viewRows = (views ?? []) as any[];
  const leadRows = (leads ?? []) as any[];

  // Aggregate by venue_id. venue_leads.venue_id is TEXT (legacy_id), so we
  // map both UUIDs (venue_views) and legacy_ids (venue_leads) per venue.
  const summaries: OwnedVenueSummary[] = venueRows.map((v) => {
    const venueViews = viewRows.filter((vv) => vv.venue_id === v.id);
    const venueLeads = leadRows.filter(
      (l) => l.venue_id === v.legacy_id || l.venue_id === v.id
    );
    const ownership = ownerships.find((o: any) => o.venue_id === v.id);
    return {
      ownershipId: ownership?.id ?? '',
      venueId: v.id,
      legacyId: v.legacy_id,
      slug: v.slug,
      name: v.name,
      city: v.city,
      tier: (v.tier as Tier) ?? 'starter',
      imageCount: Array.isArray(v.images) ? v.images.length : 0,
      views30d: venueViews.length,
      uniqueViews30d: venueViews.filter((vv) => vv.is_unique).length,
      newLeadsCount: venueLeads.filter((l) => l.state === 'new').length,
      totalLeadsLifetime: venueLeads.length,
      ownershipStatus: ownership?.status ?? 'active',
    };
  });

  // Surface paid-tier venues first (matches public listing convention).
  summaries.sort((a, b) => {
    const wA = tierFeatures(a.tier).sortWeight;
    const wB = tierFeatures(b.tier).sortWeight;
    return wA !== wB ? wA - wB : a.name.localeCompare(b.name);
  });

  return summaries;
}

/**
 * Confirm the caller owns the given venue. Returns the venue row + ownership
 * row when authorized; null when not. Use this on every per-venue server
 * action / route.
 */
export async function requireOwnership(
  profileId: string,
  venueId: string
): Promise<{ venue: any; ownership: any } | null> {
  const admin = createSupabaseAdminClient();
  const { data: ownership } = await admin
    .from('venue_ownerships')
    .select('id, profile_id, venue_id, status, role')
    .eq('profile_id', profileId)
    .eq('venue_id', venueId)
    .eq('status', 'active')
    .maybeSingle();
  if (!ownership) return null;
  const { data: venue } = await admin
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .maybeSingle();
  if (!venue) return null;
  return { venue, ownership };
}

/**
 * Look up venue UUID from slug (or legacy_id if numeric). Used by ownership
 * gates that receive a slug from the URL.
 */
export async function resolveVenueIdFromParam(slugOrId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  // UUID? Use directly.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)) {
    return slugOrId;
  }
  // Numeric? Try legacy_id.
  if (/^\d+$/.test(slugOrId)) {
    const { data } = await admin
      .from('venues')
      .select('id')
      .eq('legacy_id', slugOrId)
      .maybeSingle();
    return data?.id ?? null;
  }
  // Otherwise: slug.
  const { data } = await admin
    .from('venues')
    .select('id')
    .eq('slug', slugOrId)
    .maybeSingle();
  return data?.id ?? null;
}

export interface InquiryRow {
  id: string;
  venueId: string;
  venueName: string;
  venueSlug: string;
  state: 'new' | 'viewed' | 'responded' | 'archived';
  userName: string;
  userEmail: string;
  userPhone: string | null;
  message: string;
  qualification: any;
  ownerNotes: string | null;
  submittedAt: string;
  viewedAt: string | null;
  respondedAt: string | null;
}

/**
 * All inquiries across every venue this profile owns. Sorted newest-first.
 */
export async function getInquiriesForOwner(profileId: string): Promise<InquiryRow[]> {
  const admin = createSupabaseAdminClient();

  const { data: ownerships } = await admin
    .from('venue_ownerships')
    .select('venue_id')
    .eq('profile_id', profileId)
    .eq('status', 'active');
  if (!ownerships || ownerships.length === 0) return [];

  const ownedVenueIds = ownerships.map((o: any) => o.venue_id as string);

  // Need venue legacy_ids since venue_leads.venue_id is TEXT (legacy_id).
  const { data: venues } = await admin
    .from('venues')
    .select('id, legacy_id, slug, name')
    .in('id', ownedVenueIds);
  if (!venues) return [];

  const idLookup = new Map<string, { id: string; legacy_id: string | null; slug: string; name: string }>();
  for (const v of venues as any[]) {
    if (v.legacy_id) idLookup.set(v.legacy_id, v);
    idLookup.set(v.id, v); // also accept UUID lookups
  }

  const venueIdKeys = Array.from(idLookup.keys());

  const { data: leads } = await admin
    .from('venue_leads')
    .select(
      'id, venue_id, venue_name, state, user_name, user_email, user_phone, message, qualification, owner_notes, submitted_at, viewed_at, responded_at'
    )
    .in('venue_id', venueIdKeys)
    .order('submitted_at', { ascending: false });
  if (!leads) return [];

  return (leads as any[]).map((l) => {
    const v = idLookup.get(l.venue_id);
    return {
      id: l.id,
      venueId: v?.id ?? l.venue_id,
      venueName: v?.name ?? l.venue_name,
      venueSlug: v?.slug ?? '',
      state: (l.state ?? 'new') as InquiryRow['state'],
      userName: l.user_name,
      userEmail: l.user_email,
      userPhone: l.user_phone,
      message: l.message,
      qualification: l.qualification,
      ownerNotes: l.owner_notes,
      submittedAt: l.submitted_at,
      viewedAt: l.viewed_at,
      respondedAt: l.responded_at,
    };
  });
}

export interface AnalyticsSummary {
  views30d: number;
  uniqueViews30d: number;
  viewsLifetime: number;
  inquiriesLifetime: number;
  conversionRate30d: number;   // inquiries30d / views30d
  inquiries30d: number;
}

/**
 * Per-venue analytics. Owner dashboard surfaces these in the per-venue card
 * and on the edit page sidebar.
 */
export async function getAnalyticsForVenue(
  venueId: string,
  legacyId: string | null
): Promise<AnalyticsSummary> {
  const admin = createSupabaseAdminClient();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: viewsLifetime },
    { data: views30Rows },
    { count: inquiriesLifetime },
    { count: inquiries30 },
  ] = await Promise.all([
    admin.from('venue_views').select('*', { count: 'exact', head: true }).eq('venue_id', venueId),
    admin.from('venue_views').select('is_unique').eq('venue_id', venueId).gte('viewed_at', since30),
    admin
      .from('venue_leads')
      .select('*', { count: 'exact', head: true })
      .in('venue_id', [legacyId, venueId].filter(Boolean) as string[]),
    admin
      .from('venue_leads')
      .select('*', { count: 'exact', head: true })
      .in('venue_id', [legacyId, venueId].filter(Boolean) as string[])
      .gte('submitted_at', since30),
  ]);

  const views30d = (views30Rows ?? []).length;
  const uniqueViews30d = (views30Rows ?? []).filter((v: any) => v.is_unique).length;
  const inq30 = inquiries30 ?? 0;

  return {
    views30d,
    uniqueViews30d,
    viewsLifetime: viewsLifetime ?? 0,
    inquiriesLifetime: inquiriesLifetime ?? 0,
    inquiries30d: inq30,
    conversionRate30d: views30d > 0 ? inq30 / views30d : 0,
  };
}
