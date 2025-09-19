'use client';

import { useState } from 'react';
import { Venue, ClaimSubmission } from '@/types';

interface VenueClaimButtonProps {
  venue: Venue;
}

export default function VenueClaimButton({ venue }: VenueClaimButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Don't show button if venue is already claimed
  if (venue.claimStatus === 'claimed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              This venue is claimed!
            </h3>
            <p className="text-sm text-green-700 mt-1">
              This venue is managed by the business owner.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    const formData = new FormData(e.currentTarget);
    const claimData: ClaimSubmission = {
      venueId: venue.id.toString(),
      userEmail: formData.get('userEmail') as string,
      userName: formData.get('userName') as string,
      businessName: formData.get('businessName') as string,
      businessType: formData.get('businessType') as string,
      additionalNotes: formData.get('additionalNotes') as string,
    };

    try {
      const response = await fetch(`/api/venues/${venue.id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(claimData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage(result.message);
        setShowForm(false);
      } else {
        setSubmitMessage(result.error || 'Failed to submit claim');
      }
    } catch (error) {
      setSubmitMessage('Failed to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitMessage) {
    return (
      <div className={`border rounded-lg p-4 mb-6 ${
        submitMessage.includes('successfully') 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <p className={`text-sm ${
          submitMessage.includes('successfully') 
            ? 'text-green-700' 
            : 'text-red-700'
        }`}>
          {submitMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {!showForm ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Own or manage this venue?
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Claim your venue listing to manage photos, information, and respond to reviews.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Claim This Venue
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Claim {venue.name}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="userName"
                  id="userName"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="userEmail"
                  id="userEmail"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  id="businessName"
                  required
                  placeholder={venue.name}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                  Business Type *
                </label>
                <select
                  name="businessType"
                  id="businessType"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select business type</option>
                  <option value="owner">Business Owner</option>
                  <option value="manager">Venue Manager</option>
                  <option value="employee">Employee</option>
                  <option value="representative">Authorized Representative</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700">
                Additional Information
              </label>
              <textarea
                name="additionalNotes"
                id="additionalNotes"
                rows={3}
                placeholder="Please provide any additional information about your relationship to this venue..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
