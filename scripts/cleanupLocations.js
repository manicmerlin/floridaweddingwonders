const fs = require('fs');
const path = require('path');

// Read the venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const venues = venuesData.weddingVenues;

console.log(`🧹 Cleaning up location formatting for ${venues.length} venues...`);
console.log('');

// Function to clean up location format
function cleanLocationFormat(location) {
  if (!location || typeof location !== 'string') {
    return location;
  }
  
  // Split by commas and clean each part
  const parts = location.split(',').map(part => part.trim());
  
  // Remove empty parts
  const cleanParts = parts.filter(part => part.length > 0);
  
  // Join back with proper comma spacing
  return cleanParts.join(', ');
}

// Track changes
let changedCount = 0;
const changes = [];

// Clean all venue locations
const cleanedVenues = venues.map((venue, index) => {
  const originalLocation = venue.location;
  const cleanedLocation = cleanLocationFormat(venue.location);
  
  if (originalLocation !== cleanedLocation) {
    changedCount++;
    changes.push({
      name: venue.name,
      before: originalLocation,
      after: cleanedLocation
    });
    
    console.log(`${index + 1}. ${venue.name}`);
    console.log(`   Before: "${originalLocation}"`);
    console.log(`   After:  "${cleanedLocation}"`);
    console.log('');
  }
  
  return {
    ...venue,
    location: cleanedLocation
  };
});

console.log(`📊 SUMMARY:`);
console.log(`   Total venues: ${venues.length}`);
console.log(`   Locations cleaned: ${changedCount}`);
console.log(`   No changes needed: ${venues.length - changedCount}`);

if (changedCount > 0) {
  // Create backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(__dirname, `venues-backup-location-cleanup-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(venuesData, null, 2));
  console.log(`\n📁 Backup created: ${backupPath}`);
  
  // Update venues data
  const updatedData = {
    ...venuesData,
    weddingVenues: cleanedVenues
  };
  
  fs.writeFileSync(venuesPath, JSON.stringify(updatedData, null, 2));
  console.log(`✅ Updated venues.json with cleaned locations`);
  
  // Save changes report
  const reportData = {
    cleanupDate: new Date().toISOString(),
    totalVenues: venues.length,
    changesCount: changedCount,
    changes: changes
  };
  
  const reportPath = path.join(__dirname, 'location-cleanup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`📊 Cleanup report saved: ${reportPath}`);
} else {
  console.log('\n✅ All locations are already properly formatted!');
}

console.log('\n🎉 Location cleanup complete!');
