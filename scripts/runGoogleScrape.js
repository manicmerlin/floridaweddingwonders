const fs = require('fs');
const path = require('path');
const { scrapeAllGoogleImages } = require('./scrapeGoogleImages');

// Test with just a few venues first
async function testGoogleScraping() {
  console.log('🧪 Testing Google image scraping with a few venues...');
  
  // Load venues data
  const venuesPath = path.join(__dirname, '../src/data/venues.json');
  let venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
  
  // Backup original data
  const backupPath = path.join(__dirname, `venues-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(venuesData, null, 2));
  console.log(`📋 Created backup: ${path.basename(backupPath)}`);
  
  // Take only first 3 venues for testing
  const testVenues = venuesData.weddingVenues.slice(0, 3);
  const testData = {
    ...venuesData,
    weddingVenues: testVenues
  };
  
  // Save test data temporarily
  fs.writeFileSync(venuesPath, JSON.stringify(testData, null, 2));
  
  try {
    // Run the scraper
    await scrapeAllGoogleImages();
    
    // Restore full data with updates
    const updatedData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
    const fullData = {
      ...venuesData,
      weddingVenues: [
        ...updatedData.weddingVenues, // Updated test venues
        ...venuesData.weddingVenues.slice(3) // Remaining original venues
      ],
      lastUpdated: updatedData.lastUpdated
    };
    
    fs.writeFileSync(venuesPath, JSON.stringify(fullData, null, 2));
    console.log('✅ Test completed and data restored!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Restore original data on failure
    fs.writeFileSync(venuesPath, JSON.stringify(venuesData, null, 2));
    console.log('🔄 Original data restored after failure');
  }
}

// Ask user what they want to do
const args = process.argv.slice(2);

if (args.includes('--test')) {
  testGoogleScraping();
} else if (args.includes('--full')) {
  scrapeAllGoogleImages();
} else {
  console.log('🤖 Google Image Scraper');
  console.log('');
  console.log('Options:');
  console.log('  --test    Test with first 3 venues');
  console.log('  --full    Scrape all venues');
  console.log('');
  console.log('Example: node runGoogleScrape.js --test');
}
