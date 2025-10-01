#!/usr/bin/env node

/**
 * Review Management Script
 * 
 * This script helps update external review data for venues.
 * Usage:
 *   node updateReviews.js --venue "Venue Name" --platform google --rating 4.5 --count 120 --url "https://..."
 *   node updateReviews.js --venue "Venue Name" --platform yelp --rating 4.2 --count 85
 *   node updateReviews.js --venue "Venue Name" --platform theknot --rating 4.7 --count 45
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);

function getArg(name) {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : null;
}

const venue = getArg('venue');
const platform = getArg('platform');
const rating = parseFloat(getArg('rating'));
const count = parseInt(getArg('count'));
const url = getArg('url');

if (!venue || !platform || !rating || !count) {
  console.log('❌ Missing required arguments');
  console.log('Usage: node updateReviews.js --venue "Venue Name" --platform google --rating 4.5 --count 120 [--url "https://..."]');
  console.log('Platforms: google, yelp, theknot, weddingwire');
  process.exit(1);
}

if (!['google', 'yelp', 'theknot', 'weddingwire'].includes(platform)) {
  console.log('❌ Invalid platform. Use: google, yelp, theknot, weddingwire');
  process.exit(1);
}

if (rating < 1 || rating > 5) {
  console.log('❌ Rating must be between 1 and 5');
  process.exit(1);
}

// This would normally update a database
// For now, we'll create a JSON file with review updates
const reviewUpdate = {
  venue: venue,
  platform: platform,
  rating: rating,
  reviewCount: count,
  url: url || `https://www.${platform}.com/venue/${venue.toLowerCase().replace(/\s+/g, '-')}`,
  updatedAt: new Date().toISOString()
};

// Create reviews directory if it doesn't exist
const reviewsDir = path.join(__dirname, 'reviews');
if (!fs.existsSync(reviewsDir)) {
  fs.mkdirSync(reviewsDir, { recursive: true });
}

// Save to file
const filename = `${venue.toLowerCase().replace(/\s+/g, '-')}-${platform}.json`;
const filepath = path.join(reviewsDir, filename);

fs.writeFileSync(filepath, JSON.stringify(reviewUpdate, null, 2));

console.log('✅ Review data updated successfully!');
console.log(`📁 Saved to: ${filepath}`);
console.log(`📊 ${venue} - ${platform}: ${rating}★ (${count} reviews)`);

// Instructions for integrating with the app
console.log('\n📋 Next steps:');
console.log('1. Copy this data to your venue database');
console.log('2. Update the externalReviews field for the venue');
console.log('3. The ReviewsSection component will display the updated data');

// Example integration code
console.log('\n💾 Example integration:');
console.log(`
// Add this to your venue's externalReviews field:
${platform}: {
  ${platform === 'google' ? 'placeId: "ChIJexample",' : ''}
  ${platform === 'yelp' ? 'businessId: "example-venue",' : ''}
  rating: ${rating},
  reviewCount: ${count},
  url: "${reviewUpdate.url}"
}
`);
