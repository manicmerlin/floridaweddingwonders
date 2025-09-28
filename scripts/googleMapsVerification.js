const fs = require('fs');
const path = require('path');

// Read the venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));

const venues = venuesData.weddingVenues;

console.log('Creating Google Maps closure verification script...');
console.log('=' * 60);

// Create a list of venues with their Google Maps search queries
const venueChecks = venues.map((venue, index) => {
  // Parse location - it's a string like "100 E 32nd St, Hialeah, FL 33013"
  const locationParts = venue.location.split(', ');
  const city = locationParts[1] || 'Florida';
  const stateZip = locationParts[2] || 'FL';
  const state = stateZip.split(' ')[0] || 'FL';
  
  const googleMapsQuery = `${venue.name} ${city} ${state}`;
  
  return {
    id: index + 1,
    name: venue.name,
    city: city,
    state: state,
    address: venue.location,
    phone: venue.phone || 'N/A',
    website: venue.website || 'N/A',
    googleMapsQuery: googleMapsQuery,
    googleMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(googleMapsQuery)}`,
    businessSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(googleMapsQuery + ' permanently closed OR temporarily closed OR hours OR phone')}`
  };
});

// Write comprehensive check file
const checkData = {
  totalVenues: venues.length,
  lastUpdated: new Date().toISOString(),
  venues: venueChecks
};

fs.writeFileSync(
  path.join(__dirname, 'venue-closure-check.json'), 
  JSON.stringify(checkData, null, 2)
);

// Create a simple verification script
const verificationScript = `
// Google Maps Venue Closure Verification Script
// This script helps systematically check each venue for closure status

const venues = ${JSON.stringify(venueChecks, null, 2)};

console.log('GOOGLE MAPS VENUE CLOSURE VERIFICATION');
console.log('Total venues to check: ' + venues.length);
console.log('=' * 50);

// Function to check individual venue
function checkVenue(venueIndex) {
  if (venueIndex >= venues.length) {
    console.log('\\nAll venues checked!');
    return;
  }
  
  const venue = venues[venueIndex];
  console.log(\`\\n[\${venue.id}/\${venues.length}] \${venue.name}\`);
  console.log(\`City: \${venue.city}, \${venue.state}\`);
  console.log(\`Google Maps: \${venue.googleMapsUrl}\`);
  console.log(\`Business Search: \${venue.businessSearchUrl}\`);
  console.log('Look for: "Permanently closed", "Temporarily closed", "Hours", "Phone number"');
  console.log('-'.repeat(60));
}

// Check all venues
function checkAllVenues() {
  venues.forEach((venue, index) => {
    checkVenue(index);
  });
}

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { venues, checkVenue, checkAllVenues };
}

// Auto-run if called directly
if (require.main === module) {
  checkAllVenues();
}
`;

fs.writeFileSync(
  path.join(__dirname, 'verifyGoogleMaps.js'), 
  verificationScript
);

// Create a batch check URLs file for easy copy/paste
const urlsForBatchCheck = venueChecks.map(venue => 
  `${venue.name} | ${venue.googleMapsUrl}`
).join('\n');

fs.writeFileSync(
  path.join(__dirname, 'google-maps-urls.txt'), 
  urlsForBatchCheck
);

console.log('Created files:');
console.log('1. venue-closure-check.json - Complete venue data');
console.log('2. verifyGoogleMaps.js - Verification script');
console.log('3. google-maps-urls.txt - Batch URLs for manual checking');
console.log('');
console.log('To run verification script:');
console.log('node scripts/verifyGoogleMaps.js');
console.log('');
console.log('Each venue will show:');
console.log('- Google Maps search link');
console.log('- Business info search link');
console.log('- What to look for (permanently closed, hours, etc.)');

// Also create a results tracking template
const resultsTemplate = {
  checkDate: new Date().toISOString(),
  checkedBy: 'Manual verification',
  results: venueChecks.map(venue => ({
    name: venue.name,
    city: venue.city,
    status: 'PENDING', // OPEN, PERMANENTLY_CLOSED, TEMPORARILY_CLOSED, UNKNOWN
    notes: '',
    lastVerified: null,
    googleMapsStatus: '',
    hoursListed: '',
    phoneWorking: ''
  }))
};

fs.writeFileSync(
  path.join(__dirname, 'venue-status-results.json'), 
  JSON.stringify(resultsTemplate, null, 2)
);

console.log('4. venue-status-results.json - Template for recording results');
console.log('');
console.log('Update venue-status-results.json as you check each venue!');
