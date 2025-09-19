'use client';

import { useState, useEffect } from 'react';
import { VenueClaim } from '@/types';

export default function ClaimsManagement() {
  const [claims, setClaims] = useState<VenueClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<VenueClaim | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const response = await fetch('/api/claims');
      if (response.ok) {
        const result = await response.json();
        setClaims(result.claims || []);
      }
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAction = async (claimId: string, action: 'approve' | 'deny', adminNotes?: string) => {
    setActionLoading(claimId);
    
    try {
      const response = await fetch(`/api/admin/claims/${claimId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          adminNotes
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Update local state
        setClaims(claims.map(claim => 
          claim.id === claimId 
            ? { ...claim, status: action === 'approve' ? 'approved' : 'denied', adminNotes }
            : claim
        ));
        setSelectedClaim(null);
      } else {
        const error = await response.json();
        alert(`Failed to ${action} claim: ${error.error}`);
      }
    } catch (error) {
      alert(`Failed to ${action} claim. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Approved</span>;
      case 'denied':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Denied</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Venue Claims Management</h1>
        <p className="mt-2 text-gray-600">Review and manage venue ownership claims</p>
      </div>

      {claims.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Claims Yet</h3>
          <p className="text-gray-600">When venue owners submit claims, they'll appear here for review.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {claims.map((claim) => (
              <li key={claim.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-medium text-blue-600 truncate">
                          {claim.venueName}
                        </p>
                        {getStatusBadge(claim.status)}
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            {claim.userEmail}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            {formatDate(claim.submittedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        <span className="font-medium">Claimant:</span> {claim.userName}
                      </div>
                      {claim.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {claim.notes}
                        </div>
                      )}
                      {claim.adminNotes && (
                        <div className="mt-2 text-sm text-blue-600">
                          <span className="font-medium">Admin Notes:</span> {claim.adminNotes}
                        </div>
                      )}
                    </div>
                    
                    {claim.status === 'pending' && (
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => setSelectedClaim(claim)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Review Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Review Claim for {selectedClaim.venueName}
              </h3>
              
              <div className="space-y-3 mb-6">
                <div>
                  <span className="font-medium text-gray-700">Claimant:</span>
                  <p className="text-gray-600">{selectedClaim.userName} ({selectedClaim.userEmail})</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Submitted:</span>
                  <p className="text-gray-600">{formatDate(selectedClaim.submittedAt)}</p>
                </div>
                {selectedClaim.notes && (
                  <div>
                    <span className="font-medium text-gray-700">Additional Notes:</span>
                    <p className="text-gray-600">{selectedClaim.notes}</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (optional)
                </label>
                <textarea
                  id="adminNotes"
                  rows={3}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any notes about this decision..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={actionLoading !== null}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const adminNotes = (document.getElementById('adminNotes') as HTMLTextAreaElement)?.value;
                    handleClaimAction(selectedClaim.id, 'deny', adminNotes);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                  disabled={actionLoading === selectedClaim.id}
                >
                  {actionLoading === selectedClaim.id ? 'Processing...' : 'Deny'}
                </button>
                <button
                  onClick={() => {
                    const adminNotes = (document.getElementById('adminNotes') as HTMLTextAreaElement)?.value;
                    handleClaimAction(selectedClaim.id, 'approve', adminNotes);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={actionLoading === selectedClaim.id}
                >
                  {actionLoading === selectedClaim.id ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
