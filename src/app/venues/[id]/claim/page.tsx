'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Venue } from '@/types';

interface ClaimFormData {
  userName: string;
  userEmail: string;
  businessName: string;
  businessType: string;
  phoneNumber: string;
  businessAddress: string;
  relationshipToVenue: string;
  additionalNotes: string;
}

export default function VenueClaimPage() {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState<ClaimFormData>({
    userName: '',
    userEmail: '',
    businessName: '',
    businessType: '',
    phoneNumber: '',
    businessAddress: '',
    relationshipToVenue: '',
    additionalNotes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const params = useParams();
  const venueId = params.id as string;

  useEffect(() => {
    // Check authentication
    const checkAuth = () => {
      const authToken = document.cookie.includes('auth-token') || localStorage.getItem('venueOwnerAuth');
      if (!authToken) {
        localStorage.setItem('returnUrl', `/venues/${venueId}/claim`);
        router.push('/login');
        return;
      }
      setIsAuthenticated(true);
    };

    // Load venue data
    const loadVenue = async () => {
      try {
        const response = await fetch(`/api/venues/${venueId}`);
        if (response.ok) {
          const data = await response.json();
          setVenue(data.venue);
          setFormData(prev => ({
            ...prev,
            businessName: data.venue?.name || ''
          }));
        } else {
          // Fallback to mock data if API fails
          const mockVenues = await import('@/lib/mockData');
          const mockVenue = mockVenues.mockVenues.find(v => v.id.toString() === venueId);
          if (mockVenue) {
            setVenue(mockVenue);
            setFormData(prev => ({
              ...prev,
              businessName: mockVenue.name
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load venue:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    loadVenue();
  }, [venueId, router]);

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

    try {
      const response = await fetch(`/api/venues/${venueId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          venueId: venueId,
          venueName: venue?.name
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to success page
        router.push(`/venues/${venueId}/claim/success?claimId=${result.claimId}`);
      } else {
        alert(result.error || 'Failed to submit claim');
      }
    } catch (error) {
      console.error('Failed to submit claim:', error);
      alert('Failed to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue Not Found</h1>
            <p className="text-gray-600 mb-6">The venue you're trying to claim could not be found.</p>
            <button
              onClick={() => router.push('/venues')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Browse Venues
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (venue.claimStatus === 'claimed') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue Already Claimed</h1>
            <p className="text-gray-600 mb-6">This venue has already been claimed and is being managed by the business owner.</p>
            <button
              onClick={() => router.push(`/venues/${venueId}`)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              View Venue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Claim Your Venue</h1>
            <p className="mt-2 text-lg text-gray-600">
              Claim <span className="font-semibold text-blue-600">{venue.name}</span> to manage your listing
            </p>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {typeof venue.address === 'string' ? venue.address : `${venue.address.street}, ${venue.address.city}, ${venue.address.state} ${venue.address.zipCode}`}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="userName"
                    id="userName"
                    required
                    value={formData.userName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your full name"
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
                    value={formData.userEmail}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    id="phoneNumber"
                    required
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    id="businessName"
                    required
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Official business name"
                  />
                </div>
                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                    Your Role *
                  </label>
                  <select
                    name="businessType"
                    id="businessType"
                    required
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select your role</option>
                    <option value="owner">Business Owner</option>
                    <option value="manager">Venue Manager</option>
                    <option value="employee">Employee</option>
                    <option value="representative">Authorized Representative</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700">
                    Business Address *
                  </label>
                  <input
                    type="text"
                    name="businessAddress"
                    id="businessAddress"
                    required
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Business mailing address"
                  />
                </div>
              </div>
            </div>

            {/* Relationship to Venue */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Venue Relationship</h2>
              <div>
                <label htmlFor="relationshipToVenue" className="block text-sm font-medium text-gray-700">
                  Describe your relationship to this venue *
                </label>
                <textarea
                  name="relationshipToVenue"
                  id="relationshipToVenue"
                  required
                  rows={3}
                  value={formData.relationshipToVenue}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Please explain how you are connected to this venue (e.g., 'I am the owner', 'I manage daily operations', etc.)"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700">
                Additional Information
              </label>
              <textarea
                name="additionalNotes"
                id="additionalNotes"
                rows={4}
                value={formData.additionalNotes}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Any additional information that would help us verify your claim..."
              />
            </div>

            {/* Terms and Conditions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• We'll review your claim within 1-2 business days</li>
                <li>• You'll receive email updates on your claim status</li>
                <li>• Once approved, you can manage your venue listing</li>
                <li>• We may contact you for additional verification</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting Claim...' : 'Submit Claim Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
