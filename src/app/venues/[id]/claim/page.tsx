'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ClaimFormData {
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  businessProof: string;
  message: string;
}

export default function ClaimListing({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [formData, setFormData] = useState<ClaimFormData>({
    claimantName: '',
    claimantEmail: '',
    claimantPhone: '',
    businessProof: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Claim submitted:', { venueId: params.id, ...formData });
      setSubmitted(true);
      setIsSubmitting(false);
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your listing claim has been submitted for review. We'll contact you within 2-3 business days with an update.
            </p>
            <div className="space-y-3">
              <Link 
                href={`/venues/${params.id}`}
                className="block w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 transition"
              >
                Back to Venue
              </Link>
              <Link 
                href="/venues"
                className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition"
              >
                Browse More Venues
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-pink-600">Florida Wedding Wonders</Link>
            <div className="flex items-center space-x-6">
              <Link href="/venues" className="text-gray-700 hover:text-pink-600 font-medium transition">
                Browse Venues
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-pink-600 font-medium transition">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Claim Your Venue Listing</h1>
          <p className="text-lg text-gray-600">
            Are you the owner or manager of this venue? Claim your listing to keep information up-to-date 
            and connect directly with couples planning their special day.
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits of Claiming Your Listing</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700">Update venue information, photos, and pricing</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700">Receive direct inquiries from couples</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700">Manage availability calendar</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700">Access to analytics and performance insights</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700">Priority placement in search results</span>
            </li>
          </ul>
        </div>

        {/* Claim Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Claim Information</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="claimantName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  id="claimantName"
                  name="claimantName"
                  required
                  value={formData.claimantName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="claimantEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Email *
                </label>
                <input
                  type="email"
                  id="claimantEmail"
                  name="claimantEmail"
                  required
                  value={formData.claimantEmail}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="your.name@venuename.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="claimantPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Business Phone Number *
              </label>
              <input
                type="tel"
                id="claimantPhone"
                name="claimantPhone"
                required
                value={formData.claimantPhone}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="businessProof" className="block text-sm font-medium text-gray-700 mb-2">
                Proof of Association *
              </label>
              <select
                id="businessProof"
                name="businessProof"
                required
                value={formData.businessProof}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Select proof type</option>
                <option value="Business License">Business License</option>
                <option value="Employment Verification">Employment Verification</option>
                <option value="Corporate ID Badge">Corporate ID Badge</option>
                <option value="Property Deed">Property Deed</option>
                <option value="Management Agreement">Management Agreement</option>
                <option value="Other">Other (specify in message)</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Please describe your role at the venue and provide any additional information that verifies your association with this business..."
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="text-yellow-800 font-medium mb-1">Verification Process</p>
                  <p className="text-yellow-700">
                    We'll verify your claim within 2-3 business days. You may be asked to provide additional 
                    documentation to confirm your association with the venue.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t">
              <Link 
                href={`/venues/${params.id}`}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Back to Venue
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-pink-600 text-white px-6 py-3 rounded-md font-medium hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Claim Request'}
              </button>
            </div>
          </form>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Questions about claiming your listing? Contact us at{' '}
            <a href="mailto:claims@floridaweddingwonders.com" className="text-pink-600 hover:underline">
              claims@floridaweddingwonders.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
