const fs = require('fs');
const path = require('path');
const https = require('https');

// Google image URL for Ancient Spanish Monastery
const imageUrl = 'https://lh3.googleusercontent.com/gps-cs-s/AC9h4noXD_9xS2pSsV7uvVz34CsctqhsM22kWUDmSIYdy98IotH2_oOWfv_STTl1IG3ag0E1niM3TcYk7jq56FQ4g6DBMXX8l9g2lHx4Rvx6I7GGBUq4AV-qIe9OP7DXFxDjFvUvvzvE=s1360-w1360-h1020-rw';

// Ancient Spanish Monastery is venue #8 in our system
const venueId = 8;
const filename = 'venue-8-ancient-spanish-monastery-google.jpg';

// Download image function
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    console.log(`🔗 Downloading: ${url}`);
    console.log(`💾 Saving to: ${filepath}`);
    
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log(`🔄 Redirecting to: ${response.headers.location}`);
        return downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode === 200) {
        const writeStream = fs.createWriteStream(filepath);
        response.pipe(writeStream);
        
        writeStream.on('finish', () => {
          writeStream.close();
          console.log(`✅ Successfully downloaded: ${filename}`);
          resolve(filepath);
        });
        
        writeStream.on('error', (err) => {
          console.error(`❌ Write error: ${err.message}`);
          reject(err);
        });
        
        response.on('error', (err) => {
          console.error(`❌ Response error: ${err.message}`);
          reject(err);
        });
      } else {
        reject(new Error(`Failed to download image: HTTP ${response.statusCode}`));
      }
    });
    
    request.on('error', (err) => {
      console.error(`❌ Request error: ${err.message}`);
      reject(err);
    });
    
    // Set timeout
    request.setTimeout(30000, () => {
      console.error('❌ Request timeout');
      reject(new Error('Request timeout'));
    });
  });
}

// Main function
async function downloadMonasteryImage() {
  try {
    console.log('🏛️ Downloading Ancient Spanish Monastery image from Google...\n');
    
    // Ensure images directory exists
    const imagesDir = path.join(__dirname, '../public/images/venues');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
      console.log('📁 Created images directory');
    }
    
    const filepath = path.join(imagesDir, filename);
    
    // Check if image already exists
    if (fs.existsSync(filepath)) {
      console.log(`⚠️  Image already exists: ${filename}`);
      console.log('🔄 Removing existing file to download fresh copy...');
      fs.unlinkSync(filepath);
    }
    
    // Download the image
    await downloadImage(imageUrl, filepath);
    
    // Verify the download
    const stats = fs.statSync(filepath);
    console.log(`\n📊 Image details:`);
    console.log(`   Size: ${Math.round(stats.size / 1024)} KB`);
    console.log(`   Created: ${stats.birthtime.toISOString()}`);
    
    // Update venues.json to include this new image
    await updateVenueWithNewImage();
    
    console.log('\n🎉 Successfully added Google image for Ancient Spanish Monastery!');
    
  } catch (error) {
    console.error(`💥 Failed to download image: ${error.message}`);
    process.exit(1);
  }
}

// Update venues.json with the new image
async function updateVenueWithNewImage() {
  try {
    const venuesPath = path.join(__dirname, '../src/data/venues.json');
    const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
    
    // Find the Ancient Spanish Monastery venue (index 7, venue ID 8)
    const venueIndex = venuesData.weddingVenues.findIndex(v => 
      v.name === 'Ancient Spanish Monastery'
    );
    
    if (venueIndex === -1) {
      throw new Error('Could not find Ancient Spanish Monastery in venues data');
    }
    
    const venue = venuesData.weddingVenues[venueIndex];
    
    // Add the new Google image to the existing images array
    const newImage = {
      id: `img${venueIndex + 1}-google`,
      url: `/images/venues/${filename}`,
      alt: 'Ancient Spanish Monastery - Historic wedding venue with Gothic architecture',
      isPrimary: false,
      source: 'google'
    };
    
    if (!venue.images) {
      venue.images = [];
    }
    
    // Add the new image (check if it already exists first)
    const existingImageIndex = venue.images.findIndex(img => img.source === 'google');
    if (existingImageIndex !== -1) {
      venue.images[existingImageIndex] = newImage;
      console.log('🔄 Updated existing Google image');
    } else {
      venue.images.push(newImage);
      console.log('➕ Added new Google image to venue');
    }
    
    venue.lastImageUpdate = new Date().toISOString();
    
    // Save updated venues data
    fs.writeFileSync(venuesPath, JSON.stringify(venuesData, null, 2));
    console.log('💾 Updated venues.json with new Google image');
    
    console.log(`\n📸 Ancient Spanish Monastery now has ${venue.images.length} images:`);
    venue.images.forEach((img, idx) => {
      console.log(`   ${idx + 1}. ${img.url} ${img.isPrimary ? '(PRIMARY)' : ''}`);
    });
    
  } catch (error) {
    console.error(`❌ Failed to update venues.json: ${error.message}`);
    throw error;
  }
}

// Run the download
if (require.main === module) {
  downloadMonasteryImage();
}

module.exports = { downloadMonasteryImage };
