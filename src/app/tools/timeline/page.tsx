import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import TimelineClient from '@/components/tools/TimelineClient';
import { MILESTONES } from '@/lib/timelineMilestones';
import { jsonLdScript } from '@/lib/structuredData';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Florida Wedding Planning Timeline Tool | Florida Wedding Wonders',
  description:
    'Enter your wedding date, get a personalized 12-month checklist tuned for Florida weddings — venue lead times, hurricane-season contingencies, marriage-license windows.',
  alternates: { canonical: 'https://floridaweddingwonders.com/tools/timeline' },
};

const webAppLD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Florida Wedding Planning Timeline',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Any',
  description:
    'Free interactive wedding timeline that adapts to your wedding date. Tracks 30+ milestones with check-off state across sessions.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  url: 'https://floridaweddingwonders.com/tools/timeline',
};

export default function TimelinePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(webAppLD) }}
      />
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="text-center mb-10">
            <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 text-sm font-semibold rounded-full mb-4">
              Tool · Free
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
              Florida Wedding Planning Timeline
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your wedding date and we'll generate a 30-step checklist
              with Florida-specific timing — venue lead times, marriage-license
              windows, hurricane contingencies. Check off as you go.
            </p>
          </header>

          <TimelineClient milestones={MILESTONES} />

          <section className="mt-12 grid sm:grid-cols-2 gap-4">
            <a
              href="/tools/budget"
              className="bg-white border-2 border-gray-200 p-6 rounded-2xl hover:border-pink-400 transition"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Build your budget</h3>
              <p className="text-gray-600 text-sm">
                Industry-average breakdowns calibrated to Florida 2026 →
              </p>
            </a>
            <a
              href="/quotes/request"
              className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6 rounded-2xl hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-1">Get matching quotes</h3>
              <p className="text-pink-100 text-sm">From up to 5 Florida venues, one form →</p>
            </a>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
