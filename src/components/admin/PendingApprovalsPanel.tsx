'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface VenueClaim {
  id: string;
  venue_id: string;
  user_email: string;
  user_name: string;
  user_phone: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  venue: {
    name: string;
    location: string;
    type: string;
  };
}

export default function PendingApprovalsPanel() {
  const [claims, setClaims] = useState<VenueClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingClaims();
  }, []);

  const fetchPendingClaims = async () => {
    try {
      const { data, error } = await supabase
        .from('venue_claims')
        .select(`
          *,
          venues:venue_id (
            name,
            location,
            type
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveClaim = async (claimId: string, userEmail: string, userName: string, userPhone: string) => {
    setProcessingId(claimId);
    try {
      // Call API to approve claim and create user account
      const response = await fetch('/api/admin/approve-venue-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimId,
          userEmail,
          userName,
          userPhone,
        }),
      });

      if (response.ok) {
        // Refresh the claims list
        await fetchPendingClaims();
        alert('Venue claim approved successfully! User account created and welcome email sent.');
      } else {
        const error = await response.text();
        alert(`Error approving claim: ${error}`);
      }
    } catch (error) {
      console.error('Error approving claim:', error);
      alert('Error approving claim. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectClaim = async (claimId: string, reason: string) => {
    setProcessingId(claimId);
    try {
      const response = await fetch('/api/admin/reject-venue-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimId,
          reason,
        }),
      });

      if (response.ok) {
        await fetchPendingClaims();
        alert('Venue claim rejected successfully.');
      } else {
        const error = await response.text();
        alert(`Error rejecting claim: ${error}`);
      }
    } catch (error) {
      console.error('Error rejecting claim:', error);
      alert('Error rejecting claim. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pending Venue Approvals</h1>
        <p className="text-gray-600">
          Review and approve venue ownership claims. {claims.length} pending approval{claims.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {claims.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-500">No pending venue claims to review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {claims.map((claim) => (
            <div key={claim.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {claim.venue.name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending Review
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Venue Details</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Location:</span> {claim.venue.location}</p>
                          <p><span className="font-medium">Type:</span> {claim.venue.type}</p>
                          <p><span className="font-medium">Submitted:</span> {new Date(claim.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Name:</span> {claim.user_name}</p>
                          <p><span className="font-medium">Email:</span> {claim.user_email}</p>
                          <p><span className="font-medium">Phone:</span> {claim.user_phone}</p>
                        </div>
                      </div>
                    </div>

                    {claim.message && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Message</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                          {claim.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => approveClaim(claim.id, claim.user_email, claim.user_name, claim.user_phone)}
                    disabled={processingId === claim.id}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === claim.id ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        ✅ Approve & Create Account
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const reason = prompt('Reason for rejection (optional):');
                      if (reason !== null) {
                        rejectClaim(claim.id, reason);
                      }
                    }}
                    disabled={processingId === claim.id}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ❌ Reject
                  </button>

                  <a
                    href={`mailto:${claim.user_email}?subject=Florida Wedding Wonders - Venue Claim for ${claim.venue.name}`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    ✉️ Contact Owner
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
