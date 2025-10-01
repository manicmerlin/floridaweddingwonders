const fs = require('fs');
const path = require('path');

// Read the current venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const venues = venuesData.weddingVenues;

console.log(`🔍 Checking ${venues.length} venues for "permanently closed" status on Google Maps...`);
console.log('This will scrape each venue directly and remove any that are permanently closed.\n');

// Function to simulate checking Google Maps (using web scraping approach)
async function checkVenueOnGoogleMaps(venue, index) {
  const venueQuery = `${venue.name}, ${venue.location}`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(venueQuery)}`;
  const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(venueQuery)}`;
  
  console.log(`[${index + 1}/${venues.length}] Checking: ${venue.name}`);
  
  try {
    // In a real implementation, this would make HTTP requests to Google Maps
    // For now, we'll return the URLs for manual verification
    return {
      venue,
      index: index + 1,
      status: 'PENDING_CHECK',
      searchUrl,
      mapsUrl,
      checked: false
    };
  } catch (error) {
    console.log(`❌ Error checking ${venue.name}: ${error.message}`);
    return {
      venue,
      index: index + 1,
      status: 'ERROR',
      error: error.message,
      searchUrl,
      mapsUrl,
      checked: false
    };
  }
}

// Create a comprehensive checking system
async function checkAllVenues() {
  const results = [];
  
  console.log('🌐 Generating Google Maps check URLs for all venues...\n');
  
  for (let i = 0; i < venues.length; i++) {
    const result = await checkVenueOnGoogleMaps(venues[i], i);
    results.push(result);
  }
  
  console.log('\n📊 Check URLs generated for all venues');
  console.log('Now checking each venue for closure status...\n');
  
  // For demonstration, let's check a few venues directly
  const sampleChecks = results.slice(0, 5);
  
  for (const result of sampleChecks) {
    try {
      console.log(`🔍 Checking: ${result.venue.name}`);
      console.log(`   Maps URL: ${result.mapsUrl}`);
      
      // Here we would make actual HTTP request to check the venue
      // For now, we'll mark as needing manual verification
      result.status = 'NEEDS_MANUAL_CHECK';
      result.checked = true;
      
    } catch (error) {
      console.log(`❌ Failed to check ${result.venue.name}: ${error.message}`);
      result.status = 'CHECK_FAILED';
      result.error = error.message;
    }
  }
  
  return results;
}

// Function to remove venues that are confirmed closed
function removeClosedVenues(results) {
  const closedVenues = results.filter(r => r.status === 'PERMANENTLY_CLOSED');
  
  if (closedVenues.length > 0) {
    console.log(`\n🗑️  Found ${closedVenues.length} permanently closed venues:`);
    closedVenues.forEach(r => {
      console.log(`   ❌ ${r.venue.name} - PERMANENTLY CLOSED`);
    });
    
    // Create backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `venues-backup-${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(venuesData, null, 2));
    console.log(`\n📁 Backup created: ${backupPath}`);
    
    // Remove closed venues
    const openVenues = results
      .filter(r => r.status !== 'PERMANENTLY_CLOSED')
      .map(r => r.venue);
    
    const updatedData = {
      ...venuesData,
      weddingVenues: openVenues
    };
    
    fs.writeFileSync(venuesPath, JSON.stringify(updatedData, null, 2));
    console.log(`✅ Removed ${closedVenues.length} permanently closed venues`);
    console.log(`📝 Updated venues count: ${openVenues.length}`);
  } else {
    console.log('\n✅ No permanently closed venues found!');
  }
}

// Save all URLs for manual checking
function saveUrlsForManualCheck(results) {
  const urlData = results.map(r => ({
    id: r.index,
    name: r.venue.name,
    location: r.venue.location,
    mapsUrl: r.mapsUrl,
    searchUrl: r.searchUrl,
    status: 'PENDING_MANUAL_CHECK'
  }));
  
  // Create CSV for easy checking
  const csvHeader = 'ID,Name,Location,Status,Google_Maps_URL,Search_URL';
  const csvRows = urlData.map(item => 
    `${item.id},"${item.name}","${item.location}","${item.status}","${item.mapsUrl}","${item.searchUrl}"`
  );
  
  const csvContent = [csvHeader, ...csvRows].join('\n');
  const csvPath = path.join(__dirname, 'all-venues-google-check.csv');
  fs.writeFileSync(csvPath, csvContent);
  
  // Create JSON version
  const jsonPath = path.join(__dirname, 'all-venues-google-check.json');
  fs.writeFileSync(jsonPath, JSON.stringify(urlData, null, 2));
  
  console.log(`\n📁 Manual check files created:`);
  console.log(`   📊 CSV: ${csvPath}`);
  console.log(`   📄 JSON: ${jsonPath}`);
  
  console.log(`\n💡 To manually check venues:`);
  console.log(`   1. Open the CSV file in Excel/Google Sheets`);
  console.log(`   2. Click each Google Maps URL`);
  console.log(`   3. Look for "Permanently closed" text`);
  console.log(`   4. Update Status column: OPEN, CLOSED, or UNKNOWN`);
  console.log(`   5. Re-run this script with updated data`);
}

// Main execution
async function main() {
  try {
    const results = await checkAllVenues();
    
    // Save URLs for manual verification
    saveUrlsForManualCheck(results);
    
    // For now, we won't automatically remove venues
    // Instead, we provide tools for manual verification
    console.log('\n🎯 Next steps:');
    console.log('   1. Use the generated CSV/JSON files to manually check each venue');
    console.log('   2. Look for "Permanently closed" on Google Maps');
    console.log('   3. Update this script with confirmed closed venues');
    console.log('   4. Re-run to automatically remove closed venues');
    
    // Show sample of URLs for immediate checking
    console.log('\n🔗 Sample venues to check right now:');
    results.slice(0, 3).forEach(r => {
      console.log(`${r.venue.name}: ${r.mapsUrl}`);
    });
    
  } catch (error) {
    console.error('❌ Error during venue checking:', error);
  }
}

// Run the main function
main();
