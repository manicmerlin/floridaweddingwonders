'use client';

import { useParams } from 'next/navigation';
import VenueManagement from '@/components/VenueManagement';

export default function VenueManagePage() {
  const params = useParams();
  // Param is the slug (or legacy numeric id during the redirect window).
  // VenueManagement is auth-gated, so we pass it through; Phase 3 will
  // rewrite this to consult the catalog and resolve to a stable UUID.
  const venueId = (params.slug ?? params.id) as string;
  return <VenueManagement venueId={venueId} />;
}
