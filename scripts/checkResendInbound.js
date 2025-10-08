// Test script to set up email forwarding using Resend API
const https = require('https');

// First, let's check if Resend has inbound email endpoints
function checkInboundEmails() {
  const options = {
    hostname: 'api.resend.com',
    path: '/emails/inbound',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Inbound emails response:');
        try {
          console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
          console.log(data);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    req.end();
  });
}

// Check for webhook endpoints
function checkWebhooks() {
  const options = {
    hostname: 'api.resend.com',
    path: '/webhooks',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('\nWebhooks:');
        console.log('Status Code:', res.statusCode);
        try {
          console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
          console.log(data);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('=== Checking Resend Account for Email Forwarding Options ===\n');
  
  await checkInboundEmails();
  await checkWebhooks();
  
  console.log('\n=== Summary ===');
  console.log('If Resend doesn\'t support inbound yet, we\'ll use ImprovMX instead.');
}

main().catch(console.error);
