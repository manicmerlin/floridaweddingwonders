import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { sendCompleteEmailFlow } from '../../../lib/emailNotifications';
import { EmailSchema, validateData, sanitizeEmail } from '../../../lib/validation';

async function handleClaimEmails(to: string, subject: string, type: string, data: any) {
  try {
    // In production, you would use a real email service like SendGrid, Mailgun, etc.
    console.log('📧 Sending claim email:', { to, subject, type, data });
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return NextResponse.json({
      success: true,
      message: 'Claim email sent successfully'
    });
  } catch (error) {
    console.error('Failed to send claim email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 Email capture API called');
  
  try {
    const body = await request.json();
    console.log('📝 Request body:', body);
    const { type, email, venueName, to, subject, data } = body;

    // Handle venue claim emails
    if (type === 'venue_claim_admin' || type === 'venue_claim_confirmation' || 
        type === 'venue_claim_approved' || type === 'venue_claim_denied') {
      return await handleClaimEmails(to, subject, type, data);
    }

    // Validate email data using Zod schema
    const validation = await validateData(EmailSchema, { email, type, venueName });
    
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.errors);
      return NextResponse.json(
        { 
          error: 'Invalid input data', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;
    const sanitizedEmail = sanitizeEmail(validatedData.email);

    // If venue_owner, validate venue name is provided
    if (validatedData.type === 'venue_owner' && !validatedData.venueName) {
      return NextResponse.json(
        { error: 'Venue name is required for venue owners' },
        { status: 400 }
      );
    }

    // Store in database - using regular client with RLS policies for public insert
    console.log('🔗 Connecting to Supabase...');
    // Using regular client since RLS policies allow public inserts
    
    // Check if email already exists
    console.log('🔍 Checking for existing subscriber...');
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('email_subscribers')
      .select('id, email, is_venue_owner')
      .eq('email', sanitizedEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Database check error:', checkError);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }

    // If subscriber already exists
    if (existingSubscriber) {
      // If they're already a venue owner, don't allow downgrade
      if (existingSubscriber.is_venue_owner && validatedData.type === 'regular_user') {
        return NextResponse.json(
          { error: 'Email already registered as venue owner' },
          { status: 400 }
        );
      }
      
      // If they're upgrading from regular user to venue owner, update the record
      if (!existingSubscriber.is_venue_owner && validatedData.type === 'venue_owner') {
        const { error: updateError } = await supabase
          .from('email_subscribers')
          .update({
            is_venue_owner: true,
            venue_name: validatedData.venueName,
          })
          .eq('email', sanitizedEmail);

        if (updateError) {
          console.error('Database update error:', updateError);
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          );
        }
      } else {
        // Email already exists with same type
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }
    } else {
      // Create new subscriber
      const { error: insertError } = await supabase
        .from('email_subscribers')
        .insert({
          email: sanitizedEmail,
          venue_name: validatedData.type === 'venue_owner' ? validatedData.venueName : null,
          is_venue_owner: validatedData.type === 'venue_owner',
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to save subscription' },
          { status: 500 }
        );
      }
    }

    // Send emails (admin notification + user welcome)
    console.log('📧 Sending emails...');
    const emailResult = await sendCompleteEmailFlow(
      validatedData.type as 'venue_owner' | 'regular_user',
      sanitizedEmail,
      validatedData.venueName
    );

    if (!emailResult.success) {
      console.error('📧 Email sending failed:', emailResult);
      // Still return success since database save worked
      // Email failure shouldn't block the user experience
    } else {
      console.log('✅ Emails sent successfully');
    }

    // Log successful registration
    console.log('Email capture successful:', {
      email: sanitizedEmail,
      type: validatedData.type,
      venueName: validatedData.type === 'venue_owner' ? validatedData.venueName : undefined,
      emailSent: emailResult.success,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email captured successfully',
        emailSent: emailResult.success
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email capture error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
