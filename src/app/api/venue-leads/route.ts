import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend for email notifications
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const leadData = await request.json();

    console.log('Venue lead received:', leadData);

    // Validate required fields
    const { 
      venueName,
      venueEmail,
      userName,
      userEmail,
      message
    } = leadData;

    if (!venueName || !venueEmail || !userName || !userEmail || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields' 
        },
        { status: 400 }
      );
    }

    // Send email to venue with lead information
    try {
      const venueEmailResult = await resend.emails.send({
        from: 'Florida Wedding Wonders <noreply@floridaweddingwonders.com>',
        to: [venueEmail],
        subject: `🎉 New Wedding Inquiry - ${leadData.leadQualification?.eventType || 'Wedding'} for ${leadData.leadQualification?.guestCount || 'TBD'} Guests`,
        html: generateVenueLeadEmail(leadData),
        text: generateVenueLeadTextEmail(leadData)
      });

      console.log('Venue lead email sent:', venueEmailResult);

      // Send confirmation email to user
      const userEmailResult = await resend.emails.send({
        from: 'Florida Wedding Wonders <noreply@floridaweddingwonders.com>',
        to: [userEmail],
        subject: `✅ Your Inquiry to ${venueName} Has Been Sent`,
        html: generateUserConfirmationEmail(leadData),
        text: generateUserConfirmationTextEmail(leadData)
      });

      console.log('User confirmation email sent:', userEmailResult);

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the API call if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Lead sent successfully to venue'
    });

  } catch (error) {
    console.error('Failed to process venue lead:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

function generateVenueLeadEmail(leadData: any): string {
  const { leadQualification } = leadData;
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 20px;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 32px;">💕</span>
          </div>
          <h1 style="color: #ec4899; margin: 0; font-size: 28px;">New Wedding Inquiry!</h1>
          <p style="color: #64748b; font-size: 18px; margin: 10px 0;">A qualified lead is interested in your venue</p>
        </div>
        
        <div style="background: #fef7ff; border-left: 4px solid #ec4899; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h2 style="color: #ec4899; margin: 0 0 15px 0;">Contact Information:</h2>
          <p style="margin: 8px 0; font-size: 16px;"><strong>Name:</strong> ${leadData.userName}</p>
          <p style="margin: 8px 0; font-size: 16px;"><strong>Email:</strong> ${leadData.userEmail}</p>
          ${leadQualification?.phoneNumber ? `<p style="margin: 8px 0; font-size: 16px;"><strong>Phone:</strong> ${leadQualification.phoneNumber}</p>` : ''}
          <p style="margin: 8px 0; font-size: 16px;"><strong>Inquiry Date:</strong> ${new Date(leadData.submittedAt).toLocaleDateString()}</p>
        </div>

        ${leadQualification ? `
          <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h2 style="color: #0ea5e9; margin: 0 0 15px 0;">🎯 Pre-Qualified Wedding Details:</h2>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Event Type:</strong> ${leadQualification.eventType}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Guest Count:</strong> ${leadQualification.guestCount} guests</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Venue Budget:</strong> ${leadQualification.venuebudget}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Date Flexibility:</strong> ${leadQualification.dateFlexibility}</p>
            ${leadQualification.preferredDate ? `<p style="margin: 8px 0; font-size: 16px;"><strong>Preferred Date:</strong> ${new Date(leadQualification.preferredDate).toLocaleDateString()}</p>` : ''}
          </div>
        ` : `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #f59e0b; margin: 0 0 15px 0;">⚠️ Note:</h3>
            <p style="color: #92400e;">This user hasn't completed their wedding profile yet. You may want to ask for guest count, budget, and date preferences.</p>
          </div>
        `}

        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #10b981; margin: 0 0 15px 0;">💬 Their Message:</h3>
          <p style="color: #334155; line-height: 1.6; font-style: italic; background: white; padding: 15px; border-radius: 8px; margin: 0;">"${leadData.message}"</p>
        </div>

        <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #3b82f6; margin: 0 0 15px 0;">📋 Recommended Next Steps:</h3>
          <ol style="color: #334155; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Respond within 24 hours for best conversion</li>
            <li>Check availability for their preferred dates</li>
            <li>Provide pricing that matches their budget range</li>
            <li>Offer to schedule a venue tour or video call</li>
            <li>Share photos and details specific to their guest count</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:${leadData.userEmail}" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin-right: 10px;">Reply to Lead</a>
          ${leadQualification?.phoneNumber ? `<a href="tel:${leadQualification.phoneNumber}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Call Now</a>` : ''}
        </div>

        <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          Florida Wedding Wonders - Lead Generation System<br>
          This lead was generated from your verified venue listing
        </p>
      </div>
    </div>
  `;
}

function generateVenueLeadTextEmail(leadData: any): string {
  const { leadQualification } = leadData;
  
  return `New Wedding Inquiry - ${leadData.venueName}

Contact Information:
- Name: ${leadData.userName}
- Email: ${leadData.userEmail}
${leadQualification?.phoneNumber ? `- Phone: ${leadQualification.phoneNumber}` : ''}
- Inquiry Date: ${new Date(leadData.submittedAt).toLocaleDateString()}

${leadQualification ? `
Wedding Details:
- Event Type: ${leadQualification.eventType}
- Guest Count: ${leadQualification.guestCount} guests
- Venue Budget: ${leadQualification.venuebudget}
- Date Flexibility: ${leadQualification.dateFlexibility}
${leadQualification.preferredDate ? `- Preferred Date: ${new Date(leadQualification.preferredDate).toLocaleDateString()}` : ''}
` : 'Note: This user hasn\'t completed their wedding profile yet. You may want to ask for guest count, budget, and date preferences.'}

Their Message:
"${leadData.message}"

Next Steps:
1. Respond within 24 hours for best conversion
2. Check availability for their preferred dates
3. Provide pricing that matches their budget range
4. Offer to schedule a venue tour or video call
5. Share photos and details specific to their guest count

Reply to: ${leadData.userEmail}
${leadQualification?.phoneNumber ? `Call: ${leadQualification.phoneNumber}` : ''}

Florida Wedding Wonders - Lead Generation System`;
}

function generateUserConfirmationEmail(leadData: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 32px;">✅</span>
          </div>
          <h1 style="color: #10b981; margin: 0; font-size: 28px;">Inquiry Sent Successfully!</h1>
          <p style="color: #64748b; font-size: 18px; margin: 10px 0;">Your message has been delivered to ${leadData.venueName}</p>
        </div>
        
        <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center;">
          <h2 style="color: #10b981; margin: 0 0 15px 0;">🏛️ ${leadData.venueName}</h2>
          <p style="color: #334155; font-size: 16px; margin: 0;">Your detailed wedding information has been shared with the venue.</p>
        </div>

        <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
          <h3 style="color: #3b82f6; margin: 0 0 15px 0;">📞 What Happens Next?</h3>
          <ol style="color: #334155; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>The venue will receive your inquiry with all your wedding details</li>
            <li>They'll review your guest count, budget, and date preferences</li>
            <li>Expect a response within 24-48 hours via email or phone</li>
            <li>They may offer to schedule a tour or provide detailed pricing</li>
          </ol>
        </div>

        <div style="background: #fef7ff; border: 1px solid #ec4899; padding: 20px; margin: 25px 0; border-radius: 8px;">
          <h3 style="color: #ec4899; margin: 0 0 15px 0;">💡 While You Wait:</h3>
          <ul style="color: #334155; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Browse more venues on Florida Wedding Wonders</li>
            <li>Add venues to your favorites for comparison</li>
            <li>Update your wedding profile if your plans change</li>
            <li>Prepare questions about availability and packages</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #64748b; margin-bottom: 15px;">Need help or have questions?</p>
          <a href="mailto:support@floridaweddingwonders.com" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Contact Support</a>
        </div>

        <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          Florida Wedding Wonders - Connecting Couples with Perfect Venues<br>
          <a href="https://floridaweddingwonders.com" style="color: #ec4899;">Browse More Venues</a>
        </p>
      </div>
    </div>
  `;
}

function generateUserConfirmationTextEmail(leadData: any): string {
  return `Inquiry Sent Successfully!

Your inquiry has been sent to ${leadData.venueName} with all your wedding details.

What happens next:
1. The venue will receive your inquiry with all your wedding details
2. They'll review your guest count, budget, and date preferences  
3. Expect a response within 24-48 hours via email or phone
4. They may offer to schedule a tour or provide detailed pricing

While you wait:
- Browse more venues on Florida Wedding Wonders
- Add venues to your favorites for comparison
- Update your wedding profile if your plans change
- Prepare questions about availability and packages

Questions? Contact us at support@floridaweddingwonders.com

Florida Wedding Wonders - Connecting Couples with Perfect Venues`;
}
