const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function testVerifiedDomain() {
  try {
    console.log('🧪 Testing verified domain email...');
    const result = await resend.emails.send({
      from: 'Florida Wedding Wonders <noreply@floridaweddingwonders.com>',
      to: ['bennett.boundless@gmail.com'],
      subject: '✅ Domain Verification Test - No More Phishing Flags!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #f0fdf4; border-radius: 12px;">
          <h1 style="color: #10b981; text-align: center;">🎉 Success!</h1>
          <p style="color: #334155; font-size: 16px;">Your <strong>floridaweddingwonders.com</strong> domain is now fully verified and working!</p>
          <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #166534;"><strong>✅ No phishing flags</strong><br>
            <strong>✅ Professional sender address</strong><br>
            <strong>✅ Full SPF/DKIM authentication</strong></p>
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: center;">This email was sent from: noreply@floridaweddingwonders.com</p>
        </div>
      `,
      text: 'Success! Your floridaweddingwonders.com domain is verified and working. No more phishing flags!'
    });
    console.log('✅ Email sent successfully from verified domain:', result);
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

testVerifiedDomain();
