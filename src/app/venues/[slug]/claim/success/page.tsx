'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ClaimSuccessPage() {
  const [claimId, setClaimId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const claimIdParam = searchParams.get('claimId');
    setClaimId(claimIdParam);
  }, [searchParams]);

  const handleDashboardRedirect = () => {
    router.push('/venue-owner/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Success Header */}
          <div className="px-6 py-8 text-center border-b border-gray-200">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Claim Submitted Successfully!</h1>
            <p className="text-lg text-gray-600">
              Your venue claim request has been received and is being reviewed.
            </p>
            {claimId && (
              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Claim ID: {claimId}
              </div>
            )}
          </div>

          {/* What's Next Section */}
          <div className="px-6 py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">What happens next?</h2>
            
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Review Process</h3>
                  <p className="text-gray-600">
                    Our team will review your claim within <strong>1-2 business days</strong>. We may contact you if we need additional verification documents.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">2</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-gray-600">
                    You'll receive email updates about your claim status. Check your inbox and spam folder regularly.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">3</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Approval & Access</h3>
                  <p className="text-gray-600">
                    Once approved, you'll be able to manage your venue listing, upload photos, update information, and respond to reviews.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Questions about your claim?</p>
                  <p className="text-sm text-gray-600">
                    Email us at <a href="mailto:support@floridaweddingwonders.com" className="text-blue-600 hover:text-blue-500">support@floridaweddingwonders.com</a>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Check your claim status</p>
                  <p className="text-sm text-gray-600">
                    Visit your <Link href="/venue-owner/dashboard" className="text-blue-600 hover:text-blue-500">dashboard</Link> anytime
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDashboardRedirect}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
              <Link
                href="/venues"
                className="px-6 py-3 bg-white text-gray-700 font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors text-center"
              >
                Browse More Venues
              </Link>
            </div>

            {/* Status Tracking */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Track Your Claim Status</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="ml-2 text-sm font-medium text-gray-900">Submitted</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span className="ml-2 text-sm text-gray-500">Under Review</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span className="ml-2 text-sm text-gray-500">Approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
