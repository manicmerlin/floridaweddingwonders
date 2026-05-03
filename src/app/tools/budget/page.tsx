import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BudgetCalculatorClient from '@/components/tools/BudgetCalculatorClient';
import { BUDGET_CATEGORIES } from '@/lib/budgetCategories';
import { jsonLdScript } from '@/lib/structuredData';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Florida Wedding Budget Calculator | Florida Wedding Wonders',
  description:
    'Plan your Florida wedding budget with category-by-category breakdowns. Adjust the sliders, save your plan, see venues that fit your venue+catering budget.',
  alternates: { canonical: 'https://floridaweddingwonders.com/tools/budget' },
};

const webAppLD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Florida Wedding Budget Calculator',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any',
  description:
    'Free interactive wedding budget calculator with industry-average category breakdowns, calibrated to Florida 2026 pricing.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  url: 'https://floridaweddingwonders.com/tools/budget',
};

export default function BudgetPage() {
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
              Florida Wedding Budget Calculator
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your total budget. We'll split it across the 14 categories
              that actually matter for a Florida wedding, using industry-average
              percentages from real 2026 contracts. Adjust any slider — the
              others auto-rebalance.
            </p>
          </header>

          <BudgetCalculatorClient categories={BUDGET_CATEGORIES} />

          <section className="mt-12 grid sm:grid-cols-2 gap-4">
            <a
              href="/quotes/request"
              className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6 rounded-2xl hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-1">Find venues in your venue+catering budget</h3>
              <p className="text-pink-100 text-sm">Get matching quotes from up to 5 venues →</p>
            </a>
            <a
              href="/tools/timeline"
              className="bg-white border-2 border-gray-200 p-6 rounded-2xl hover:border-pink-400 transition"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Plan your timeline</h3>
              <p className="text-gray-600 text-sm">12-month checklist tailored to your wedding date →</p>
            </a>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
