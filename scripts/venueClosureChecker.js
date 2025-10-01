const fs = require('fs');
const path = require('path');

// Read the venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const venues = venuesData.weddingVenues;

console.log('🔍 AUTOMATED VENUE CLOSURE VERIFICATION TOOL');
console.log('=' * 60);
console.log(`Total venues to check: ${venues.length}`);
console.log('');

// Create systematic venue checks
const venueChecks = venues.map((venue, index) => {
  // Parse location - it's a string like "100 E 32nd St, Hialeah, FL 33013"
  const locationParts = venue.location.split(', ');
  const city = locationParts[1] || 'Florida';
  const stateZip = locationParts[2] || 'FL';
  const state = stateZip.split(' ')[0] || 'FL';
  
  return {
    id: index + 1,
    name: venue.name,
    city: city,
    state: state,
    fullAddress: venue.location,
    phone: venue.phone || 'N/A',
    website: venue.website || 'N/A',
    // Create properly formatted Google search URLs
    mapsUrl: `https://maps.google.com/maps?q=${encodeURIComponent(venue.name + ', ' + venue.location)}`,
    businessUrl: `https://www.google.com/search?q="${encodeURIComponent(venue.name)}" "${encodeURIComponent(city)}" FL hours phone`,
    closureCheckUrl: `https://www.google.com/search?q="${encodeURIComponent(venue.name)}" "${encodeURIComponent(city)}" "permanently closed"`
  };
});

// Create a manual checking workflow
console.log('STEP-BY-STEP VERIFICATION PROCESS:');
console.log('');
console.log('1. Open the provided URLs in your browser');
console.log('2. Look for these indicators:');
console.log('   ✅ OPEN: Hours listed, phone number, recent reviews, "Open now"');
console.log('   ❌ CLOSED: "Permanently closed", "Temporarily closed", no hours');
console.log('   ⚠️  UNKNOWN: No clear information, conflicting data');
console.log('');

// Show first few venues as examples
console.log('FIRST 5 VENUES (Example workflow):');
console.log('-'.repeat(50));

venueChecks.slice(0, 5).forEach(venue => {
  console.log(`\n📍 ${venue.name} (${venue.city}, ${venue.state})`);
  console.log(`   Maps: ${venue.mapsUrl}`);
  console.log(`   Business: ${venue.businessUrl}`);
  console.log(`   Closure Check: ${venue.closureCheckUrl}`);
});

console.log('\n' + '='.repeat(60));
console.log('💡 PRO TIP: You can copy these URLs and open them in browser tabs');
console.log('   Then quickly scan each one for closure indicators');

// Save all venue check data to files
fs.writeFileSync(
  path.join(__dirname, 'all-venue-checks.json'), 
  JSON.stringify(venueChecks, null, 2)
);

// Create a simple CSV for easy checking
const csvHeader = 'ID,Name,City,State,Status,Notes,Maps_URL,Business_URL,Closure_Check_URL';
const csvRows = venueChecks.map(venue => {
  return `${venue.id},"${venue.name}","${venue.city}","${venue.state}","PENDING","","${venue.mapsUrl}","${venue.businessUrl}","${venue.closureCheckUrl}"`;
});

fs.writeFileSync(
  path.join(__dirname, 'venue-verification-checklist.csv'),
  [csvHeader, ...csvRows].join('\n')
);

// Create a results tracking file
const results = {
  lastUpdated: new Date().toISOString(),
  totalVenues: venues.length,
  checkedCount: 0,
  openCount: 0,
  closedCount: 0,
  unknownCount: 0,
  venues: venueChecks.map(venue => ({
    id: venue.id,
    name: venue.name,
    city: venue.city,
    state: venue.state,
    status: 'PENDING', // OPEN, CLOSED, UNKNOWN
    verifiedDate: null,
    notes: '',
    googleMapsIndicators: '',
    hoursFound: '',
    phoneVerified: ''
  }))
};

fs.writeFileSync(
  path.join(__dirname, 'verification-results.json'),
  JSON.stringify(results, null, 2)
);

console.log('\n📁 FILES CREATED:');
console.log('   • all-venue-checks.json - Complete venue data with URLs');
console.log('   • venue-verification-checklist.csv - Spreadsheet format');
console.log('   • verification-results.json - Track your progress');
console.log('');
console.log('🚀 NEXT STEPS:');
console.log('   1. Open venue-verification-checklist.csv in Excel/Google Sheets');
console.log('   2. Click through the URLs and mark Status as OPEN/CLOSED/UNKNOWN');
console.log('   3. Add notes about what you found');
console.log('   4. Update verification-results.json with findings');

// Create a batch URL file for power users
const allUrls = venueChecks.map(venue => 
  `${venue.name} | ${venue.mapsUrl}`
).join('\n');

fs.writeFileSync(
  path.join(__dirname, 'all-google-maps-urls.txt'),
  allUrls
);

console.log('   5. OR use all-google-maps-urls.txt for bulk checking');
console.log('');
console.log('⏱️  ESTIMATED TIME: ~2-3 minutes per venue = 4-6 hours total');
console.log('💡 RECOMMENDATION: Check high-risk venues first (see previous priority list)');
