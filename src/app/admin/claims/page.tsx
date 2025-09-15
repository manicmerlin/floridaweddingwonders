'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ClaimRequest {
  id: string;
  venueId: string;
  venueName: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  businessProof: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
}

// Mock data for claims
const mockClaims: ClaimRequest[] = [
  {
    id: '1',
    venueId: '5',
    venueName: 'The Breakers Palm Beach',
    claimantName: 'Sarah Johnson',
    claimantEmail: 'sarah@thebreakers.com',
    claimantPhone: '(561) 655-6611',
    businessProof: 'Business License - FL123456789',
    message: 'I am the Events Director at The Breakers and would like to claim our venue listing to keep information current.',
    status: 'pending',
    submittedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    venueId: '12',
    venueName: 'Vizcaya Museum and Gardens',
    claimantName: 'Michael Rodriguez',
    claimantEmail: 'mrodriguez@vizcaya.org',
    claimantPhone: '(305) 250-9133',
    businessProof: 'Employment Verification',
    message: 'As the Special Events Manager, I need to update our venue information and pricing.',
    status: 'approved',
    submittedAt: new Date('2024-01-10')
  },
  {
    id: '3',
    venueId: '8',
    venueName: 'Four Seasons Resort Palm Beach',
    claimantName: 'Lisa Chen',
    claimantEmail: 'lisa.chen@fourseasons.com',
    claimantPhone: '(561) 582-2800',
    businessProof: 'Corporate ID Badge',
    message: 'I manage wedding events at Four Seasons and need access to update our listing.',
    status: 'pending',
    submittedAt: new Date('2024-01-12')
  }
];

export default function ClaimsManagement() {
  const [claims, setClaims] = useState<ClaimRequest[]>(mockClaims);
  const [selectedClaim, setSelectedClaim] = useState<ClaimRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStatusUpdate = (claimId: string, newStatus: 'approved' | 'rejected') => {
    setClaims(claims.map(claim => 
      claim.id === claimId ? { ...claim, status: newStatus } : claim
    ));
    setIsModalOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingClaims = claims.filter(c => c.status === 'pending');
  const approvedClaims = claims.filter(c => c.status === 'approved');
  const rejectedClaims = claims.filter(c => c.status === 'rejected');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-2xl font-bold text-gray-900">SoFlo Venues Admin</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/venues" className="text-gray-700 hover:text-gray-900 font-medium">
                View Site
              </Link>
              <Link href="/admin" className="text-gray-700 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Listing Claims Management</h1>
          <p className="text-gray-600">Review and manage venue listing claim requests from venue owners</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{pendingClaims.length}</div>
            <div className="text-gray-600">Pending Claims</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{approvedClaims.length}</div>
            <div className="text-gray-600">Approved Claims</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">{rejectedClaims.length}</div>
            <div className="text-gray-600">Rejected Claims</div>
          </div>
        </div>

        {/* Claims Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Claim Requests</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claimant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{claim.venueName}</div>
                        <div className="text-sm text-gray-500">ID: {claim.venueId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{claim.claimantName}</div>
                      <div className="text-sm text-gray-500">{claim.businessProof}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{claim.claimantEmail}</div>
                      <div className="text-sm text-gray-500">{claim.claimantPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.submittedAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedClaim(claim);
                          setIsModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Review
                      </button>
                      <Link href={`/venues/${claim.venueId}`} className="text-pink-600 hover:text-pink-900">
                        View Venue
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {isModalOpen && selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Review Claim Request</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Venue Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Venue:</strong> {selectedClaim.venueName}</p>
                  <p><strong>Venue ID:</strong> {selectedClaim.venueId}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Claimant Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Name:</strong> {selectedClaim.claimantName}</p>
                  <p><strong>Email:</strong> {selectedClaim.claimantEmail}</p>
                  <p><strong>Phone:</strong> {selectedClaim.claimantPhone}</p>
                  <p><strong>Business Proof:</strong> {selectedClaim.businessProof}</p>
                  <p><strong>Submitted:</strong> {selectedClaim.submittedAt.toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Message</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedClaim.message}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Status</h3>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedClaim.status)}`}>
                  {selectedClaim.status.charAt(0).toUpperCase() + selectedClaim.status.slice(1)}
                </span>
              </div>

              {selectedClaim.status === 'pending' && (
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    onClick={() => handleStatusUpdate(selectedClaim.id, 'rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                  >
                    Reject Claim
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedClaim.id, 'approved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Approve Claim
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
