import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailNotificationProps {
  type: 'venue_owner' | 'regular_user';
  email: string;
  venueName?: string;
  userType: 'notification_to_admin' | 'welcome_to_user';
  loginCredentials?: {
    username: string;
    tempPassword: string;
    loginUrl: string;
  };
}

// Email templates
const emailTemplates = {
  // Admin notification for venue owner registration
  venue_owner_admin_notification: (email: string, venueName: string) => ({
    subject: '🏛️ New Venue Owner Registration - Florida Wedding Wonders',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ec4899; margin: 0; font-size: 28px;">🎉 New Venue Owner Registration!</h1>
          </div>
          
          <div style="background: #fef7ff; border-left: 4px solid #ec4899; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h2 style="color: #ec4899; margin: 0 0 15px 0;">Venue Details:</h2>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Venue Name:</strong> ${venueName}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Contact Email:</strong> ${email}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Offer:</strong> Free Premium Year (worth $1,200)</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #0ea5e9; margin: 0 0 15px 0;">📋 Next Steps:</h3>
            <ol style="color: #334155; line-height: 1.6;">
              <li>Contact venue owner within 24-48 hours</li>
              <li>Schedule onboarding call to discuss premium features</li>
              <li>Collect venue photos and details</li>
              <li>Set up premium listing with 1-year complimentary access</li>
              <li>Provide analytics dashboard access</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${email}" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Contact Venue Owner</a>
          </div>

          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Florida Wedding Wonders - Admin Notification System<br>
            <a href="http://localhost:3000/admin" style="color: #ec4899;">View Admin Dashboard</a>
          </p>
        </div>
      </div>
    `
  }),

  // Welcome email for venue owners
  venue_owner_welcome: (email: string, venueName: string) => ({
    subject: '🎉 Welcome to Florida Wedding Wonders - Your Premium Year Starts Now!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 32px;">✨</span>
            </div>
            <h1 style="color: #ec4899; margin: 0; font-size: 28px;">Welcome to Florida Wedding Wonders!</h1>
            <p style="color: #64748b; font-size: 18px; margin: 10px 0;">Congratulations on securing your FREE premium year!</p>
          </div>
          
          <div style="background: #fef7ff; border: 2px solid #ec4899; padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center;">
            <h2 style="color: #ec4899; margin: 0 0 15px 0;">🏛️ ${venueName}</h2>
            <p style="color: #334155; font-size: 16px; margin: 0;">You've successfully claimed your spot as one of our founding venue partners!</p>
            <div style="background: #8b5cf6; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 15px; font-weight: bold;">
              🟣 Scale Package ($2,500 Lifetime) - FREE for Founding Partners!
            </div>
          </div>

          <div style="margin: 30px 0;">
            <h3 style="color: #334155; margin: 0 0 20px 0;">🎁 Your Scale Package Features Include:</h3>
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <span style="color: #ec4899; font-size: 20px; margin-right: 12px;">📸</span>
                <span style="color: #334155;"><strong>Professional Photo + Drone Video Shoot</strong> - High-end media creation included</span>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <span style="color: #8b5cf6; font-size: 20px; margin-right: 12px;">⭐</span>
                <span style="color: #334155;"><strong>Lifetime Growth Membership</strong> - Never pay again after this</span>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <span style="color: #06b6d4; font-size: 20px; margin-right: 12px;">🏆</span>
                <span style="color: #334155;"><strong>Founding Partner Badge</strong> - Exclusive recognition for early adopters</span>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <span style="color: #f59e0b; font-size: 20px; margin-right: 12px;">�</span>
                <span style="color: #334155;"><strong>Featured Marketing</strong> - Homepage rotation and promotional placement</span>
              </div>
            </div>
          </div>

          <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <h3 style="color: #3b82f6; margin: 0 0 15px 0;">📞 What Happens Next?</h3>
            <ol style="color: #334155; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Our team will contact you within 24-48 hours</li>
              <li>We'll schedule a quick onboarding call (15-20 minutes)</li>
              <li>Help you upload stunning photos of your venue</li>
              <li>Set up your premium listing with all the details</li>
              <li>Provide access to your analytics dashboard</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #64748b; margin-bottom: 15px;">Questions? We're here to help!</p>
            <a href="mailto:venues@floridaweddingwonders.com" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin-right: 10px;">Contact Our Team</a>
          </div>

          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Welcome to Florida Wedding Wonders!<br>
            <a href="https://floridaweddingwonders.com" style="color: #ec4899;">Visit Website</a> • 
            <a href="mailto:support@floridaweddingwonders.com" style="color: #ec4899;">Support</a>
          </p>
        </div>
      </div>
    `
  }),

  // Approved venue owner email with login credentials
  venue_owner_approved: (email: string, venueName: string, username: string, tempPassword: string, loginUrl: string) => ({
    subject: '✅ Venue Approved! Your Florida Wedding Wonders Account is Ready',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 32px;">✅</span>
            </div>
            <h1 style="color: #10b981; margin: 0; font-size: 28px;">Congratulations! Venue Approved!</h1>
            <p style="color: #64748b; font-size: 18px; margin: 10px 0;">Your account is ready and your premium year has started!</p>
          </div>
          
          <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center;">
            <h2 style="color: #10b981; margin: 0 0 15px 0;">🏛️ ${venueName}</h2>
            <p style="color: #334155; font-size: 16px; margin: 0;">Your venue has been approved and is now live on Florida Wedding Wonders!</p>
            <div style="background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 15px; font-weight: bold;">
              ✨ Premium Account Active - $1,200 Value FREE!
            </div>
          </div>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 25px; margin: 25px 0; border-radius: 12px;">
            <h3 style="color: #f59e0b; margin: 0 0 20px 0;">🔐 Your Login Credentials</h3>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
              <div style="margin-bottom: 15px;">
                <label style="color: #6b7280; font-size: 14px; font-weight: 500;">Username:</label>
                <div style="color: #111827; font-size: 18px; font-weight: bold; font-family: monospace; background: #f9fafb; padding: 8px 12px; border-radius: 4px; margin-top: 4px;">${username}</div>
              </div>
              <div style="margin-bottom: 20px;">
                <label style="color: #6b7280; font-size: 14px; font-weight: 500;">Temporary Password:</label>
                <div style="color: #111827; font-size: 18px; font-weight: bold; font-family: monospace; background: #f9fafb; padding: 8px 12px; border-radius: 4px; margin-top: 4px;">${tempPassword}</div>
              </div>
              <div style="text-align: center;">
                <a href="${loginUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Login to Your Dashboard</a>
              </div>
            </div>
            <p style="color: #92400e; font-size: 14px; margin: 15px 0 0 0; text-align: center;">
              ⚠️ Please change your password after your first login for security
            </p>
          </div>

          <div style="margin: 30px 0;">
            <h3 style="color: #334155; margin: 0 0 20px 0;">🚀 What You Can Do Now:</h3>
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <span style="color: #10b981; font-size: 20px; margin-right: 12px;">📸</span>
                <span style="color: #334155;"><strong>Upload Photos</strong> - Add stunning images of your venue</span>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <span style="color: #8b5cf6; font-size: 20px; margin-right: 12px;">✏️</span>
                <span style="color: #334155;"><strong>Edit Details</strong> - Update venue information and amenities</span>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <span style="color: #06b6d4; font-size: 20px; margin-right: 12px;">📊</span>
                <span style="color: #334155;"><strong>View Analytics</strong> - Track visitors and inquiries</span>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <span style="color: #f59e0b; font-size: 20px; margin-right: 12px;">💬</span>
                <span style="color: #334155;"><strong>Manage Inquiries</strong> - Respond to couples interested in your venue</span>
              </div>
            </div>
          </div>

          <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <h3 style="color: #3b82f6; margin: 0 0 15px 0;">💡 Pro Tips:</h3>
            <ul style="color: #334155; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Upload high-quality photos to attract more couples</li>
              <li>Keep your venue information up-to-date</li>
              <li>Respond promptly to inquiries for better results</li>
              <li>Use the analytics to understand your audience</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #64748b; margin-bottom: 15px;">Need help getting started?</p>
            <a href="mailto:support@floridaweddingwonders.com" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin-right: 10px;">Contact Support</a>
          </div>

          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Welcome to Florida Wedding Wonders!<br>
            <a href="${loginUrl}" style="color: #10b981;">Login to Dashboard</a> • 
            <a href="mailto:support@floridaweddingwonders.com" style="color: #ec4899;">Support</a>
          </p>
        </div>
      </div>
    `
  }),

  // Admin notification for regular user
  regular_user_admin_notification: (email: string) => ({
    subject: '📧 New Subscriber - Florida Wedding Wonders',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #f8fafc;">
        <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0;">
          <h2 style="color: #64748b; margin: 0 0 15px 0;">New Subscriber Registration</h2>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> Regular User</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `
  }),

  // Welcome email for regular users
  regular_user_welcome: (email: string) => ({
    subject: '🌟 Welcome to Florida Wedding Wonders VIP List!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 32px;">💖</span>
            </div>
            <h1 style="color: #ec4899; margin: 0; font-size: 28px;">Welcome to Our VIP List!</h1>
            <p style="color: #64748b; font-size: 18px; margin: 10px 0;">You're now first in line for Florida's best wedding venues</p>
          </div>
          
          <div style="background: #fef7ff; border: 2px solid #ec4899; padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center;">
            <h2 style="color: #ec4899; margin: 0 0 15px 0;">🎉 You're In!</h2>
            <p style="color: #334155; font-size: 16px; margin: 0;">As a VIP member, you'll be the first to know when we launch with exclusive access to 130+ stunning wedding venues across Florida.</p>
          </div>

          <div style="margin: 30px 0;">
            <h3 style="color: #334155; margin: 0 0 20px 0;">✨ What to Expect:</h3>
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <span style="color: #ec4899; font-size: 20px; margin-right: 12px;">🚀</span>
                <span style="color: #334155;"><strong>Early Access</strong> - Browse venues before the public launch</span>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <span style="color: #8b5cf6; font-size: 20px; margin-right: 12px;">📸</span>
                <span style="color: #334155;"><strong>Stunning Galleries</strong> - Real photos from Miami to West Palm Beach</span>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <span style="color: #06b6d4; font-size: 20px; margin-right: 12px;">💰</span>
                <span style="color: #334155;"><strong>Exclusive Deals</strong> - Special offers from premier venues</span>
              </div>
            </div>
          </div>

          <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <h3 style="color: #3b82f6; margin: 0 0 15px 0;">📍 Coming Soon to Florida Wedding Wonders:</h3>
            <ul style="color: #334155; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Beach venues with ocean views</li>
              <li>Historic mansions and estates</li>
              <li>Garden venues perfect for outdoor ceremonies</li>
              <li>Luxury hotels and resorts</li>
              <li>Unique and non-traditional spaces</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #64748b; margin-bottom: 15px;">Follow us for sneak peeks and updates!</p>
            <a href="mailto:hello@floridaweddingwonders.com" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Contact Us</a>
          </div>

          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Florida Wedding Wonders - Your Dream Venue Awaits<br>
            <a href="https://floridaweddingwonders.com" style="color: #ec4899;">Visit Website</a> • 
            <a href="mailto:support@floridaweddingwonders.com" style="color: #ec4899;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `
  })
};

