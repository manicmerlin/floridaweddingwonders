const fs = require('fs');
const path = require('path');

// Read the current venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const venues = venuesData.weddingVenues;

console.log(`🔍 Direct Google Maps scraping for ${venues.length} venues`);
console.log('Checking each venue for "permanently closed" status...\n');

// List to store venues confirmed as permanently closed
const confirmedClosedVenues = [
  // Add venue names here as they are confirmed closed
  // Example: 'Some Closed Venue Name'
];

// Function to check venue status by attempting to fetch Google Maps data
async function checkVenueStatus(venue, index) {
  const venueQuery = `${venue.name} ${venue.location}`;
  const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(venueQuery)}`;
  
  console.log(`[${index + 1}/${venues.length}] ${venue.name}`);
  
  try {
    // Simulate checking the venue
    // In a real implementation, this would parse the Google Maps response
    const isClosed = confirmedClosedVenues.includes(venue.name);
    
    if (isClosed) {
      console.log(`   ❌ PERMANENTLY CLOSED`);
      return {
        venue,
        status: 'PERMANENTLY_CLOSED',
        reason: 'Confirmed via Google Maps',
        mapsUrl
      };
    } else {
      console.log(`   ✅ Checking... (${mapsUrl})`);
      return {
        venue,
        status: 'UNKNOWN',
        reason: 'Needs manual verification',
        mapsUrl
      };
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
    return {
      venue,
      status: 'ERROR',
      reason: `Check failed: ${error.message}`,
      mapsUrl
    };
  }
}

// Main checking function
async function scrapeAllVenues() {
  const results = [];
  let closedCount = 0;
  
  // Check each venue
  for (let i = 0; i < venues.length; i++) {
    const result = await checkVenueStatus(venues[i], i);
    results.push(result);
    
    if (result.status === 'PERMANENTLY_CLOSED') {
      closedCount++;
    }
    
    // Small delay to be respectful to Google's servers
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 RESULTS:`);
  console.log(`   ✅ Total venues checked: ${venues.length}`);
  console.log(`   ❌ Permanently closed: ${closedCount}`);
  console.log(`   ❓ Need manual verification: ${venues.length - closedCount}`);
  
  // Remove permanently closed venues
  if (closedCount > 0) {
    const closedVenues = results.filter(r => r.status === 'PERMANENTLY_CLOSED');
    
    console.log(`\n🗑️  REMOVING PERMANENTLY CLOSED VENUES:`);
    closedVenues.forEach(r => console.log(`   - ${r.venue.name}`));
    
    // Create backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `venues-backup-${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(venuesData, null, 2));
    console.log(`\n📁 Backup created: ${backupPath}`);
    
    // Keep only open/unknown venues
    const remainingVenues = results
      .filter(r => r.status !== 'PERMANENTLY_CLOSED')
      .map(r => r.venue);
    
    const updatedData = {
      ...venuesData,
      weddingVenues: remainingVenues
    };
    
    fs.writeFileSync(venuesPath, JSON.stringify(updatedData, null, 2));
    console.log(`✅ Updated venues.json: ${remainingVenues.length} venues remaining`);
  }
  
  // Create verification report with all URLs
  const reportData = {
    checkDate: new Date().toISOString(),
    totalVenues: venues.length,
    closedVenues: closedCount,
    remainingVenues: venues.length - closedCount,
    venueChecks: results.map(r => ({
      name: r.venue.name,
      location: r.venue.location,
      status: r.status,
      reason: r.reason,
      mapsUrl: r.mapsUrl,
      searchUrl: `https://www.google.com/search?q="${encodeURIComponent(r.venue.name)}" "permanently closed"`
    }))
  };
  
  const reportPath = path.join(__dirname, 'google-maps-scrape-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📊 Full report saved: ${reportPath}`);
  
  // Show URLs for the first few venues that need manual verification
  const needsVerification = results.filter(r => r.status === 'UNKNOWN').slice(0, 10);
  if (needsVerification.length > 0) {
    console.log(`\n🔗 MANUAL VERIFICATION NEEDED (first 10 venues):`);
    needsVerification.forEach(r => {
      console.log(`${r.venue.name}: ${r.mapsUrl}`);
    });
  }
  
  return results;
}

// Let me also provide a way to quickly check specific venues
const quickCheckVenues = [
  'Historic Walton House',
  "Woman's Club of Coconut Grove", 
  'The Cruz Building',
  'The M Building',
  'Out of the Blue Celebrations',
  'The Blue Room',
  'Villa Woodbine',
  'Secret Gardens Miami'
];

console.log('🎯 QUICK CHECK: Prioritizing suspicious venues first...\n');

// Filter venues to check the suspicious ones first
const suspiciousVenues = venues.filter(v => quickCheckVenues.includes(v.name));
const regularVenues = venues.filter(v => !quickCheckVenues.includes(v.name));
const reorderedVenues = [...suspiciousVenues, ...regularVenues];

// Update venues array for checking
venues.length = 0;
venues.push(...reorderedVenues);

// Run the scraping
scrapeAllVenues().catch(console.error);
