import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service | Florida Wedding Wonders',
  description:
    'Florida Wedding Wonders terms of service — the rules for using our directory and listing services.',
  alternates: { canonical: 'https://floridaweddingwonders.com/terms' },
};

const LAST_UPDATED = 'May 2, 2026';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-3xl mx-auto px-6 py-12 lg:py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-10 rounded-r">
          <p className="text-sm text-amber-900">
            <strong>Preliminary version.</strong> These terms are being
            finalized. For the current binding agreement, contact{' '}
            <a
              href="mailto:hello@floridaweddingwonders.com"
              className="font-medium underline"
            >
              hello@floridaweddingwonders.com
            </a>{' '}
            before agreeing to a paid plan.
          </p>
        </div>

        <section className="prose prose-gray max-w-none">
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Using the site
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Florida Wedding Wonders is a directory of wedding venues, vendors,
            and bridal shops in Florida. By using the site you agree to use it
            for lawful purposes only and to not misuse the inquiry forms,
            listing forms, or any other interactive features.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Listings
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Venue, vendor, and dress shop listings are compiled from public
            sources and from claims submitted by the businesses themselves. If
            you operate a listed business and want to claim, edit, or remove
            your listing, contact us at{' '}
            <a
              href="mailto:hello@floridaweddingwonders.com"
              className="text-pink-600 hover:text-pink-700"
            >
              hello@floridaweddingwonders.com
            </a>
            .
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Inquiries
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We forward your inquiry to the venue or vendor you contact. We do
            not guarantee a response or any particular outcome — pricing,
            availability, and final agreements are between you and the
            business.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Paid plans
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Our paid listing plans are subject to a separate agreement signed
            at checkout. The current pricing is shown on the{' '}
            <Link
              href="/venue-packages"
              className="text-pink-600 hover:text-pink-700"
            >
              listing packages page
            </Link>
            .
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Disclaimers and liability
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The site is provided "as is" without warranties. We are not
            responsible for the accuracy of third-party listings, the conduct
            of any venue or vendor, or the outcome of any wedding planned in
            connection with the site. To the extent permitted by law, our
            liability for any claim arising from your use of the site is
            limited to the amount you have paid us in the 12 months preceding
            the claim.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Changes
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We may update these terms. The "Last updated" date at the top
            reflects the most recent revision.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Contact
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Questions about these terms? Reach us at{' '}
            <a
              href="mailto:hello@floridaweddingwonders.com"
              className="text-pink-600 hover:text-pink-700"
            >
              hello@floridaweddingwonders.com
            </a>{' '}
            or via our{' '}
            <Link href="/contact" className="text-pink-600 hover:text-pink-700">
              contact page
            </Link>
            .
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
