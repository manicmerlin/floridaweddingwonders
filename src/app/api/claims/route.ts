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

    // In production, you would:
    // 1. Save to database
    // 2. Send email notification to admin
    // 3. Send confirmation email to user

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
