'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check environment - if production, show coming soon
    // If staging, show full site (venues page)
    const isProduction = process.env.NODE_ENV === 'production' && 
                         !window.location.hostname.includes('staging');
    
    if (isProduction) {
      router.replace('/coming-soon');
    } else {
      router.replace('/venues');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Florida Wedding Wonders...</p>
      </div>
    </div>
  );
}
