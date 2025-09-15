import { NextRequest, NextResponse } from 'next/server';
import { sendCompleteEmailFlow } from '@/lib/emailNotifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, venueName, isVenueOwner } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Determine email type
    const emailType = isVenueOwner ? 'venue_owner' : 'regular_user';

    // Send complete email flow (admin notification + user welcome)
    const emailResult = await sendCompleteEmailFlow(
      emailType,
      email,
      venueName
    );

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send emails' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Emails sent successfully',
      details: {
        adminEmailSent: emailResult.adminEmail?.success || false,
        userEmailSent: emailResult.userEmail?.success || false,
      }
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
