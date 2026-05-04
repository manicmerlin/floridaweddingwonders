// A listing is "complete" enough to render paid-tier badges (PREMIUM,
// Featured, Founding Partner) when it has both a real contact channel
// AND some actual content. Audit incident: Hialeah Park's Founding
// Partner badge was showing on a listing with no phone, no Google Maps,
// and no real photos — directly undermining the upsell pitch. The gate
// here keeps the badge off any listing that looks abandoned.
//
// Synthesized emails (`info@<slug>.com` from src/lib/catalog.ts) don't
// count as real contact — they bounce, so promoting them would hurt
// couples who reach out. Callers must filter those out before passing.

export interface ListingCompletenessInputs {
  /** True only when at least one of phone / website / non-synthesized email exists. */
  hasContact: boolean;
  /** Description text. Counts as "has content" when longer than 50 chars. */
  description?: string;
  /** Count of real photos (not watercolor placeholders). */
  imagesCount?: number;
}

export function isListingComplete(inputs: ListingCompletenessInputs): boolean {
  if (!inputs.hasContact) return false;
  const trimmedDescLength = inputs.description?.trim().length ?? 0;
  const hasContent = trimmedDescLength > 50 || (inputs.imagesCount ?? 0) > 0;
  return hasContent;
}
