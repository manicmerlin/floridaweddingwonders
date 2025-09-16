import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, venueName, phone, message, selectedPackage, timestamp } = body;

    // Validate required fields
    if (!name || !email || !venueName) {
      return NextResponse.json(
        { error: 'Name, email, and venue name are required' },
        { status: 400 }
      );
    }

    // Here we'll integrate with your email system and potentially Stripe
    // For now, let's log the submission and send a notification email
    
    console.log('Venue Package Signup:', {
      name,
      email,
      venueName,
      phone,
      message,
      selectedPackage,
      timestamp
    });

    // In the future, this is where we'd:
    // 1. Create a Stripe customer/subscription for paid packages
    // 2. Send welcome email with next steps
    // 3. Create venue owner account in database
    // 4. Schedule onboarding call for Growth/Scale packages

    // For now, just return success
    return NextResponse.json(
      { 
        success: true, 
        message: 'Package signup received successfully',
        package: selectedPackage
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Venue package signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
