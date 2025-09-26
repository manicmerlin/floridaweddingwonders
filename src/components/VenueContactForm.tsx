'use client';

import React, { useState, useEffect } from 'react';
import { Venue, LeadQualificationData } from '../types';

interface VenueContactFormProps {
  venue: Venue;
  onClose: () => void;
}

const VenueContactForm: React.FC<VenueContactFormProps> = ({ venue, onClose }) => {
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'message' | 'confirm' | 'success'>('message');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the lead data to send to the venue
      const leadData = {
        // Basic contact info
        venueName: venue.name,
        venueId: venue.id,
        venueEmail: venue.contact.email,
        
        // User info and lead qualification
        userName: user?.name || '',
        userEmail: user?.email || '',
        message: message,
        
        // Pre-qualified lead data
        leadQualification: user?.leadQualification || null,
        
        // Timestamp
        submittedAt: new Date().toISOString()
      };

      // Send the lead to our API
      const response = await fetch('/api/venue-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
      });

      if (response.ok) {
        setStep('success');
      } else {
        throw new Error('Failed to send inquiry');
      }
    } catch (error) {
      console.error('Failed to send venue inquiry:', error);
      alert('Failed to send inquiry. Please try again or contact the venue directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    setStep('confirm');
  };

  const leadQualification = user?.leadQualification as LeadQualificationData;

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-lg font-semibold mb-4">Sign In Required</h3>
          <p className="text-gray-600 mb-6">
            Please sign in to contact venues and send your wedding details.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                localStorage.setItem('returnUrl', window.location.pathname);
                window.location.href = '/login';
              }}
              className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {step === 'message' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Contact {venue.name}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message to the Venue
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  rows={4}
                  placeholder="Tell the venue about your wedding vision, any specific questions, or requests you have..."
                  required
                />
              </div>

              <div className="bg-pink-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-pink-800 mb-2">Your Wedding Details Will Also Be Shared:</h4>
                {leadQualification ? (
                  <div className="text-sm text-pink-700 space-y-1">
                    <p>• Event Type: {leadQualification.eventType}</p>
                    <p>• Guest Count: {leadQualification.guestCount} guests</p>
                    <p>• Budget Range: {leadQualification.venuebudget}</p>
                    <p>• Date Flexibility: {leadQualification.dateFlexibility}</p>
                    {leadQualification.preferredDate && (
                      <p>• Preferred Date: {new Date(leadQualification.preferredDate).toLocaleDateString()}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-yellow-700">
                    <p>⚠️ Your wedding profile is incomplete. Complete it to send better qualified leads!</p>
                    <button
                      type="button"
                      onClick={() => window.location.href = '/guest/complete-profile'}
                      className="text-pink-600 underline"
                    >
                      Complete Profile First
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                >
                  Preview & Send
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'confirm' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Confirm Your Inquiry</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">This information will be sent to {venue.name}:</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-gray-700">Your Contact Information:</h5>
                  <p className="text-gray-600">Name: {user.name}</p>
                  <p className="text-gray-600">Email: {user.email}</p>
                  {leadQualification?.phoneNumber && (
                    <p className="text-gray-600">Phone: {leadQualification.phoneNumber}</p>
                  )}
                </div>

                {leadQualification && (
                  <div>
                    <h5 className="font-medium text-gray-700">Wedding Details:</h5>
                    <p className="text-gray-600">Event: {leadQualification.eventType}</p>
                    <p className="text-gray-600">Guests: {leadQualification.guestCount}</p>
                    <p className="text-gray-600">Budget: {leadQualification.venuebudget}</p>
                    <p className="text-gray-600">Date Flexibility: {leadQualification.dateFlexibility}</p>
                    {leadQualification.preferredDate && (
                      <p className="text-gray-600">
                        Preferred Date: {new Date(leadQualification.preferredDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <h5 className="font-medium text-gray-700">Your Message:</h5>
                  <p className="text-gray-600 bg-white p-3 rounded border">{message}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('message')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Back to Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-pink-300"
              >
                {isSubmitting ? 'Sending...' : 'Send Inquiry'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-6 text-center">
            <div className="text-6xl text-green-500 mb-4">✅</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Inquiry Sent Successfully!</h3>
            <p className="text-gray-600 mb-6">
              Your inquiry has been sent to {venue.name}. They have all your wedding details and will contact you soon!
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
              <ul className="text-blue-700 text-sm space-y-1 text-left">
                <li>• The venue will receive your detailed inquiry</li>
                <li>• They'll review your wedding details and budget</li>
                <li>• Expect a response within 24-48 hours</li>
                <li>• They may call or email with availability and pricing</li>
              </ul>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueContactForm;
