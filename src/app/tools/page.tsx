import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Free Wedding Planning Tools | Florida Wedding Wonders',
  description:
    'Free interactive tools for Florida couples — wedding budget calculator with industry-average breakdowns, and a personalized planning timeline.',
  alternates: { canonical: 'https://floridaweddingwonders.com/tools' },
};

const TOOLS = [
  {
    href: '/tools/budget',
    title: 'Wedding Budget Calculator',
    blurb:
      'Enter your total budget. See how it breaks down across the 14 categories that matter for a Florida wedding. Adjust any slider — the others auto-rebalance.',
    icon: '💰',
    cta: 'Open the calculator',
  },
  {
    href: '/tools/timeline',
    title: 'Wedding Planning Timeline',
    blurb:
      'Enter your wedding date. Get a 30-step checklist tuned for Florida — venue lead times, marriage-license windows, hurricane-season prompts. Check off as you go.',
    icon: '📅',
    cta: 'Build my timeline',
  },
];

export default function ToolsIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Free Florida Wedding Tools
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Two interactive tools, calibrated to Florida 2026 pricing and venue
            booking realities. No sign-up to use; email captures only when you
            want to save your work.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 gap-6">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition border border-gray-100 p-8 group"
            >
              <div className="text-5xl mb-4">{t.icon}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition">
                {t.title}
              </h2>
              <p className="text-gray-700 mb-4">{t.blurb}</p>
              <span className="text-pink-600 font-semibold">{t.cta} →</span>
            </Link>
          ))}
        </div>

        <aside className="mt-16 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">
            Done planning? Get matching quotes.
          </h2>
          <p className="text-pink-100 mb-4">
            Send your wedding details to up to 5 venues with one form.
          </p>
          <Link
            href="/quotes/request"
            className="inline-block bg-white text-pink-700 font-semibold px-6 py-3 rounded-lg hover:bg-pink-50"
          >
            Get matching quotes →
          </Link>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
