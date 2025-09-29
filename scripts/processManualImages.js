const fs = require('fs');
const path = require('path');
const https = require('https');

// Process manually collected image URLs
async function processManualImageCollection() {
  console.log('🚀 Processing manually collected venue images...');
  
  // Load CSV with manual image URLs
  const csvPath = path.join(__dirname, 'venue-image-collection-template.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV template not found. Run the main script first.');
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  // Find column indexes
  const nameIndex = headers.findIndex(h => h.includes('Venue Name'));
  const image1Index = headers.findIndex(h => h.includes('Image URL 1'));
  const image2Index = headers.findIndex(h => h.includes('Image URL 2'));
  const image3Index = headers.findIndex(h => h.includes('Image URL 3'));
  
  // Load venues
  const venuesPath = path.join(__dirname, '../src/data/venues.json');
  const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
  const venues = venuesData.weddingVenues || [];
  
  // Create images directory
  const imagesDir = path.join(__dirname, '../public/images/venues');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  let processedCount = 0;
  const updatedVenues = [];
  
  // Process each venue
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const columns = line.split(',').map(col => col.replace(/"/g, ''));
    const venueName = columns[nameIndex];
    const imageUrl1 = columns[image1Index];
    const imageUrl2 = columns[image2Index];
    const imageUrl3 = columns[image3Index];
    
    console.log(`\n📸 Processing: ${venueName}`);
    
    // Find venue in database
    const venue = venues.find(v => v.name === venueName);
    if (!venue) {
      console.log(`  ⚠️  Venue not found in database`);
      continue;
    }
    
    // Process images if URLs provided
    const imageUrls = [imageUrl1, imageUrl2, imageUrl3].filter(url => url && url.trim() && url !== 'N/A');
    
    if (imageUrls.length === 0) {
      console.log(`  ⏭️  No image URLs provided, skipping`);
      updatedVenues.push(venue);
      continue;
    }
    
    const venueImages = [];
    
    for (let j = 0; j < imageUrls.length; j++) {
      const imageUrl = imageUrls[j];
      
      try {
        console.log(`  ⬇️  Downloading image ${j + 1}...`);
        
        const filename = generateSafeFilename(venueName, processedCount, j);
        const filepath = path.join(imagesDir, filename);
        
        await downloadImage(imageUrl, filepath);
        
        const venueImage = {
          id: `img-manual-${processedCount}-${j}`,
          url: `/images/venues/${filename}`,
          alt: `${venue.name} wedding venue`,
          isPrimary: j === 0,
          source: 'manual-collection',
          addedAt: new Date().toISOString()
        };
        
        venueImages.push(venueImage);
        
        console.log(`  ✅ Added image: ${filename}`);
        
      } catch (error) {
        console.log(`  ❌ Failed to download image ${j + 1}: ${error.message}`);
      }
    }
    
    if (venueImages.length > 0) {
      const updatedVenue = {
        ...venue,
        images: venueImages,
        lastImageUpdate: new Date().toISOString()
      };
      
      updatedVenues.push(updatedVenue);
      processedCount++;
      
      console.log(`  🎉 Added ${venueImages.length} images to ${venueName}`);
    } else {
      updatedVenues.push(venue);
    }
    
    // Small delay between venues
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Add any venues that weren't in the CSV
  const processedNames = new Set(updatedVenues.map(v => v.name));
  venues.forEach(venue => {
    if (!processedNames.has(venue.name)) {
      updatedVenues.push(venue);
    }
  });
  
  // Save updated venues
  const updatedVenuesData = {
    weddingVenues: updatedVenues,
    lastUpdated: new Date().toISOString(),
    imageSource: 'manual-google-collection'
  };
  
  fs.writeFileSync(venuesPath, JSON.stringify(updatedVenuesData, null, 2));
  
  console.log(`\n🎉 Manual image processing complete!`);
  console.log(`📊 Results:`);
  console.log(`   Venues processed: ${processedCount}`);
  console.log(`   Total venues in database: ${updatedVenues.length}`);
  console.log(`📁 Images saved to: /public/images/venues/`);
}

// Helper functions
function generateSafeFilename(venueName, venueIndex, imageIndex) {
  const safeName = venueName
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, '')
    .replace(/\s+/g, '-')
    .replace(/&/g, 'and')
    .substring(0, 40);
  
  return `${safeName}-${venueIndex + 1}-${imageIndex + 1}.jpg`;
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const writeStream = fs.createWriteStream(filepath);
        response.pipe(writeStream);
        
        writeStream.on('finish', () => {
          writeStream.close();
          resolve(filepath);
        });
        
        writeStream.on('error', reject);
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Run if called directly
if (require.main === module) {
  processManualImageCollection().catch(error => {
    console.error('💥 Processing failed:', error);
    process.exit(1);
  });
}

module.exports = { processManualImageCollection };