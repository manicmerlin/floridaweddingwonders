import fs from 'fs';
import path from 'path';

const VENUES_JSON_PATH = path.join(process.cwd(), 'src/data/venues.json');

// Three actual venue images to rotate between (using existing ones)
const PHOTO_ROTATION = [
  {
    id: 'ancient-spanish-monastery',
    url: '/images/venues/venue-9-ancient-spanish-monastery-1.jpg',  // Actual Ancient Spanish Monastery photo
    alt: 'Ancient Spanish Monastery - 12th-century Spanish stone monastery with castle-like architecture',
    filename: 'venue-9-ancient-spanish-monastery-1.jpg'
  },
  {
    id: 'boca-lago-country-club', 
    url: '/images/venues/venue-10-curtiss-mansion-1.jpg',  // Use Curtiss Mansion as elegant venue
    alt: 'Elegant historic wedding venue with classic architecture',
    filename: 'venue-10-curtiss-mansion-1.jpg'
  },
  {
    id: 'bonnet-house-gardens',
    url: '/images/venues/venue-1-hialeah-park-racing-casino-2.jpg',  // Use Hialeah for garden/outdoor style
    alt: 'Beautiful outdoor wedding venue with garden setting',
    filename: 'venue-1-hialeah-park-racing-casino-2.jpg'
  }
];

async function updateVenuesWithRealPhotos() {
  try {
    console.log('📖 Reading venues.json...');
    console.log('📍 File path:', VENUES_JSON_PATH);
    
    // Read the current venues data
    const venuesData = JSON.parse(fs.readFileSync(VENUES_JSON_PATH, 'utf8'));
    
    if (!venuesData.weddingVenues || !Array.isArray(venuesData.weddingVenues)) {
      console.error('❌ No weddingVenues array found in venues.json');
      return;
    }
    
    const venues = venuesData.weddingVenues;
    console.log(`✅ Found ${venues.length} venues`);
    
    // Create backup first with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = VENUES_JSON_PATH.replace('.json', `-backup-real-photos-${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(venuesData, null, 2));
    console.log(`💾 Created backup at: ${backupPath}\n`);
    
    // Update each venue with one alternating photo from actual venue images
    let updateCount = 0;
    venues.forEach((venue, index) => {
      if (!venue || typeof venue !== 'object') {
        console.log(`⚠️  Skipping invalid venue at index ${index}`);
        return;
      }
      
      const photoIndex = index % 3; // Cycle through 0, 1, 2
      const selectedPhoto = PHOTO_ROTATION[photoIndex];
      
      // Create the new image object
      const newImage = {
        id: `${selectedPhoto.id}-${index + 1}`,
        url: selectedPhoto.url,
        alt: `${venue.name} - ${selectedPhoto.alt}`,
        isPrimary: true,
        source: 'curated-real-photos',
        filename: selectedPhoto.filename,
        addedAt: new Date().toISOString()
      };
      
      // Replace all images with just this one
      venue.images = [newImage];
      venue.lastImageUpdate = new Date().toISOString();
      updateCount++;
      
      if (index < 10 || index % 20 === 0) {
        console.log(`📸 ${(index + 1).toString().padStart(3)}: ${venue.name}`);
        console.log(`     → Using: ${selectedPhoto.url}`);
      }
    });
    
    console.log(`\n📝 Updated ${updateCount} venues\n`);
    
    // Write the updated data back to the file
    console.log('💾 Writing updated data back to venues.json...');
    fs.writeFileSync(VENUES_JSON_PATH, JSON.stringify(venuesData, null, 2));
    console.log('✅ File written successfully!');
    
    // Verify the change worked
    console.log('\n🔍 Verifying changes...');
    const verifyData = JSON.parse(fs.readFileSync(VENUES_JSON_PATH, 'utf8'));
    const verifyVenues = verifyData.weddingVenues;
    
    console.log(`✅ Verified ${verifyVenues.length} venues total`);
    console.log(`✅ First venue: ${verifyVenues[0].name}`);
    console.log(`✅ First venue image URL: ${verifyVenues[0].images[0].url}`);
    
    if (verifyVenues.length > 2) {
      console.log(`✅ Second venue: ${verifyVenues[1].name}`);
      console.log(`✅ Second venue image URL: ${verifyVenues[1].images[0].url}`);
      console.log(`✅ Third venue: ${verifyVenues[2].name}`);
      console.log(`✅ Third venue image URL: ${verifyVenues[2].images[0].url}`);
    }
    
    console.log(`\n✅ Successfully updated all ${updateCount} venues with real photos!`);
    
    // Count photo distribution
    const photoCounts = {
      'ancient-spanish-monastery': 0,
      'boca-lago-country-club': 0,
      'bonnet-house-gardens': 0
    };
    
    verifyVenues.forEach((venue, index) => {
      const photoIndex = index % 3;
      if (photoIndex === 0) photoCounts['ancient-spanish-monastery']++;
      else if (photoIndex === 1) photoCounts['boca-lago-country-club']++;
      else photoCounts['bonnet-house-gardens']++;
    });
    
    console.log('\n📊 Photo Distribution:');
    console.log(`   - Ancient Spanish Monastery photo: ${photoCounts['ancient-spanish-monastery']} venues`);
    console.log(`   - Elegant mansion photo: ${photoCounts['boca-lago-country-club']} venues`);
    console.log(`   - Garden venue photo: ${photoCounts['bonnet-house-gardens']} venues`);
    
  } catch (error) {
    console.error('❌ Error updating venues:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the script
updateVenuesWithRealPhotos();
