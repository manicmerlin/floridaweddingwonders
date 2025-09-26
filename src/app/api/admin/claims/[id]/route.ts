import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const claimId = params.id;
    const body = await request.json();
    const { action, adminNotes } = body;

    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Verify admin authentication
    // 2. Find claim by ID in database
    // 3. Update claim status
    // 4. Update venue claimStatus if approved
    // 5. Send notification emails to claimant

    // Update the claim through the main claims API
    const updateResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/claims`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimId,
          status: action === 'approve' ? 'approved' : 'denied',
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'admin', // In production, get from auth
          adminNotes
        })
      }
    );

    if (!updateResponse.ok) {
      throw new Error('Failed to update claim');
    }

    const result = await updateResponse.json();

    // Send notification email to the claimant about the decision
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: result.claim.userEmail,
          subject: `Your venue claim has been ${action === 'approve' ? 'approved' : 'denied'}`,
          type: `venue_claim_${action === 'approve' ? 'approved' : 'denied'}`,
          data: {
            claimId,
            venueName: result.claim.venueName,
            userName: result.claim.userName,
            status: result.claim.status,
            adminNotes,
            reviewedAt: result.claim.reviewedAt
          }
        })
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the claim update if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Venue claim ${action}d successfully`,
      claim: result.claim
    });

  } catch (error) {
    console.error('Failed to update venue claim:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update venue claim' },
      { status: 500 }
    );
  }
}
