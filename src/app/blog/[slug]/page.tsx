import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { getPostBySlug, getAllPosts, formatDate, calculateReadingTime } from '@/lib/blog';
import { generateArticleSchema } from '@/lib/seo';
import { remark } from 'remark';
import html from 'remark-html';

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  
  if (!post) {
    notFound();
  }

  // Convert markdown to HTML
  const processedContent = await remark()
    .use(html)
    .process(post.content);
  const contentHtml = processedContent.toString();

  // Get related posts (same category, exclude current)
  const allPosts = getAllPosts();
  const relatedPosts = allPosts
    .filter(p => p.slug !== params.slug && p.category === post.category)
    .slice(0, 3);

  // Generate Article structured data
  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.description,
    author: post.author,
    datePublished: post.date,
    image: post.image,
    url: `https://floridaweddingwonders.com/blog/${post.slug}`,
  });

  return (
    <>
      <SEO
        title={`${post.title} - Florida Wedding Wonders Blog`}
        description={post.description}
        canonical={`https://floridaweddingwonders.com/blog/${post.slug}`}
        path={`/blog/${post.slug}`}
        keywords={post.keywords}
        ogImage={post.image}
        jsonLd={[articleSchema]}
      />
      
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        {/* Hero Section with Featured Image */}
        <article>
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link href="/" className="hover:text-pink-600">Home</Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-pink-600">Blog</Link>
                <span>/</span>
                <span className="text-gray-900">{post.category}</span>
              </nav>

              {/* Category Badge */}
              {post.category && (
                <div className="mb-4">
                  <span className="inline-block px-4 py-1.5 bg-pink-100 text-pink-700 text-sm font-semibold rounded-full">
                    {post.category}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(post.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{calculateReadingTime(post.content)} min read</span>
                </div>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {post.image && (
            <div className="relative h-96 w-full bg-gray-200">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                priority
                quality={90}
                sizes="100vw"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div 
              className="prose prose-lg prose-pink max-w-none
                prose-headings:font-bold prose-headings:text-gray-900
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-pink-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-ul:my-6 prose-ul:space-y-2
                prose-li:text-gray-700 prose-li:leading-relaxed
                prose-blockquote:border-l-4 prose-blockquote:border-pink-500 prose-blockquote:pl-6 prose-blockquote:italic
                prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-2 prose-code:py-1 prose-code:rounded"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>

          {/* Social Sharing */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Share this article:</span>
              <div className="flex gap-3">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=https://floridaweddingwonders.com/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  aria-label="Share on Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=https://floridaweddingwonders.com/blog/${post.slug}&text=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
                  aria-label="Share on Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a
                  href={`https://www.pinterest.com/pin/create/button/?url=https://floridaweddingwonders.com/blog/${post.slug}&description=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  aria-label="Share on Pinterest"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="bg-gray-100 py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Articles</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.slug}
                      href={`/blog/${relatedPost.slug}`}
                      className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                      {relatedPost.image ? (
                        <div className="relative h-40 overflow-hidden">
                          <Image
                            src={relatedPost.image}
                            alt={relatedPost.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 1024px) 100vw, 33vw"
                            loading="lazy"
                            quality={85}
                          />
                        </div>
                      ) : (
                        <div className="h-40 bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
                          <span className="text-5xl">📝</span>
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2 mb-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-gray-600">{formatDate(relatedPost.date)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* CTA Section */}
          <section className="py-16 bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 text-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Ready to Plan Your Florida Wedding?
              </h2>
              <p className="text-xl text-pink-100 mb-8 leading-relaxed">
                Discover 130+ stunning venues, connect with trusted vendors, and make your wedding dreams come true.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/venues"
                  className="px-8 py-3 bg-white hover:bg-gray-100 text-pink-600 font-semibold rounded-lg transition-colors"
                >
                  Browse Venues
                </a>
                <a
                  href="/blog"
                  className="px-8 py-3 bg-pink-700 hover:bg-pink-800 text-white font-semibold rounded-lg transition-colors border-2 border-white/30"
                >
                  Read More Articles
                </a>
              </div>
            </div>
          </section>
        </article>

        <Footer />
      </div>
    </>
  );
}
