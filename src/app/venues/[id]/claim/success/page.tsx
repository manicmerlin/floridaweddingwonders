'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ClaimSuccess({ params }: { params: { id: string } }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = `/venues/${params.id}/manage`;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [params.id]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Claim Approved! 🎉</h1>
          <p className="text-gray-600 mb-6">
            Congratulations! Your venue listing claim has been approved. You now have full access 
            to manage your venue listing, upload photos, and update information.
          </p>
          
          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What you can do now:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload high-quality photos of your venue</li>
              <li>• Update pricing and package information</li>
              <li>• Manage amenities and venue features</li>
              <li>• Respond to inquiries from couples</li>
              <li>• Track your listing performance</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              You'll be redirected to your venue management dashboard in <strong>{countdown}</strong> seconds.
            </p>
          </div>

          <div className="space-y-3">
            <Link 
              href={`/venues/${params.id}/manage`}
              className="block w-full bg-pink-600 text-white py-3 px-4 rounded-md hover:bg-pink-700 transition font-medium"
            >
              Go to Management Dashboard
            </Link>
            <Link 
              href={`/venues/${params.id}`}
              className="block w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition font-medium"
            >
              View Public Listing
            </Link>
            <Link 
              href="/venues"
              className="block w-full text-pink-600 hover:text-pink-700 py-2 font-medium"
            >
              Browse Other Venues
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
