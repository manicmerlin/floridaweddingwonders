#!/usr/bin/env node

// Simple test script to check email API functionality
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testEmailAPI() {
  try {
    console.log('🧪 Testing Email Capture API...\n');
    
    // Test 1: Regular user signup
    console.log('Test 1: Regular user email capture');
    const response1 = await fetch('https://floridaweddingwonders.com/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'regular_user',
        email: 'test@example.com'
      })
    });
    
    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', result1);
    console.log();
    
    // Test 2: Venue owner signup
    console.log('Test 2: Venue owner email capture');
    const response2 = await fetch('https://floridaweddingwonders.com/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'venue_owner',
        email: 'venue@example.com',
        venueName: 'Test Venue'
      })
    });
    
    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', result2);
    console.log();
    
    // Test 3: Invalid email
    console.log('Test 3: Invalid email format');
    const response3 = await fetch('https://floridaweddingwonders.com/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'regular_user',
        email: 'invalid-email'
      })
    });
    
    const result3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', result3);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmailAPI();