export async function sendEmailNotification({ type, email, venueName, userType, loginCredentials }: EmailNotificationProps) {
  try {
    let emailData;
    let recipientEmail;

    if (userType === 'notification_to_admin') {
      // Send notification to admin - forwarding to your Gmail for now
      recipientEmail = 'bennett.boundless@gmail.com'; // Your Gmail that receives admin notifications
      
      if (type === 'venue_owner') {
        emailData = emailTemplates.venue_owner_admin_notification(email, venueName || 'Unknown Venue');
      } else {
        emailData = emailTemplates.regular_user_admin_notification(email);
      }
    } else {
      // Send welcome email to user
      recipientEmail = email;
      
      if (type === 'venue_owner') {
        // Use approved template if login credentials are provided
        if (loginCredentials) {
          emailData = emailTemplates.venue_owner_approved(
            email, 
            venueName || 'Your Venue', 
            loginCredentials.username, 
            loginCredentials.tempPassword, 
            loginCredentials.loginUrl
          );
        } else {
          emailData = emailTemplates.venue_owner_welcome(email, venueName || 'Your Venue');
        }
      } else {
        emailData = emailTemplates.regular_user_welcome(email);
      }
    }

    const { data, error } = await resend.emails.send({
      from: 'Florida Wedding Wonders <onboarding@resend.dev>', // Using Resend's verified domain
      reply_to: 'hello@floridaweddingwonders.com', // Your custom domain for replies
      to: [recipientEmail],
      subject: emailData.subject,
      html: emailData.html,
    });

    if (error) {
      console.error('Email sending failed:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };

  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
}

// Utility function to send both admin notification and user welcome
export async function sendCompleteEmailFlow(type: 'venue_owner' | 'regular_user', email: string, venueName?: string) {
  try {
    // Send admin notification first
    const adminResult = await sendEmailNotification({
      type,
      email,
      venueName,
      userType: 'notification_to_admin'
    });

    // Wait 1 second to avoid rate limit (Resend allows 2 requests per second)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send user welcome email
    const userResult = await sendEmailNotification({
      type,
      email,
      venueName,
      userType: 'welcome_to_user'
    });

    return {
      adminEmail: adminResult,
      userEmail: userResult,
      success: adminResult.success && userResult.success
    };

  } catch (error) {
    console.error('Complete email flow failed:', error);
    return { success: false, error };
  }
}
