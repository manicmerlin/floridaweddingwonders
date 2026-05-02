import { redirect } from 'next/navigation';

// Legacy route — Nav now links at /favorites and the canonical saved-venues
// page lives there with DB-backed saves (Phase 3B). This route redirects so
// old bookmarks keep working.
export default function GuestSavedVenuesRedirect(): never {
  redirect('/favorites');
}
