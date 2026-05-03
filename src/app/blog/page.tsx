import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { getAllPosts, formatDate, calculateReadingTime } from '@/lib/blog';
import { PAGE_HERO_IMAGES } from '@/lib/pageImages';

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
      
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        {/* Hero Section. Same shape as /about: stable min-h container so
            object-cover doesn't crop oddly on portrait viewports, plus a
            softer brand-color overlay (was 80-85% — washed out the photo
            entirely; now ~30-40% so the wedding-planning scene reads
            through the brand gradient). */}
        <section className="relative text-white overflow-hidden flex items-center justify-center min-h-[18rem] sm:min-h-[22rem] md:min-h-[26rem]">
          <Image
            src={PAGE_HERO_IMAGES.blog}
            alt="A Florida wedding planning scene with notebook, flowers, and coffee"
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-pink-600/35 via-purple-600/30 to-blue-600/40" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="text-center">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 drop-shadow-lg">
                Florida Wedding Planning Blog
              </h1>
              <p className="text-xl lg:text-2xl text-pink-50 max-w-3xl mx-auto leading-relaxed drop-shadow">
                Expert tips, insider advice, and comprehensive guides to help you plan your dream Florida wedding.
              </p>
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No blog posts yet</h2>
                <p className="text-gray-600">Check back soon for wedding planning tips and guides!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    {/* Featured Image */}
                    {post.image ? (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
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
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
