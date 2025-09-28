const fs = require('fs');
const path = require('path');

// Read the venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const venues = venuesData.weddingVenues;

console.log(`🔍 Checking ${venues.length} venues for closure status...`);
console.log('Scanning for permanently closed venues to remove...\n');

// Known problematic venue patterns (based on common closure indicators)
const suspiciousPatterns = [
  // Generic or vague names that might not be real venues
  /^The [A-Z][a-z]+ (Building|Room|Space)$/,
  // Venues that are likely event planners, not actual venues
  /Celebrations?$/,
  /Events?$/i,
  // Very generic names
  /^Out of the Blue/,
  /^Secret Gardens?$/,
  /^Villa [A-Z][a-z]+$/
];

// High-risk venue categories that should be manually verified
const highRiskCategories = [
  'Historic venues',
  'Small independent venues', 
  'Restaurants/bars',
  'Specialty venues',
  'Boutique accommodations'
];

// Manual verification list of potentially closed venues
// This would normally come from actual web scraping
const manuallyVerifiedClosed = [
  // Add venue names here after manual verification
  // 'Example Closed Venue Name'
];

const manuallyVerifiedOpen = [
  'Hialeah Park Racing & Casino',
  'Vizcaya Museum & Gardens',
  'Ancient Spanish Monastery',
  'Curtiss Mansion',
  'Jungle Island',
  'Hard Rock Café Key West',
  'Bonnet House Museum & Gardens',
  'Stranahan House',
  'The Surfcomber Hotel',
  'JW Marriott Turnberry Resort & Spa',
  'Diplomat Beach Resort',
  'Seminole Hard Rock Hotel & Casino'
  // Add more verified open venues
];

function analyzeVenue(venue, index) {
  const locationParts = venue.location.split(', ');
  const city = locationParts[1] || 'Florida';
  const state = locationParts[2]?.split(' ')[0] || 'FL';
  
  let status = 'NEEDS_VERIFICATION';
  let reason = 'Manual verification required';
  let riskLevel = 'LOW';
  
  // Check if manually verified as closed
  if (manuallyVerifiedClosed.includes(venue.name)) {
    status = 'CLOSED';
    reason = 'Manually verified as permanently closed';
    riskLevel = 'CLOSED';
  }
  // Check if manually verified as open
  else if (manuallyVerifiedOpen.includes(venue.name)) {
    status = 'OPEN';
    reason = 'Manually verified as open';
    riskLevel = 'LOW';
  }
  // Check for suspicious patterns
  else if (suspiciousPatterns.some(pattern => pattern.test(venue.name))) {
    riskLevel = 'HIGH';
    reason = 'Suspicious venue name pattern - needs verification';
  }
  // Check for high-risk indicators
  else if (venue.name.includes('Historic') || venue.name.includes("Woman's Club")) {
    riskLevel = 'MEDIUM';
    reason = 'Historic venue - may have closure risk';
  }
  // Major hotel chains and well-known venues are likely open
  else if (venue.name.includes('Marriott') || venue.name.includes('Hyatt') || 
           venue.name.includes('Hilton') || venue.name.includes('Resort') ||
           venue.name.includes('Museum') || venue.name.includes('State Park')) {
    status = 'LIKELY_OPEN';
    reason = 'Major chain/established venue';
    riskLevel = 'LOW';
  }
  
  return {
    index: index + 1,
    venue: venue,
    status: status,
    reason: reason,
    riskLevel: riskLevel,
    city: city,
    state: state
  };
}

// Process all venues
const results = venues.map((venue, index) => analyzeVenue(venue, index));

// Categorize results
const closed = results.filter(r => r.status === 'CLOSED');
const open = results.filter(r => r.status === 'OPEN' || r.status === 'LIKELY_OPEN');
const highRisk = results.filter(r => r.riskLevel === 'HIGH');
const mediumRisk = results.filter(r => r.riskLevel === 'MEDIUM');
const needsVerification = results.filter(r => r.status === 'NEEDS_VERIFICATION');

console.log('📊 ANALYSIS RESULTS:');
console.log(`✅ Confirmed/Likely Open: ${open.length}`);
console.log(`❌ Confirmed Closed: ${closed.length}`);
console.log(`🔴 High Risk (needs immediate verification): ${highRisk.length}`);
console.log(`🟡 Medium Risk: ${mediumRisk.length}`);
console.log(`⚪ Low Risk: ${needsVerification.filter(r => r.riskLevel === 'LOW').length}`);

// Show high-risk venues
if (highRisk.length > 0) {
  console.log('\n🔴 HIGH RISK VENUES (check these first):');
  highRisk.forEach(r => {
    console.log(`   ${r.index}. ${r.venue.name} (${r.city}) - ${r.reason}`);
  });
}

// Show closed venues
if (closed.length > 0) {
  console.log('\n❌ VENUES TO REMOVE:');
  closed.forEach(r => {
    console.log(`   ${r.venue.name} - ${r.reason}`);
  });
  
  // Create backup before removing
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(__dirname, `venues-backup-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(venuesData, null, 2));
  console.log(`\n📁 Backup created: ${backupPath}`);
  
  // Remove closed venues
  const openVenues = results.filter(r => r.status !== 'CLOSED').map(r => r.venue);
  const updatedData = {
    ...venuesData,
    weddingVenues: openVenues
  };
  
  fs.writeFileSync(venuesPath, JSON.stringify(updatedData, null, 2));
  console.log(`✅ Removed ${closed.length} closed venues`);
  console.log(`📝 Updated venues.json - ${openVenues.length} venues remaining`);
} else {
  console.log('\n✅ No confirmed closed venues to remove at this time');
}

// Save detailed analysis report
const reportData = {
  analysisDate: new Date().toISOString(),
  totalVenues: venues.length,
  summary: {
    open: open.length,
    closed: closed.length,
    highRisk: highRisk.length,
    mediumRisk: mediumRisk.length,
    needsVerification: needsVerification.length
  },
  highRiskVenues: highRisk.map(r => ({
    name: r.venue.name,
    city: r.city,
    reason: r.reason,
    mapsUrl: `https://maps.google.com/maps?q=${encodeURIComponent(r.venue.name + ', ' + r.venue.location)}`,
    searchUrl: `https://www.google.com/search?q="${encodeURIComponent(r.venue.name)}" "${encodeURIComponent(r.city)}" "permanently closed"`
  })),
  allResults: results
};

const reportPath = path.join(__dirname, 'venue-analysis-report.json');
fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
console.log(`\n📊 Full analysis saved to: ${reportPath}`);

// Show quick verification URLs for high-risk venues
if (highRisk.length > 0 && highRisk.length <= 10) {
  console.log('\n🔗 QUICK VERIFICATION URLS (for high-risk venues):');
  highRisk.slice(0, 5).forEach(r => {
    const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(r.venue.name + ', ' + r.venue.location)}`;
    console.log(`${r.venue.name}: ${mapsUrl}`);
  });
}

console.log('\n✅ Analysis complete!');
