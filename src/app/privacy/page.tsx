import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Florida Wedding Wonders',
  description:
    'Florida Wedding Wonders privacy policy — how we collect, use, and protect your information.',
  alternates: { canonical: 'https://floridaweddingwonders.com/privacy' },
};

const LAST_UPDATED = 'May 2, 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-3xl mx-auto px-6 py-12 lg:py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-10 rounded-r">
          <p className="text-sm text-amber-900">
            <strong>Preliminary version.</strong> This policy is being finalized.
            For the current binding terms or specific privacy questions, contact{' '}
            <a
              href="mailto:hello@floridaweddingwonders.com"
              className="font-medium underline"
            >
              hello@floridaweddingwonders.com
            </a>
            .
          </p>
        </div>

        <section className="prose prose-gray max-w-none">
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Information we collect
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            When you submit an inquiry to a venue, save a venue, or sign up to
            list a venue or vendor, we collect the information you provide
            directly: your name, email address, phone number (if given), and
            wedding-planning details such as guest count, budget range, and
            preferred dates.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            We use cookies and similar technologies to keep you signed in and to
            understand how visitors use the site (Google Analytics).
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            How we use it
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We use the information you give us to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-4 space-y-2">
            <li>Forward your inquiry to the venue or vendor you contacted.</li>
            <li>Send you confirmation emails about inquiries you have submitted.</li>
            <li>Operate, secure, and improve the site.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Sharing
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            When you submit an inquiry to a specific venue or vendor, we share
            the contents of that inquiry with them so they can respond. We do
            not sell your personal information.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Your choices
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            You may request a copy of, correction to, or deletion of your
            personal data by emailing{' '}
            <a
              href="mailto:hello@floridaweddingwonders.com"
              className="text-pink-600 hover:text-pink-700"
            >
              hello@floridaweddingwonders.com
            </a>
            .
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Contact
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Questions about this policy? Reach us at{' '}
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
