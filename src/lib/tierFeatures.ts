// Per-tier feature flags. Pure helper, no I/O — safe to import from anywhere.
//
// The catalog data layer enforces some of these at SQL→TS mapping time
// (image truncation, description length); UI components consume the rest
// for badges and gating.

export type Tier = 'starter' | 'growth' | 'scale';

export interface TierFeatures {
  /** Hard cap on photos rendered in detail page galleries. Infinity = no cap. */
  maxPhotos: number;
  /** Hard cap on embedded videos. */
  maxVideos: number;
  /** Hard cap on the description visible to public. */
  descriptionMaxChars: number;
  /** Hard cap on tags rendered. */
  maxTags: number;
  /** How many of {phone, email, website} contact methods are surfaced. */
  contactMethods: number;
  /** Whether the "Request Info" lead-capture CTA appears. */
  showLeadCaptureCTA: boolean;
  /** What the venue-owner analytics dashboard shows. */
  analyticsLevel: 'none' | 'basic' | 'advanced';
  /** Render the Featured badge. */
  showFeaturedBadge: boolean;
  /** Render the Founding Partner badge. */
  showFoundingPartnerBadge: boolean;
  /** Eligible to appear in the homepage Featured rotation (Phase 3B). */
  homepageRotationEligible: boolean;
  /** Listing-page sort weight. Lower = appears earlier in the list. */
  sortWeight: number;
  /** Short label for chips/badges. */
  badgeLabel: string | null;
}

const STARTER: TierFeatures = {
  maxPhotos: 2,
  maxVideos: 0,
  descriptionMaxChars: 100,
  maxTags: 3,
  contactMethods: 1,
  showLeadCaptureCTA: false,
  analyticsLevel: 'none',
  showFeaturedBadge: false,
  showFoundingPartnerBadge: false,
  homepageRotationEligible: false,
  sortWeight: 30,
  badgeLabel: null,
};

const GROWTH: TierFeatures = {
  maxPhotos: Number.POSITIVE_INFINITY,
  maxVideos: 1,
  descriptionMaxChars: Number.POSITIVE_INFINITY,
  maxTags: Number.POSITIVE_INFINITY,
  contactMethods: 3,
  showLeadCaptureCTA: true,
  analyticsLevel: 'basic',
  showFeaturedBadge: true,
  showFoundingPartnerBadge: false,
  homepageRotationEligible: false,
  sortWeight: 20,
  badgeLabel: 'Featured',
};

const SCALE: TierFeatures = {
  maxPhotos: Number.POSITIVE_INFINITY,
  maxVideos: Number.POSITIVE_INFINITY,
  descriptionMaxChars: Number.POSITIVE_INFINITY,
  maxTags: Number.POSITIVE_INFINITY,
  contactMethods: 3,
  showLeadCaptureCTA: true,
  analyticsLevel: 'advanced',
  showFeaturedBadge: false,
  showFoundingPartnerBadge: true,
  homepageRotationEligible: true,
  sortWeight: 10,
  badgeLabel: 'Founding Partner',
};

export function tierFeatures(tier: Tier | null | undefined): TierFeatures {
  switch (tier) {
    case 'scale':
      return SCALE;
    case 'growth':
      return GROWTH;
    case 'starter':
    default:
      return STARTER;
  }
}

/**
 * Comparator for sorting venues with paid tiers first. Stable: ties broken
 * by name.
 */
export function compareByTier<T extends { tier?: Tier; name: string }>(a: T, b: T): number {
  const aWeight = tierFeatures(a.tier).sortWeight;
  const bWeight = tierFeatures(b.tier).sortWeight;
  if (aWeight !== bWeight) return aWeight - bWeight;
  return a.name.localeCompare(b.name);
}
