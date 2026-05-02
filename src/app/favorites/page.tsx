import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import VenueCard from '@/components/VenueCard';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import { getVenueByLegacyId } from '@/lib/catalog';
import type { Venue } from '@/types';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Saved Venues | Florida Wedding Wonders',
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const session = await getAppSession();
  if (!session) {
    redirect('/login?next=/favorites');
  }

  // Pull saved rows via service role (bypasses RLS recursion concerns).
  const admin = createSupabaseAdminClient();
  const { data: saved } = await admin
    .from('saved_venues')
    .select('venue_id, saved_at, venues:venue_id(legacy_id)')
    .eq('profile_id', session.user.id)
    .order('saved_at', { ascending: false });

  // Hydrate via the catalog so the cards reuse the same Venue shape as
  // the rest of the listing UI.
  const venues: Venue[] = [];
  for (const row of (saved ?? []) as any[]) {
    const legacyId = row.venues?.legacy_id;
    if (!legacyId) continue;
    const v = await getVenueByLegacyId(legacyId);
    if (v) venues.push(v);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved venues</h1>
            <p className="text-gray-600 mt-1">
              {venues.length === 0
                ? "Nothing saved yet — tap the heart icon on any venue to save it for later."
                : `${venues.length} venue${venues.length === 1 ? '' : 's'} saved`}
            </p>
          </div>
          <Link href="/venues" className="text-sm text-pink-600 hover:text-pink-700 font-medium">
            Browse all venues →
          </Link>
        </div>

        {venues.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <div className="text-5xl mb-3">💖</div>
            <p className="text-gray-600 mb-6">Your saved list is empty.</p>
            <Link
              href="/venues"
              className="inline-flex items-center px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-md"
            >
              Find venues to save
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {venues.map((v) => (
              <VenueCard key={v.id} venue={v} showFavorites />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
