import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { getAllPosts, formatDate, calculateReadingTime } from '@/lib/blog';
import { PAGE_HERO_IMAGES } from '@/lib/pageImages';
import LeadMagnetCapture from '@/components/LeadMagnetCapture';

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <SEO
        title="Florida Wedding Planning Blog - Expert Tips & Guides"
        description="Discover expert wedding planning advice, venue selection tips, budget guides, and Florida wedding trends. Get insider knowledge to plan your perfect Florida wedding."
        canonical="https://floridaweddingwonders.com/blog"
        path="/blog"
        keywords={[
          'Florida wedding blog',
          'wedding planning tips',
          'venue selection guide',
          'wedding budget advice',
          'Florida wedding trends',
          'wedding planning checklist',
        ]}
      />
      
      <Navigation />

      {/* Hero Section. Hoisted OUT of the page wrapper so no inherited
          constraint can clamp its width — direct child of the page's
          top-level Fragment, sibling of <Navigation /> directly under
          <body>. Inline width:'100vw' instead of a Tailwind arbitrary
          value to guarantee a literal CSS string. */}
      <section
        style={{ width: '100vw' }}
        className="relative text-white overflow-hidden flex items-center justify-center min-h-[18rem] sm:min-h-[22rem] md:min-h-[26rem]"
      >
        <Image
          src={PAGE_HERO_IMAGES.blog}
          alt="A Florida wedding planning scene with notebook, flowers, and coffee"
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/50" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 drop-shadow-lg">
              Florida Wedding Planning Blog
            </h1>
            <p className="text-xl lg:text-2xl text-white max-w-3xl mx-auto leading-relaxed drop-shadow">
              Expert tips, insider advice, and comprehensive guides to help you plan your dream Florida wedding.
            </p>
          </div>
        </div>
      </section>

      <div className="min-h-screen bg-gray-50">
        {/* Blog Posts Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <LeadMagnetCapture source="blog" variant="inline" />
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No blog posts yet</h2>
                <p className="text-gray-600">Check back soon for wedding planning tips and guides!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post, idx) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    {/* Featured Image — first 3 cards eager-load (above the
                        fold on desktop 3-col grid). The rest lazy-load when
                        the card scrolls near the viewport. Audit caught a
                        perception bug where cards looked blank during a cold
                        CDN visit; eager-loading the first row fixes it. */}
                    {post.image ? (
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          priority={idx < 3}
                          loading={idx < 3 ? 'eager' : 'lazy'}
                          quality={85}
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
                        <span className="text-6xl">📝</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                      {/* Category */}
                      {post.category && (
                        <div className="mb-3">
                          <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 text-xs font-semibold rounded-full">
                            {post.category}
                          </span>
                        </div>
                      )}

                      {/* Title */}
                      <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors line-clamp-2">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(post.date)}</span>
                        <span>{calculateReadingTime(post.content)} min read</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Find Your Perfect Venue?
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Browse 130+ stunning Florida wedding venues with transparent pricing and real reviews.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/venues"
                className="px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition-colors"
              >
                Browse Venues
              </a>
              <a
                href="/faq"
                className="px-8 py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg transition-colors"
              >
                View FAQs
              </a>
            </div>
            {/* Phase A — venue-owner cross-link. Subtle, separate from the
                couples CTA above, so venue-owners reading the blog have a
                clear path to the package page. */}
            <p className="mt-8 text-sm text-gray-400">
              Are you a venue owner?{' '}
              <Link
                href="/venue-packages"
                className="text-pink-300 hover:text-pink-200 underline font-medium"
              >
                See our partnership tiers →
              </Link>
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
