'use client';

import VenueManagement from '@/components/VenueManagement';

export default function VenueOwnerDashboard({ params }: { params: { id: string } }) {
  // In a real app, you would verify that the user is authenticated 
  // and has permission to manage this venue
  
  return <VenueManagement venueId={params.id} />;
}
