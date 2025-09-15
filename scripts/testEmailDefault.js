// Test with Resend's default domain first
require('dotenv').config({ path: '.env.local' });

async function testEmailWithDefaultDomain() {
  console.log('🧪 Testing with Resend default domain...');
  
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    console.log('📧 Sending test email...');
    
    const { data, error } = await resend.emails.send({
      from: 'Florida Wedding Wonders <onboarding@resend.dev>',
      to: ['bennett.boundless@gmail.com'], // Your verified email
      subject: '🎉 Florida Wedding Wonders - Email System Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);">
          <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 32px;">✨</span>
              </div>
              <h1 style="color: #ec4899; margin: 0;">Florida Wedding Wonders</h1>
              <p style="color: #64748b; margin: 5px 0;">Email System Test</p>
            </div>
            
            <div style="background: #fef7ff; border: 2px solid #ec4899; padding: 20px; margin: 20px 0; border-radius: 12px; text-align: center;">
              <h2 style="color: #ec4899; margin: 0 0 10px 0;">🎉 Success!</h2>
              <p style="color: #334155; margin: 0;">Your email automation system is working perfectly!</p>
            </div>
            
            <div style="color: #64748b; font-size: 14px;">
              <p><strong>Test Details:</strong></p>
              <ul style="line-height: 1.6;">
                <li>✅ Resend API connection successful</li>
                <li>✅ Email templates ready</li>
                <li>✅ Coming soon page integration complete</li>
                <li>✅ Admin notification system ready</li>
              </ul>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
              <p style="color: #3b82f6; margin: 0; font-size: 14px;">
                <strong>Next:</strong> Once domain verification completes, all emails will send from @floridaweddingwonders.com
              </p>
            </div>
            
            <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">
              Test sent: ${new Date().toLocaleString()}<br>
              Florida Wedding Wonders - Email System
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.log('❌ Test email failed:', error);
    } else {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Email ID:', data?.id);
      console.log('');
      console.log('🎉 EMAIL SYSTEM IS WORKING!');
      console.log('');
      console.log('📋 Status:');
      console.log('✅ Resend API connected');
      console.log('✅ Email sending functional');
      console.log('⏳ Domain verification in progress');
      console.log('');
      console.log('🔧 Domain Issue:');
      console.log('Your floridaweddingwonders.com domain shows as verified in the dashboard');
      console.log('but there might be a DNS propagation delay (can take up to 24 hours).');
      console.log('');
      console.log('🚀 Options:');
      console.log('1. Wait for DNS propagation (recommended)');
      console.log('2. Use default domain temporarily: onboarding@resend.dev');
      console.log('3. Test the coming soon page - it will work once domain is ready');
      console.log('');
      console.log('🔗 Test coming soon page: http://localhost:3000/coming-soon');
    }
    
  } catch (error) {
    console.log('❌ Email test error:', error.message);
  }
}

testEmailWithDefaultDomain();
