const fs = require('fs');
const path = require('path');

// Read the venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const venues = venuesData.weddingVenues;

console.log(`🔍 Manual venue verification and cleanup`);
console.log(`Starting with ${venues.length} venues\n`);

// Venues that I've manually verified as potentially closed or problematic
// Based on search patterns and common venue closure indicators
const suspiciousVenues = [
  // These appear to be generic building names rather than actual wedding venues
  'The Cruz Building',
  'The M Building',
  
  // These might be event planners rather than actual venues
  'Out of the Blue Celebrations',
  
  // Very generic names that are suspicious
  'The Blue Room',
  
  // Venues that might not be actual wedding venues
  'East Sister Rock Island', // This appears twice in the list
  
  // Historic venues that might have closure risk
  'Historic Walton House',
  "Woman's Club of Coconut Grove"
];

// Let me check for duplicates first
const venueNames = venues.map(v => v.name);
const duplicates = venueNames.filter((name, index) => venueNames.indexOf(name) !== index);

if (duplicates.length > 0) {
  console.log('🔍 Found duplicate venues:');
  duplicates.forEach(name => {
    console.log(`   - ${name}`);
  });
}

// Remove duplicates
const uniqueVenues = venues.filter((venue, index, self) => 
  index === self.findIndex(v => v.name === venue.name)
);

console.log(`📊 Removed ${venues.length - uniqueVenues.length} duplicate venues`);

// Check for venues with suspicious characteristics
let venuesToRemove = [];
let venuesNeedingVerification = [];

uniqueVenues.forEach((venue, index) => {
  const locationParts = venue.location.split(', ');
  const city = locationParts[1] || 'Unknown';
  
  // Check if venue is in suspicious list
  if (suspiciousVenues.includes(venue.name)) {
    venuesNeedingVerification.push({
      venue,
      reason: 'Suspicious venue name or potential closure risk',
      city
    });
  }
  
  // Check for obviously problematic entries
  if (!venue.name || venue.name.trim() === '' || 
      !venue.location || venue.location.trim() === '') {
    venuesToRemove.push({
      venue,
      reason: 'Missing essential information',
      city
    });
  }
  
  // Check for venues that might be event planners, not venues
  if (venue.name.toLowerCase().includes('celebration') && 
      !venue.name.toLowerCase().includes('hotel') &&
      !venue.name.toLowerCase().includes('resort') &&
      !venue.name.toLowerCase().includes('hall')) {
    venuesNeedingVerification.push({
      venue,
      reason: 'Might be event planner, not venue',
      city
    });
  }
});

console.log('\n📊 ANALYSIS RESULTS:');
console.log(`✅ Clean venues: ${uniqueVenues.length - venuesToRemove.length - venuesNeedingVerification.length}`);
console.log(`❌ Venues to remove: ${venuesToRemove.length}`);
console.log(`⚠️  Venues needing verification: ${venuesNeedingVerification.length}`);

// Show venues that will be removed
if (venuesToRemove.length > 0) {
  console.log('\n❌ REMOVING VENUES (missing essential info):');
  venuesToRemove.forEach(item => {
    console.log(`   - ${item.venue.name || 'UNNAMED'} (${item.city}) - ${item.reason}`);
  });
}

// Show venues needing verification
if (venuesNeedingVerification.length > 0) {
  console.log('\n⚠️  VENUES NEEDING MANUAL VERIFICATION:');
  venuesNeedingVerification.forEach(item => {
    console.log(`   - ${item.venue.name} (${item.city}) - ${item.reason}`);
    console.log(`     Maps: https://maps.google.com/maps?q=${encodeURIComponent(item.venue.name + ', ' + item.venue.location)}`);
  });
  
  console.log('\n💡 Please manually verify the above venues and add their names to venuesToRemove if closed.');
}

// For now, only remove venues with missing essential information
// Don't remove suspicious venues until manually verified
const cleanVenues = uniqueVenues.filter(venue => 
  !venuesToRemove.some(item => item.venue.name === venue.name)
);

if (venuesToRemove.length > 0 || venues.length !== cleanVenues.length) {
  // Create backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(__dirname, `venues-backup-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(venuesData, null, 2));
  console.log(`\n📁 Backup created: ${backupPath}`);
  
  // Update venues data
  const updatedData = {
    ...venuesData,
    weddingVenues: cleanVenues
  };
  
  fs.writeFileSync(venuesPath, JSON.stringify(updatedData, null, 2));
  console.log(`✅ Updated venues.json`);
  console.log(`📝 Final count: ${cleanVenues.length} venues (removed ${venues.length - cleanVenues.length})`);
} else {
  console.log('\n✅ No venues removed - all appear to have essential information');
}

// Save verification report
const reportData = {
  cleanupDate: new Date().toISOString(),
  originalCount: venues.length,
  finalCount: cleanVenues.length,
  duplicatesRemoved: venues.length - uniqueVenues.length,
  problemVenuesRemoved: venuesToRemove.length,
  venuesNeedingVerification: venuesNeedingVerification.map(item => ({
    name: item.venue.name,
    city: item.city,
    reason: item.reason,
    location: item.venue.location
  }))
};

const reportPath = path.join(__dirname, 'venue-cleanup-report.json');
fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
console.log(`\n📊 Cleanup report saved to: ${reportPath}`);
console.log('\n✅ Venue cleanup complete!');
