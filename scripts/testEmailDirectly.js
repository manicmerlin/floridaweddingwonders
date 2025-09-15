// Direct test of email sending without API routes
require('dotenv').config({ path: '.env.local' });

async function testEmailDirectly() {
  console.log('🧪 Testing Email System Directly...');
  
  try {
    // Import the email function
    const { sendCompleteEmailFlow } = await import('../src/lib/emailNotifications.js');
    
    console.log('📧 Testing venue owner email flow...');
    
    const venueResult = await sendCompleteEmailFlow(
      'venue_owner',
      'test.venue@example.com',
      'Beautiful Garden Venue'
    );
    
    if (venueResult.success) {
      console.log('✅ Venue owner emails sent successfully!');
      console.log('📧 Admin email sent:', venueResult.adminEmail?.success);
      console.log('📧 User email sent:', venueResult.userEmail?.success);
    } else {
      console.log('❌ Venue owner email failed:', venueResult.error);
    }
    
    console.log('');
    console.log('📧 Testing regular user email flow...');
    
    const userResult = await sendCompleteEmailFlow(
      'regular_user',
      'test.user@example.com'
    );
    
    if (userResult.success) {
      console.log('✅ Regular user emails sent successfully!');
      console.log('📧 Admin email sent:', userResult.adminEmail?.success);
      console.log('📧 User email sent:', userResult.userEmail?.success);
    } else {
      console.log('❌ Regular user email failed:', userResult.error);
    }
    
  } catch (error) {
    console.log('❌ Direct test failed:', error.message);
    console.log('');
    console.log('🔧 This might be an import issue. Let me try a simpler test...');
    
    // Simple Resend test
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      console.log('📧 Testing basic Resend connection...');
      
      const { data, error } = await resend.emails.send({
        from: 'Florida Wedding Wonders <noreply@floridaweddingwonders.com>',
        to: ['admin@floridaweddingwonders.com'],
        subject: '🧪 Test Email - Florida Wedding Wonders',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);">
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; margin: 0 auto;">
              <h1 style="color: #ec4899; text-align: center;">🎉 Email System Working!</h1>
              <p style="color: #334155; font-size: 16px; text-align: center;">
                Your Florida Wedding Wonders email system is successfully connected and ready to send beautiful, professional emails!
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <div style="background: #22c55e; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; font-weight: bold;">
                  ✅ Email Automation Active
                </div>
              </div>
              <p style="color: #64748b; font-size: 14px; text-align: center;">
                Test sent at: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        `
      });

      if (error) {
        console.log('❌ Basic Resend test failed:', error);
      } else {
        console.log('✅ Basic Resend test successful!');
        console.log('📧 Email ID:', data?.id);
        console.log('');
        console.log('🎉 EMAIL SYSTEM IS WORKING!');
        console.log('📧 Check admin@floridaweddingwonders.com for the test email');
        console.log('');
        console.log('🚀 Ready to test the coming soon page!');
        console.log('🔗 Visit: http://localhost:3000/coming-soon');
      }
      
    } catch (resendError) {
      console.log('❌ Resend connection failed:', resendError.message);
    }
  }
}

testEmailDirectly();
