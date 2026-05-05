'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Client component so it works seamlessly inside both server pages
// (most listings) and client pages (e.g. /contact). NextIntlClientProvider
// in the root layout makes useTranslations available wherever Footer
// renders.
export default function Footer() {
  const t = useTranslations('Footer');
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-pink-400">Florida Wedding Wonders</h3>
            <p className="text-gray-400">{t('tagline')}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('forCouples')}</h4>
            <div className="space-y-2 text-gray-400">
              <Link href="/venues" className="block hover:text-white transition">
                {t('browseVenues')}
              </Link>
              <Link href="/quotes/request" className="block hover:text-white transition">
                {t('getMultiQuote')}
              </Link>
              <Link href="/tools/budget" className="block hover:text-white transition">
                {t('budgetCalculator')}
              </Link>
              <Link href="/tools/timeline" className="block hover:text-white transition">
                {t('weddingTimeline')}
              </Link>
              <Link href="/blog" className="block hover:text-white transition">
                {t('weddingBlog')}
              </Link>
              <Link href="/dress-shops" className="block hover:text-white transition">
                {t('weddingDresses')}
              </Link>
              <Link href="/vendors" className="block hover:text-white transition">
                {t('weddingVendors')}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('forVenues')}</h4>
            <div className="space-y-2 text-gray-400">
              <Link href="/venue-packages" className="block hover:text-white transition">
                {t('listYourVenue')}
              </Link>
              <Link href="/vendor-owner" className="block hover:text-white transition">
                {t('vendorSignup')}
              </Link>
              <Link href="/admin" className="block hover:text-white transition">
                {t('businessPortal')}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('company')}</h4>
            <div className="space-y-2 text-gray-400">
              <Link href="/contact" className="block hover:text-white transition">
                {t('contactUs')}
              </Link>
              <Link href="/about" className="block hover:text-white transition">
                {t('aboutUs')}
              </Link>
              <Link href="/privacy" className="block hover:text-white transition">
                {t('privacyPolicy')}
              </Link>
              <Link href="/terms" className="block hover:text-white transition">
                {t('termsOfService')}
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>{t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
