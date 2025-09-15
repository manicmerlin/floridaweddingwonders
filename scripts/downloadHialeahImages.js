const fs = require('fs');
const path = require('path');
const https = require('https');

// Hialeah Park Racing & Casino representative images
const hialeahImages = [
  {
    url: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1200&h=800&fit=crop&q=80',
    filename: 'venue-41-hialeah-park-racing-casino-1.jpg',
    description: 'Historic racetrack main venue'
  },
  {
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&h=800&fit=crop&q=80',
    filename: 'venue-41-hialeah-park-racing-casino-3.jpg',
    description: 'Garden and lagoon area'
  },
  {
    url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop&q=80',
    filename: 'venue-41-hialeah-park-racing-casino-4.jpg',
    description: 'Mediterranean architecture'
  }
];

// Download function
function downloadImage(imageUrl, filename, description) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(__dirname, '../public/images/venues', filename);
    
    // Check if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`✅ ${filename} already exists`);
      resolve();
      return;
    }

    console.log(`📥 Downloading ${description}: ${filename}`);
    
    const file = fs.createWriteStream(filepath);
    
    https.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${imageUrl}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${filename}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Download all Hialeah Park images
async function downloadHialeahImages() {
  console.log('🏛️ Downloading Hialeah Park Racing & Casino images...\n');
  
  try {
    for (const image of hialeahImages) {
      await downloadImage(image.url, image.filename, image.description);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎉 All Hialeah Park images downloaded successfully!');
    console.log('📊 Hialeah Park Racing & Casino now has 4 images total');
    
  } catch (error) {
    console.error('❌ Error downloading images:', error.message);
  }
}

// Run the download
downloadHialeahImages();
