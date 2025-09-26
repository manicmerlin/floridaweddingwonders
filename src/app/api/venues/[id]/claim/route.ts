import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { VenueClaim } from '@/types';
import { hasExistingClaim, addClaim, getClaims } from '@/lib/claimsStorage';

// Initialize Resend for email notifications
const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { exists, claim: existingClaim } = hasExistingClaim(venueId);

    if (exists && existingClaim) {
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

    // Add claim to shared storage
    addClaim(newClaim);
    
    console.log('🏛️ Claim created successfully:', newClaim);
    console.log('🏛️ Total claims in memory after adding:', getClaims().length);

    // Send email notifications
    try {
      // Send admin notification email
      const adminEmailResult = await resend.emails.send({
        from: 'Florida Wedding Wonders <noreply@floridaweddingwonders.com>',
        to: ['bennett.boundless@gmail.com'], // Admin email
        subject: `🏛️ New Venue Claim Request - ${newClaim.venueName}`,
        text: `New Venue Claim Request - ${newClaim.venueName}

Claim Details:
- Venue: ${newClaim.venueName}
- Venue ID: ${newClaim.venueId}
- Claimant: ${newClaim.userName}
- Email: ${newClaim.userEmail}
- Business: ${newClaim.businessName}
- Business Type: ${newClaim.businessType}
- Phone: ${newClaim.phoneNumber || 'Not provided'}
- Relationship: ${newClaim.relationshipToVenue || 'Not specified'}
- Submitted: ${new Date(newClaim.submittedAt).toLocaleString()}
- Claim ID: ${newClaim.id}

${newClaim.notes ? `Additional Notes: ${newClaim.notes}` : ''}

Next Steps:
1. Review the claim details and verify legitimacy
2. Contact the claimant to verify ownership/authorization
3. Access the admin dashboard to approve or deny the claim
4. Send follow-up email with decision

Review in Admin: https://staging.floridaweddingwonders.com/admin/claims`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ec4899; margin: 0; font-size: 28px;">🏛️ New Venue Claim Request</h1>
              </div>
              
              <div style="background: #fef7ff; border-left: 4px solid #ec4899; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h2 style="color: #ec4899; margin: 0 0 15px 0;">Claim Details:</h2>
                <p style="margin: 8px 0; font-size: 16px;"><strong>Venue:</strong> ${newClaim.venueName}</p>
                <p style="margin: 8px 0; font-size: 16px;"><strong>Venue ID:</strong> ${newClaim.venueId}</p>
                <p style="margin: 8px 0; font-size: 16px;"><strong>Claimant Name:</strong> ${newClaim.userName}</p>
                <p style="margin: 8px 0; font-size: 16px;"><strong>Email:</strong> ${newClaim.userEmail}</p>
                <p style="margin: 8px 0; font-size: 16px;"><strong>Business Name:</strong> ${newClaim.businessName}</p>
                <p style="margin: 8px 0; font-size: 16px;"><strong>Business Type:</strong> ${newClaim.businessType}</p>
                <p style="margin: 8px 0; font-size: 16px;"><strong>Phone:</strong> ${newClaim.phoneNumber || 'Not provided'}</p>
                <p style="margin: 8px 0; font-size: 16px;"><strong>Relationship:</strong> ${newClaim.relationshipToVenue || 'Not specified'}</p>
                <p style="margin: 8px 0; font-size: 16px;"><strong>Submitted:</strong> ${new Date(newClaim.submittedAt).toLocaleString()}</p>
                <p style="margin: 8px 0; font-size: 16px;"><strong>Claim ID:</strong> ${newClaim.id}</p>
              </div>

              ${newClaim.notes ? `
              <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #0ea5e9; margin: 0 0 15px 0;">📝 Additional Notes:</h3>
                <p style="color: #334155; line-height: 1.6;">${newClaim.notes}</p>
              </div>
              ` : ''}

              <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #0ea5e9; margin: 0 0 15px 0;">📋 Next Steps:</h3>
                <ol style="color: #334155; line-height: 1.6;">
                  <li>Review the claim details and verify legitimacy</li>
                  <li>Contact the claimant to verify ownership/authorization</li>
                  <li>Access the admin dashboard to approve or deny the claim</li>
                  <li>Send follow-up email with decision</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://staging.floridaweddingwonders.com/admin/claims" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Review Claim in Admin</a>
              </div>
            </div>
          </div>
        `
      });

      console.log('Admin email sent:', adminEmailResult);

      // Send confirmation email to claimant
      const userEmailResult = await resend.emails.send({
        from: 'Florida Wedding Wonders <noreply@floridaweddingwonders.com>',
        to: [newClaim.userEmail],
        subject: `✅ Venue Claim Submitted - ${newClaim.venueName}`,
        text: `Claim Submitted Successfully!

Thank you for submitting your venue claim request for ${newClaim.venueName}.

Your claim details:
- Venue: ${newClaim.venueName}
- Claim ID: ${newClaim.id}
- Your Name: ${newClaim.userName}
- Email: ${newClaim.userEmail}
- Business: ${newClaim.businessName}
- Business Type: ${newClaim.businessType}

What happens next:
1. Our team will review your claim within 1-2 business days
2. We may contact you to verify ownership or authorization
3. Once approved, you'll receive login credentials for your venue dashboard
4. You'll be able to manage photos, details, and inquiries for your venue

Questions? Contact us at support@floridaweddingwonders.com

Florida Wedding Wonders - Venue Claim System`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 32px;">✅</span>
                </div>
                <h1 style="color: #10b981; margin: 0; font-size: 28px;">Claim Submitted Successfully!</h1>
                <p style="color: #64748b; font-size: 18px; margin: 10px 0;">We've received your venue claim request</p>
              </div>
              
              <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center;">
                <h2 style="color: #10b981; margin: 0 0 15px 0;">🏛️ ${newClaim.venueName}</h2>
                <p style="color: #334155; font-size: 16px; margin: 0;">Your claim for this venue has been submitted and is now under review.</p>
                <div style="background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 15px; font-weight: bold;">
                  Claim ID: ${newClaim.id}
                </div>
              </div>

              <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <h3 style="color: #3b82f6; margin: 0 0 15px 0;">📞 What Happens Next?</h3>
                <ol style="color: #334155; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Our team will review your claim within 1-2 business days</li>
                  <li>We may contact you to verify ownership or authorization</li>
                  <li>Once approved, you'll receive login credentials for your venue dashboard</li>
                  <li>You'll be able to manage photos, details, and inquiries for your venue</li>
                </ol>
              </div>

              <div style="margin: 30px 0;">
                <h3 style="color: #334155; margin: 0 0 20px 0;">📋 Your Submitted Information:</h3>
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0;">
                  <p style="margin: 5px 0;"><strong>Name:</strong> ${newClaim.userName}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${newClaim.userEmail}</p>
                  <p style="margin: 5px 0;"><strong>Business:</strong> ${newClaim.businessName}</p>
                  <p style="margin: 5px 0;"><strong>Business Type:</strong> ${newClaim.businessType}</p>
                  ${newClaim.relationshipToVenue ? `<p style="margin: 5px 0;"><strong>Relationship:</strong> ${newClaim.relationshipToVenue}</p>` : ''}
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #64748b; margin-bottom: 15px;">Questions about your claim?</p>
                <a href="mailto:support@floridaweddingwonders.com" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Contact Support</a>
              </div>

              <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                Florida Wedding Wonders - Venue Claim System<br>
                <a href="mailto:support@floridaweddingwonders.com" style="color: #ec4899;">Support</a>
              </p>
            </div>
          </div>
        `
      });

      console.log('User confirmation email sent:', userEmailResult);

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the API call if email fails - claim was still created successfully
    }

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
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}
