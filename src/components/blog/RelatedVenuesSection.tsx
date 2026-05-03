import Link from 'next/link';
import type { Venue } from '@/types';

interface Props {
  venues: Venue[];
}

/**
 * Server-rendered "Related Florida venues" strip below the blog body. Slug
 * list comes from frontmatter (relatedVenues); the page hydrates each slug
 * via getVenueBySlug before passing here. Empty array → null (not rendered).
 */
export default function RelatedVenuesSection({ venues }: Props) {
  if (venues.length === 0) return null;
  return (
    <section className="not-prose my-12">
      <h3 className="text-2xl font-bold text-gray-900 mb-1">
        Related Florida venues
      </h3>
      <p className="text-gray-600 mb-6">
        Mentioned (or relevant to) the article above. Click through for photos,
        capacity, and direct contact.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {venues.map((v) => {
          const primary = v.images?.find((i) => i.isPrimary)?.url || v.images?.[0]?.url;
          return (
            <Link
              key={v.id}
              href={`/venues/${v.slug || v.id}`}
              className="group rounded-xl overflow-hidden bg-white border border-gray-200 hover:shadow-lg transition"
            >
              {primary ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primary}
                  alt={v.name}
                  className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="h-40 bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center text-3xl">
                  💒
                </div>
              )}
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-pink-600 transition">
                  {v.name}
                </h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  {v.address.city}, FL · {v.capacity.min}–{v.capacity.max} guests
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
