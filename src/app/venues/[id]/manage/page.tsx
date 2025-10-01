'use client';

import { useParams } from 'next/navigation';
import VenueManagement from '@/components/VenueManagement';

export default function VenueManagePage() {
  const params = useParams();
  const venueId = params.id as string;

  return <VenueManagement venueId={venueId} />;
}
