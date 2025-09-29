import fs from 'fs';
import path from 'path';

const VENUES_JSON_PATH = path.join(process.cwd(), 'src/data/venues.json');

// Three photos to rotate between
const PHOTO_ROTATION = [
  {
    id: 'ancient-spanish-monastery',
    url: '/images/ancient-spanish-monastery.jpg',
    alt: 'Ancient Spanish Monastery - 12th-century Spanish stone monastery with castle-like architecture',
    filename: 'ancient-spanish-monastery.jpg'
  },
  {
    id: 'boca-lago-country-club', 
    url: '/images/boca-lago-country-club.jpg',
    alt: 'Boca Lago Country Club - Country club with banquet hall offering golf course views',
    filename: 'boca-lago-country-club.jpg'
  },
  {
    id: 'bonnet-house-museum-gardens',
    url: '/images/bonnet-house-museum-gardens.jpg', 
    alt: 'Bonnet House Museum & Gardens - 1920s historic Southern plantation style home on 35 lush acres',
    filename: 'bonnet-house-museum-gardens.jpg'
  }
];

async function updateVenuesWithThreePhotos() {
  try {
    console.log('📖 Reading venues.json...');
    console.log('📍 File path:', VENUES_JSON_PATH);
    
    // Read the current venues data
    const venuesData = JSON.parse(fs.readFileSync(VENUES_JSON_PATH, 'utf8'));
    
    if (!venuesData.weddingVenues) {
      console.error('❌ No weddingVenues array found in venues.json');
      return;
    }
    
    const venues = venuesData.weddingVenues;
    console.log(`✅ Found ${venues.length} venues\n`);
    
    // Create backup first
    const backupPath = VENUES_JSON_PATH.replace('.json', '-backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(venuesData, null, 2));
    console.log(`💾 Created backup at: ${backupPath}\n`);
    
    // Update each venue with one alternating photo
    venues.forEach((venue, index) => {
      const photoIndex = index % 3; // Cycle through 0, 1, 2
      const selectedPhoto = PHOTO_ROTATION[photoIndex];
      
      // Create the new image object
      const newImage = {
        id: `${selectedPhoto.id}-${index + 1}`,
        url: selectedPhoto.url,
        alt: `${venue.name} - ${selectedPhoto.alt}`,
        isPrimary: true,
        source: 'curated-rotation',
        filename: selectedPhoto.filename,
        addedAt: new Date().toISOString()
      };
      
      // Replace all images with just this one
      venue.images = [newImage];
      venue.lastImageUpdate = new Date().toISOString();
      
      console.log(`📸 ${(index + 1).toString().padStart(3)}: ${venue.name}`);
      console.log(`     → Using: ${selectedPhoto.id}`);
    });
    
    // Write the updated data back to the file
    console.log('\n💾 Writing updated data back to venues.json...');
    fs.writeFileSync(VENUES_JSON_PATH, JSON.stringify(venuesData, null, 2));
    console.log('✅ File written successfully!');
    
    // Verify the change worked
    console.log('\n🔍 Verifying changes...');
    const verifyData = JSON.parse(fs.readFileSync(VENUES_JSON_PATH, 'utf8'));
    const firstVenue = verifyData.weddingVenues[0];
    console.log(`First venue: ${firstVenue.name}`);
    console.log(`First venue image URL: ${firstVenue.images[0].url}`);
    console.log(`First venue images count: ${firstVenue.images.length}`);
    
    console.log(`\n✅ Successfully updated all ${venues.length} venues!`);
    console.log('\n📊 Photo Distribution:');
    
    // Count how many venues use each photo
    const photoCounts = {
      'ancient-spanish-monastery': 0,
      'boca-lago-country-club': 0,
      'bonnet-house-museum-gardens': 0
    };
    
    venues.forEach((venue, index) => {
      const photoIndex = index % 3;
      const photoKey = PHOTO_ROTATION[photoIndex].id;
      photoCounts[photoKey]++;
    });
    
    console.log(`   - Ancient Spanish Monastery: ${photoCounts['ancient-spanish-monastery']} venues`);
    console.log(`   - Boca Lago Country Club: ${photoCounts['boca-lago-country-club']} venues`);
    console.log(`   - Bonnet House Museum & Gardens: ${photoCounts['bonnet-house-museum-gardens']} venues`);
    
  } catch (error) {
    console.error('❌ Error updating venues:', error);
  }
}

// Run the script
updateVenuesWithThreePhotos();
