import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import OwnerDashboardClient from '@/components/owner/OwnerDashboardClient';
import { getAppSession } from '@/lib/authServer';
import {
  getOwnedVenues,
  getInquiriesForOwner,
} from '@/lib/ownerDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Owner Dashboard | Florida Wedding Wonders',
  robots: { index: false, follow: false },
};

export default async function OwnerDashboardPage() {
  const session = await getAppSession();
  if (!session) {
    redirect('/login?next=/venue-owner/dashboard');
  }

  const [venues, inquiries] = await Promise.all([
    getOwnedVenues(session.user.id),
    getInquiriesForOwner(session.user.id),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage your venues, inquiries, and analytics.
            </p>
          </div>
          <Link
            href="/venue-packages"
            className="text-sm text-pink-600 hover:text-pink-700 font-medium underline"
          >
            View pricing & upgrade
          </Link>
        </div>

        {venues.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <div className="text-5xl mb-4">🏛️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              You don't own any venues yet
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Find your venue in our directory and click "Claim This Venue"
              to start managing your listing.
            </p>
            <Link
              href="/venues"
              className="inline-flex items-center px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-md"
            >
              Browse venues
            </Link>
          </div>
        ) : (
          <OwnerDashboardClient
            ownerEmail={session.user.email ?? ''}
            venues={venues}
            inquiries={inquiries}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
