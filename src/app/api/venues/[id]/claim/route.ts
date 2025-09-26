import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for claims (same as in main claims API)
let venueClaims: any[] = [];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const venueId = params.id;
    const body = await request.json();

    console.log('Venue claim request:', { venueId, body });

    // Validate required fields
    const { 
      userEmail, 
      userName, 
      businessName, 
      businessType 
    } = body;

    if (!userEmail || !userName || !businessName || !businessType) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields' 
        },
        { status: 400 }
      );
    }

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
    const newClaim = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      venueId,
      venueName: body.venueName || `Venue ${venueId}`,
      userId: 'guest',
      userEmail: body.userEmail,
      userName: body.userName,
      businessName: body.businessName,
      businessType: body.businessType,
      phoneNumber: body.phoneNumber,
      businessAddress: body.businessAddress,
      relationshipToVenue: body.relationshipToVenue,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      notes: body.additionalNotes
    };

    venueClaims.push(newClaim);

    console.log('Claim created successfully:', newClaim);

    // Note: Email notifications are disabled for now to avoid fetch issues
    // In production, you would implement proper email sending here

    return NextResponse.json({
      success: true,
      message: 'Your claim has been submitted successfully! We will review it and get back to you within 1-2 business days.',
      claimId: newClaim.id
    });

  } catch (error) {
    console.error('Failed to process venue claim:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + error.message 
      },
      { status: 500 }
    );
  }
}
