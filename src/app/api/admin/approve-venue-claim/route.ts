import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { sendEmailNotification } from '@/lib/emailNotifications';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { claimId, userEmail, userName, userPhone } = await request.json();

    if (!claimId || !userEmail || !userName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the venue claim details
    const { data: claim, error: claimError } = await supabase
      .from('venue_claims')
      .select(`
        *,
        venues:venue_id (
          id,
          name,
          location,
          type
        )
      `)
      .eq('id', claimId)
      .eq('status', 'pending')
      .single();

    if (claimError || !claim) {
      return NextResponse.json({ error: 'Claim not found or already processed' }, { status: 404 });
    }

    // Generate username from email (part before @)
    const baseUsername = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;

    // Check if username exists and generate unique one
    while (true) {
      const { data: existingUser } = await supabase
        .from('venue_owners')
        .select('username')
        .eq('username', username)
        .single();

      if (!existingUser) break;
      
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Create venue owner account
    const { data: venueOwner, error: ownerError } = await supabase
      .from('venue_owners')
      .insert({
        email: userEmail,
        username,
        password_hash: passwordHash,
        full_name: userName,
        phone: userPhone,
        email_verified: true
      })
      .select()
      .single();

    if (ownerError) {
      console.error('Error creating venue owner:', ownerError);
      return NextResponse.json({ error: 'Failed to create venue owner account' }, { status: 500 });
    }

    // Create venue ownership
    const { error: ownershipError } = await supabase
      .from('venue_ownerships')
      .insert({
        venue_id: claim.venue_id,
        owner_id: venueOwner.id,
        role: 'owner'
      });

    if (ownershipError) {
      console.error('Error creating venue ownership:', ownershipError);
      return NextResponse.json({ error: 'Failed to create venue ownership' }, { status: 500 });
    }

    // Update venue as claimed
    const { error: venueUpdateError } = await supabase
      .from('venues')
      .update({
        is_claimed: true,
        claimed_by: userEmail
      })
      .eq('id', claim.venue_id);

    if (venueUpdateError) {
      console.error('Error updating venue:', venueUpdateError);
    }

    // Update claim status
    const { error: claimUpdateError } = await supabase
      .from('venue_claims')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', claimId);

    if (claimUpdateError) {
      console.error('Error updating claim:', claimUpdateError);
    }

    // Send approval email with login credentials
    try {
      await sendEmailNotification({
        type: 'venue_owner',
        email: userEmail,
        venueName: claim.venues.name,
        userType: 'welcome_to_user',
        loginCredentials: {
          username,
          tempPassword,
          loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/venue-owner/login`
        }
      });
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Venue claim approved successfully',
      venueOwner: {
        id: venueOwner.id,
        username,
        email: userEmail
      }
    });

  } catch (error) {
    console.error('Error approving venue claim:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
