import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MultiQuoteForm from '@/components/multi-quote/MultiQuoteForm';
import { getVenues } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Get Quotes from Up to 5 Wedding Venues | Florida Wedding Wonders',
  description:
    'Compare quotes from up to five Florida wedding venues with one form. Pre-qualified leads, faster responses, no spam.',
  alternates: { canonical: 'https://floridaweddingwonders.com/quotes/request' },
};

export default async function MultiQuotePage() {
  const venues = await getVenues();

  // Surface only what the form needs to keep payload tiny.
  const candidates = venues.map((v) => ({
    id: v.id,
    name: v.name,
    city: v.address.city,
    venueType: v.venueType,
    capacityMin: v.capacity.min,
    capacityMax: v.capacity.max,
    primaryImage: v.images?.find((i) => i.isPrimary)?.url || v.images?.[0]?.url || null,
    contactEmail: v.contact.email,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Get Quotes from Up to 5 Venues
          </h1>
          <p className="text-pink-100 max-w-2xl mx-auto leading-relaxed">
            One form. Five venues. Pre-qualified inquiries get faster, more honest
            responses than reaching out one-by-one.
          </p>
        </header>
        <MultiQuoteForm candidates={candidates} />
      </main>
      <Footer />
    </div>
  );
}
