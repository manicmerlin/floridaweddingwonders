const fs = require('fs');
const path = require('path');

// Check current venue issues
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const venues = venuesData.weddingVenues || [];

console.log('🔍 Analyzing venue data issues...\n');

console.log('📊 Current venue statistics:');
console.log('Total venues:', venues.length);

// Check for duplicates by name
const nameCount = {};
venues.forEach(venue => {
  nameCount[venue.name] = (nameCount[venue.name] || 0) + 1;
});

const duplicates = Object.entries(nameCount).filter(([name, count]) => count > 1);
console.log('Duplicate venues:', duplicates.length);

if (duplicates.length > 0) {
  console.log('\n🚨 DUPLICATES FOUND:');
  duplicates.slice(0, 10).forEach(([name, count]) => {
    console.log(`  • ${name}: ${count} times`);
  });
}

// Check image issues
let venuesWithRealImages = 0;
let venuesWithPlaceholders = 0;
let imageIssues = [];

venues.forEach(venue => {
  const hasRealImages = venue.images && venue.images.some(img => img.url.indexOf('placeholder') === -1);
  const hasPlaceholders = venue.images && venue.images.some(img => img.url.indexOf('placeholder') !== -1);
  
  if (hasRealImages) venuesWithRealImages++;
  if (hasPlaceholders) venuesWithPlaceholders++;
  
  // Check for image issues
  if (venue.images) {
    venue.images.forEach((img, idx) => {
      if (!img.url.startsWith('/images/venues/') && img.url.indexOf('placeholder') === -1) {
        imageIssues.push({
          venue: venue.name,
          imageIndex: idx,
          imageUrl: img.url.substring(0, 100) + '...'
        });
      }
    });
  }
});

console.log('\n📸 Image statistics:');
console.log('Venues with real images:', venuesWithRealImages);
console.log('Venues with placeholders:', venuesWithPlaceholders);
console.log('Image URL issues:', imageIssues.length);

if (imageIssues.length > 0) {
  console.log('\n🚨 IMAGE ISSUES FOUND:');
  imageIssues.slice(0, 5).forEach(issue => {
    console.log(`  • ${issue.venue} [${issue.imageIndex}]: ${issue.imageUrl}`);
  });
}

// Show some examples of venue entries
console.log('\n📋 Sample venue entries:');
venues.slice(0, 3).forEach((venue, idx) => {
  console.log(`\n${idx + 1}. ${venue.name}:`);
  console.log(`   Images: ${venue.images ? venue.images.length : 0}`);
  if (venue.images && venue.images.length > 0) {
    console.log(`   First image: ${venue.images[0].url.substring(0, 60)}...`);
  }
});

console.log('\n🎯 RECOMMENDATIONS:');
if (duplicates.length > 0) {
  console.log('1. ❌ Remove duplicate venues');
}
if (imageIssues.length > 0) {
  console.log('2. ❌ Fix image URL paths');
}
console.log('3. ✅ Clean and rebuild venue database');
