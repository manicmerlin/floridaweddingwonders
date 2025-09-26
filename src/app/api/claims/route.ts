import { NextRequest, NextResponse } from 'next/server';
import { VenueClaim, ClaimSubmission } from '@/types';

// In production, this would connect to your database
let venueClaims: VenueClaim[] = [];

export async function GET() {
  try {
    // Return all venue claims (admin only)
    return NextResponse.json({
      success: true,
      claims: venueClaims
    });
  } catch (error) {
    console.error('Failed to fetch venue claims:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch venue claims' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { venueId, venueName, userId, userEmail, userName, businessName, businessType, additionalNotes } = body;

    // Check if venue is already claimed or has pending claim
    const existingClaim = venueClaims.find(
      claim => claim.venueId === venueId && 
      (claim.status === 'approved' || claim.status === 'pending')
    );

    if (existingClaim) {
      return NextResponse.json(
        { 
          success: false, 
          error: existingClaim.status === 'approved' 
            ? 'This venue is already claimed' 
            : 'This venue has a pending claim'
        },
        { status: 400 }
      );
    }

    // Create new claim
    const newClaim: VenueClaim = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      venueId,
      venueName,
      userId,
      userEmail,
      userName,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      notes: additionalNotes
    };

    venueClaims.push(newClaim);

    // Send email notifications
    try {
      // Send notification to admin
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'admin@floridaweddingwonders.com',
          subject: `New Venue Claim: ${venueName}`,
          type: 'venue_claim_admin',
          data: {
            claimId: newClaim.id,
            venueName,
            userName,
            userEmail,
            businessName,
            businessType,
            submittedAt: newClaim.submittedAt,
            additionalNotes
          }
        })
      });

      // Send confirmation to user
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          subject: `Your venue claim for ${venueName} has been submitted`,
          type: 'venue_claim_confirmation',
          data: {
            claimId: newClaim.id,
            venueName,
            userName,
            submittedAt: newClaim.submittedAt
          }
        })
      });
    } catch (emailError) {
      console.error('Failed to send email notifications:', emailError);
      // Don't fail the claim submission if emails fail
    }

    return NextResponse.json({
      success: true,
      message: 'Venue claim submitted successfully',
      claimId: newClaim.id
    });

  } catch (error) {
    console.error('Failed to submit venue claim:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit venue claim' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimId, status, reviewedBy, adminNotes } = body;

    const claimIndex = venueClaims.findIndex(claim => claim.id === claimId);
    
    if (claimIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Claim not found' },
        { status: 404 }
      );
    }

    // Update claim
    venueClaims[claimIndex] = {
      ...venueClaims[claimIndex],
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      adminNotes
    };

    return NextResponse.json({
      success: true,
      claim: venueClaims[claimIndex]
    });

  } catch (error) {
    console.error('Failed to update venue claim:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update venue claim' },
      { status: 500 }
    );
  }
}
