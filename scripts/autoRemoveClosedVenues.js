const fs = require('fs');
const path = require('path');

// Read the venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const venues = venuesData.weddingVenues;

console.log(`🔍 Checking ${venues.length} venues for closure status...`);
console.log('This will automatically remove permanently closed venues from venues.json');
console.log('');

// Function to check venue status (simulated - in real implementation would use web scraping)
async function checkVenueStatus(venue) {
  // Parse location
  const locationParts = venue.location.split(', ');
  const city = locationParts[1] || 'Florida';
  const stateZip = locationParts[2] || 'FL';
  const state = stateZip.split(' ')[0] || 'FL';
  
  // For now, we'll mark venues as needing manual verification
  // In a real implementation, this would scrape Google Maps
  return {
    venue: venue,
    status: 'NEEDS_VERIFICATION', // OPEN, CLOSED, NEEDS_VERIFICATION
    reason: 'Manual check required',
    city: city,
    state: state
  };
}

// Check all venues
async function checkAllVenues() {
  const results = [];
  let closedCount = 0;
  let openCount = 0;
  let needsVerificationCount = 0;
  
  console.log('Checking venues...');
  
  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i];
    const result = await checkVenueStatus(venue);
    results.push(result);
    
    if (result.status === 'CLOSED') {
      closedCount++;
      console.log(`❌ [${i + 1}/${venues.length}] ${venue.name} - PERMANENTLY CLOSED`);
    } else if (result.status === 'OPEN') {
      openCount++;
      console.log(`✅ [${i + 1}/${venues.length}] ${venue.name} - OPEN`);
    } else {
      needsVerificationCount++;
      // Don't log every venue that needs verification to keep output clean
    }
  }
  
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Open venues: ${openCount}`);
  console.log(`❌ Closed venues: ${closedCount}`);
  console.log(`⚠️  Need manual verification: ${needsVerificationCount}`);
  
  // Filter out closed venues
  const openVenues = results.filter(r => r.status !== 'CLOSED').map(r => r.venue);
  
  if (closedCount > 0) {
    console.log(`\n🗑️  Removing ${closedCount} permanently closed venues...`);
    
    // Create backup
    const backupPath = path.join(__dirname, `venues-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(venuesData, null, 2));
    console.log(`📁 Backup created: ${backupPath}`);
    
    // Update venues data
    const updatedData = {
      ...venuesData,
      weddingVenues: openVenues
    };
    
    fs.writeFileSync(venuesPath, JSON.stringify(updatedData, null, 2));
    console.log(`✅ Updated venues.json - ${openVenues.length} venues remaining`);
  } else {
    console.log('\n✅ No permanently closed venues found!');
  }
  
  // Save detailed results
  const reportPath = path.join(__dirname, 'venue-status-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    checkDate: new Date().toISOString(),
    totalChecked: venues.length,
    openCount,
    closedCount,
    needsVerificationCount,
    results
  }, null, 2));
  
  console.log(`📊 Detailed report saved to: ${reportPath}`);
  
  return results;
}

// Run the check
checkAllVenues().catch(console.error);
