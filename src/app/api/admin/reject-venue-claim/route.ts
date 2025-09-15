import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { sendEmailNotification } from '@/lib/emailNotifications';

export async function POST(request: NextRequest) {
  try {
    const { claimId, reason } = await request.json();

    if (!claimId) {
      return NextResponse.json({ error: 'Missing claim ID' }, { status: 400 });
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

    // Update claim status to rejected
    const { error: updateError } = await supabase
      .from('venue_claims')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'No reason provided',
        updated_at: new Date().toISOString()
      })
      .eq('id', claimId);

    if (updateError) {
      console.error('Error updating claim:', updateError);
      return NextResponse.json({ error: 'Failed to reject claim' }, { status: 500 });
    }

    // Send rejection email (optional - create a rejection email template)
    try {
      // You could create a rejection email template here
      console.log(`Venue claim rejected for ${claim.user_email} - ${claim.venues.name}`);
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
      // Don't fail the rejection if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Venue claim rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting venue claim:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
