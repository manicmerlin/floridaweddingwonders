/* eslint-disable no-console */
//
// scripts/export-cold-outreach.ts
//
// Generates a CSV of the top 50 unclaimed venues ranked by potential value.
// "Potential value" is a composite score:
//   30% weight on inquiry count (last 90 days)
//   40% weight on view count (last 30 days)
//   20% weight on having a real contact_email (vs. auto-synthesized)
//   10% weight on tier (scale > growth > starter — already-paid implies
//        relationship, but legitimate Stripe-purchased rows skip this script
//        entirely via the venue_ownerships gate)
//
// Output: /tmp/cold-outreach-top-50.csv with columns the user can paste
// directly into Mailchimp / Gmail / their CRM.
//
// Run with:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npx tsx scripts/export-cold-outreach.ts

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const SITE = 'https://floridaweddingwonders.com';
const NOW = Date.now();
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

interface VenueRow {
  id: string;
  legacy_id: string | null;
  slug: string;
  name: string;
  city: string | null;
  region: string | null;
  venue_type: string | null;
  tier: string | null;
  contact_email: string | null;
  contact_email_real: boolean | null;
  contact_phone: string | null;
}

async function main() {
  console.log('export-cold-outreach: fetching unclaimed venues...');

  // Pull all venues + ownership state.
  const { data: ownedVenueIds } = await supabase
    .from('venue_ownerships')
    .select('venue_id')
    .eq('status', 'active');
  const ownedSet = new Set((ownedVenueIds ?? []).map((o: any) => o.venue_id as string));

  const { data: venues, error: vErr } = await supabase
    .from('venues')
    .select('id, legacy_id, slug, name, city, region, venue_type, tier, contact_email, contact_email_real, contact_phone');
  if (vErr || !venues) {
    console.error('Could not fetch venues:', vErr?.message);
    process.exit(1);
  }
  const unclaimed = (venues as VenueRow[]).filter((v) => !ownedSet.has(v.id));
  console.log(`  ${venues.length} total venues, ${unclaimed.length} unclaimed`);

  // Aggregate views (30d) + leads (90d). venue_views.venue_id is UUID;
  // venue_leads.venue_id is TEXT (legacy_id). Pull both.
  const since30 = new Date(NOW - THIRTY_DAYS_MS).toISOString();
  const since90 = new Date(NOW - NINETY_DAYS_MS).toISOString();

  const [{ data: views }, { data: leads }] = await Promise.all([
    supabase
      .from('venue_views')
      .select('venue_id, is_unique')
      .gte('viewed_at', since30),
    supabase
      .from('venue_leads')
      .select('venue_id')
      .gte('submitted_at', since90),
  ]);

  const viewsByVenue = new Map<string, { total: number; unique: number }>();
  for (const v of (views ?? []) as any[]) {
    const cur = viewsByVenue.get(v.venue_id) ?? { total: 0, unique: 0 };
    cur.total += 1;
    if (v.is_unique) cur.unique += 1;
    viewsByVenue.set(v.venue_id, cur);
  }
  const leadsByVenueKey = new Map<string, number>();
  for (const l of (leads ?? []) as any[]) {
    leadsByVenueKey.set(l.venue_id, (leadsByVenueKey.get(l.venue_id) ?? 0) + 1);
  }

  // Compute composite score per venue.
  interface Scored extends VenueRow {
    views30d: number;
    uniqueViews30d: number;
    leads90d: number;
    score: number;
    pitchVariant: 'A_inquiries' | 'B_seo_traffic' | 'C_founding_partner';
  }

  const scored: Scored[] = unclaimed.map((v) => {
    const views = viewsByVenue.get(v.id) ?? { total: 0, unique: 0 };
    const leads =
      (leadsByVenueKey.get(v.legacy_id ?? '') ?? 0) +
      (leadsByVenueKey.get(v.id) ?? 0);

    // Normalize each signal 0-100, then weighted sum.
    const inqScore = Math.min(100, leads * 20);          // 5+ leads = max
    const viewScore = Math.min(100, views.total * 2);    // 50+ views = max
    const emailScore = v.contact_email_real ? 100 : 0;
    const tierScore = v.tier === 'scale' ? 100 : v.tier === 'growth' ? 60 : 30;

    const score =
      0.30 * inqScore +
      0.40 * viewScore +
      0.20 * emailScore +
      0.10 * tierScore;

    // Pick pitch variant based on signal strengths.
    let variant: Scored['pitchVariant'] = 'A_inquiries';
    if (leads >= 2) {
      variant = 'A_inquiries';
    } else if (views.total >= 30) {
      variant = 'B_seo_traffic';
    } else {
      variant = 'C_founding_partner';
    }

    return {
      ...v,
      views30d: views.total,
      uniqueViews30d: views.unique,
      leads90d: leads,
      score,
      pitchVariant: variant,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const top50 = scored.slice(0, 50);

  // Build CSV.
  const headers = [
    'name',
    'slug',
    'city',
    'region',
    'venue_type',
    'tier',
    'inquiries_90d',
    'views_30d',
    'unique_views_30d',
    'contact_email',
    'contact_email_real',
    'contact_phone',
    'pitch_url',
    'claim_url',
    'recommended_pitch_variant',
    'score',
  ];
  const lines = [headers.join(',')];
  for (const r of top50) {
    const row = [
      r.name,
      r.slug,
      r.city ?? '',
      r.region ?? '',
      r.venue_type ?? '',
      r.tier ?? 'starter',
      r.leads90d,
      r.views30d,
      r.uniqueViews30d,
      r.contact_email ?? '',
      r.contact_email_real ? 'true' : 'false',
      r.contact_phone ?? '',
      `${SITE}/venues/${r.slug}`,
      `${SITE}/claim/${r.slug}?utm_source=cold_email&utm_campaign=phase_6`,
      r.pitchVariant,
      r.score.toFixed(1),
    ];
    lines.push(row.map(csvEscape).join(','));
  }

  const out = '/tmp/cold-outreach-top-50.csv';
  writeFileSync(out, lines.join('\n'), 'utf8');

  console.log(`\nWrote ${top50.length} rows to ${out}`);
  console.log('\nTop 5 by score:');
  for (const r of top50.slice(0, 5)) {
    console.log(
      `  [${r.score.toFixed(1)}] ${r.name} — ${r.city}, ${r.tier} — leads=${r.leads90d}, views=${r.views30d}, variant=${r.pitchVariant}`
    );
  }
  console.log(`\nVariant distribution:`);
  const counts = top50.reduce<Record<string, number>>((acc, r) => {
    acc[r.pitchVariant] = (acc[r.pitchVariant] ?? 0) + 1;
    return acc;
  }, {});
  for (const [v, n] of Object.entries(counts)) {
    console.log(`  ${v}: ${n}`);
  }
}

function csvEscape(value: unknown): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
