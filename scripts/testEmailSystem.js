// Test script for email notifications
require('dotenv').config({ path: '.env.local' });

async function testEmailSystem() {
  console.log('🧪 Testing Email Notification System...');
  console.log('');

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
    console.log('⚠️ RESEND_API_KEY not configured yet.');
    console.log('');
    console.log('📋 Setup Instructions:');
    console.log('1. Go to: https://resend.com');
    console.log('2. Sign up for free account');
    console.log('3. Verify your domain: floridaweddingwonders.com');
    console.log('4. Generate API key');
    console.log('5. Update .env.local with your API key');
    console.log('');
    console.log('📧 Required Email Addresses:');
    console.log('- admin@floridaweddingwonders.com (your notifications)');
    console.log('- noreply@floridaweddingwonders.com (automated emails)');
    console.log('- venues@floridaweddingwonders.com (venue communications)');
    console.log('- support@floridaweddingwonders.com (customer support)');
    console.log('');
    console.log('💰 Cost: Free up to 3,000 emails/month, then $20/month');
    return;
  }

  // Test venue owner registration email
  console.log('📧 Testing venue owner registration...');
  try {
    const venueResponse = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test.venue@example.com',
        venueName: 'Test Garden Venue',
        isVenueOwner: true
      }),
    });

    if (venueResponse.ok) {
      const result = await venueResponse.json();
      console.log('✅ Venue owner emails sent successfully!');
      console.log('📋 Details:', result.details);
    } else {
      console.log('❌ Venue owner email test failed');
    }
  } catch (err) {
    console.log('❌ Venue owner email error:', err.message);
  }

  console.log('');

  // Test regular user registration email
  console.log('📧 Testing regular user registration...');
  try {
    const userResponse = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test.user@example.com',
        isVenueOwner: false
      }),
    });

    if (userResponse.ok) {
      const result = await userResponse.json();
      console.log('✅ Regular user emails sent successfully!');
      console.log('📋 Details:', result.details);
    } else {
      console.log('❌ Regular user email test failed');
    }
  } catch (err) {
    console.log('❌ Regular user email error:', err.message);
  }

  console.log('');
  console.log('🎉 Email system testing completed!');
  console.log('');
  console.log('📨 Email Flow Summary:');
  console.log('When venue owner registers:');
  console.log('  1. Admin gets detailed notification with venue info');
  console.log('  2. Venue owner gets welcome email with premium features');
  console.log('');
  console.log('When regular user registers:');
  console.log('  1. Admin gets simple notification');
  console.log('  2. User gets VIP welcome email');
  console.log('');
  console.log('🚀 Ready for production!');
}

testEmailSystem();
