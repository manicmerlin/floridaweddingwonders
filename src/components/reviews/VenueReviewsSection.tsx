import type { PublicReview, AggregateRating } from '@/lib/reviews';
import ReviewSubmissionForm from './ReviewSubmissionForm';

interface Props {
  venueUuid: string;
  venueName: string;
  reviews: PublicReview[];
  aggregate: AggregateRating | null;
}

export default function VenueReviewsSection({
  venueUuid,
  venueName,
  reviews,
  aggregate,
}: Props) {
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="bg-white rounded-xl shadow-sm p-6 sm:p-8 my-6"
    >
      <header className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 id="reviews-heading" className="text-2xl font-semibold text-gray-900 mb-1">
            Reviews
          </h2>
          {aggregate ? (
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-xl" aria-label={`${aggregate.average.toFixed(1)} of 5 stars`}>
                {renderStars(aggregate.average)}
              </span>
              <span className="text-gray-700 font-medium">
                {aggregate.average.toFixed(1)}
              </span>
              <span className="text-gray-500 text-sm">
                · {aggregate.count} {aggregate.count === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No reviews yet — be the first to share your experience.</p>
          )}
        </div>
        <ReviewSubmissionForm venueUuid={venueUuid} venueName={venueName} />
      </header>

      {reviews.length > 0 && (
        <div className="space-y-5">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="border-t border-gray-100 pt-5 first:border-t-0 first:pt-0"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                <div>
                  {r.title && (
                    <h3 className="font-semibold text-gray-900">{r.title}</h3>
                  )}
                  <p className="text-sm text-gray-600">
                    {r.reviewerName}
                    {r.weddingDate && (
                      <span className="text-gray-400">
                        {' '}· wedding {new Date(r.weddingDate).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-amber-500" aria-label={`${r.rating} of 5 stars`}>
                  {renderStars(r.rating)}
                </span>
              </div>
              <p className="text-gray-800 whitespace-pre-line mt-2">{r.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function renderStars(value: number): string {
  const full = Math.round(value);
  return '★'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full));
}
