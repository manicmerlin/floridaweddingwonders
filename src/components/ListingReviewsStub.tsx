interface Props {
  /** What kind of listing — drives the noun in the empty-state copy. */
  kind: 'vendor' | 'dress-shop' | 'suit-shop';
  /** Display name of the listing. */
  name: string;
}

/**
 * Empty-state reviews section for vendor + dress-shop detail pages.
 * Mirrors the visual shape of VenueReviewsSection so when we add review
 * tables for these listings, the swap is just a data wire — no layout
 * change needed.
 *
 * Always renders the "be the first" CTA. The mailto target sends review
 * intent to the editorial inbox until we have a real submission form.
 */
export default function ListingReviewsStub({ kind, name }: Props) {
  const noun = kind === 'vendor' ? 'vendor' : kind === 'suit-shop' ? 'suit shop' : 'bridal shop';
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-stub-heading"
      className="bg-white rounded-xl shadow-sm p-6 sm:p-8 my-6 max-w-7xl mx-auto"
    >
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 id="reviews-stub-heading" className="text-2xl font-semibold text-gray-900 mb-1">
            Reviews
          </h2>
          <p className="text-sm text-gray-500">
            No reviews yet — be the first couple to share their experience.
          </p>
        </div>
        <a
          href={`mailto:hello@floridaweddingwonders.com?subject=Review%20for%20${encodeURIComponent(name)}&body=Tell%20us%20about%20your%20experience%20with%20this%20${encodeURIComponent(noun)}.`}
          className="bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          Write a review
        </a>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
        We&apos;re collecting verified reviews from real couples.{' '}
        <span className="text-gray-700 font-medium">
          Yours could be the first for {name}.
        </span>
      </div>
    </section>
  );
}
