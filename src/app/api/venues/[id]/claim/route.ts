import { NextRequest, NextResponse } from 'next/server';
import { ClaimSubmission } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const venueId = params.id;
    const body: ClaimSubmission = await request.json();

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

    // In production, you would:
    // 1. Check if user is authenticated
    // 2. Check if venue exists
    // 3. Check if venue is already claimed
    // 4. Validate business information
    // 5. Store claim in database
    // 6. Send notification emails

    // Submit claim to admin API
    const claimResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/claims`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venueId,
          venueName: body.venueName || `Venue ${venueId}`,
          userId: body.userId || 'guest',
          userEmail: body.userEmail,
          userName: body.userName,
          businessName: body.businessName,
          businessType: body.businessType,
          additionalNotes: body.additionalNotes
        })
      }
    );

    const claimResult = await claimResponse.json();

    if (!claimResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: claimResult.error || 'Failed to submit claim'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your claim has been submitted successfully! We will review it and get back to you within 1-2 business days.',
      claimId: claimResult.claimId
    });

  } catch (error) {
    console.error('Failed to process venue claim:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
