import { requireSuperAdmin } from '@/lib/authServer';
import { getPendingReviews } from '@/lib/reviews';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminReviewsClient from '@/components/admin/AdminReviewsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  await requireSuperAdmin();
  const pending = await getPendingReviews(200);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Review moderation</h1>
          <p className="text-gray-600 mt-1">
            {pending.length} pending {pending.length === 1 ? 'review' : 'reviews'}.
          </p>
        </header>
        <AdminReviewsClient initialPending={pending} />
      </main>
      <Footer />
    </div>
  );
}
