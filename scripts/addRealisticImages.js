const fs = require('fs');
const path = require('path');
const https = require('https');

// Load venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
let venues = [];

try {
  const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
  venues = venuesData.weddingVenues || [];
  console.log(`📍 Loaded ${venues.length} venues from database`);
} catch (error) {
  console.error('❌ Could not load venues.json:', error.message);
  process.exit(1);
}

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, '../public/images/venues');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// High-quality real venue images from various sources
const realVenueImages = [
  // Luxury ballrooms and hotels
  'https://images.unsplash.com/photo-1519167758481-83f29c8ba875?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=800&fit=crop&q=80',
  
  // Beach and waterfront venues
  'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&h=800&fit=crop&q=80',
  
  // Garden and outdoor venues
  'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop&q=80',
  
  // Historic venues
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&h=800&fit=crop&q=80',
  
  // Modern and rooftop venues
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&h=800&fit=crop&q=80',
  
  // Rustic and barn venues
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542332213-31f87348057f?w=1200&h=800&fit=crop&q=80',
  
  // Reception and ceremony spaces
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1520637836862-4d197d17c2a4?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546883845-800e490290ea?w=1200&h=800&fit=crop&q=80',
  
  // Additional elegant venues
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1483424817076-9a31dd839849?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=1200&h=800&fit=crop&q=80',
];

// Download image function
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
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
        // Handle redirects
        const redirectUrl = response.headers.location;
        downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Generate safe filename from venue name
function generateSafeFilename(venueName, venueIndex) {
  const safeName = venueName
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, '')
    .replace(/\s+/g, '-')
    .replace(/&/g, 'and')
    .substring(0, 50);
  
  return `${safeName}-${venueIndex + 1}.jpg`;
}

// Assign images to venues based on their type and characteristics
function assignImageToVenue(venue, venueIndex) {
  const venueType = venue.venueType || venue.style || '';
  const tags = venue.tags || [];
  const name = venue.name.toLowerCase();
  const location = venue.location?.toLowerCase() || '';
  
  // Smart image assignment based on venue characteristics
  let imageIndex;
  
  if (name.includes('beach') || name.includes('ocean') || location.includes('beach')) {
    imageIndex = 3 + (venueIndex % 3); // Beach images (3-5)
  } else if (name.includes('garden') || tags.includes('garden') || venueType.includes('garden')) {
    imageIndex = 6 + (venueIndex % 3); // Garden images (6-8)
  } else if (name.includes('historic') || tags.includes('historic') || venueType.includes('historic')) {
    imageIndex = 9 + (venueIndex % 3); // Historic images (9-11)
  } else if (name.includes('rooftop') || name.includes('modern') || tags.includes('modern')) {
    imageIndex = 12 + (venueIndex % 3); // Modern images (12-14)
  } else if (name.includes('barn') || name.includes('rustic') || tags.includes('rustic')) {
    imageIndex = 15 + (venueIndex % 3); // Rustic images (15-17)
  } else if (name.includes('ballroom') || name.includes('hotel') || tags.includes('ballroom')) {
    imageIndex = venueIndex % 3; // Luxury ballroom images (0-2)
  } else {
    // Default to reception/ceremony spaces
    imageIndex = 18 + (venueIndex % 4); // Reception images (18-21)
  }
  
  return imageIndex % realVenueImages.length;
}

// Add realistic venue images
async function addRealisticVenueImages() {
  console.log('🚀 Adding realistic venue images...');
  console.log('📸 Using high-quality wedding venue photos from Unsplash');
  
  const updatedVenues = [];
  let successCount = 0;
  
  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i];
    console.log(`\n📸 Processing venue ${i + 1}/${venues.length}: ${venue.name}`);
    
    try {
      // Get the appropriate image for this venue
      const imageIndex = assignImageToVenue(venue, i);
      const imageUrl = realVenueImages[imageIndex];
      
      const filename = generateSafeFilename(venue.name, i);
      const filepath = path.join(imagesDir, filename);
      
      console.log(`  ⬇️  Downloading image (style: ${venue.venueType || 'mixed'})...`);
      await downloadImage(imageUrl, filepath);
      
      // Create image object
      const venueImage = {
        id: `img-${i + 1}`,
        url: `/images/venues/${filename}`,
        alt: `${venue.name} wedding venue`,
        isPrimary: true,
        source: 'curated-unsplash'
      };
      
      // Update venue with image
      const updatedVenue = {
        ...venue,
        images: [venueImage, ...(venue.images || [])],
        lastImageUpdate: new Date().toISOString()
      };
      
      updatedVenues.push(updatedVenue);
      successCount++;
      
      console.log(`  ✅ Added image: ${filename}`);
      
      // Small delay to be respectful to the image server
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`  ❌ Failed to process ${venue.name}: ${error.message}`);
      updatedVenues.push(venue);
    }
    
    // Save progress every 20 venues
    if ((i + 1) % 20 === 0) {
      console.log(`\n💾 Saving progress... (${i + 1}/${venues.length} processed)`);
    }
  }
  
  // Save updated venues data
  const updatedVenuesData = {
    weddingVenues: updatedVenues,
    lastUpdated: new Date().toISOString(),
    imageSource: 'curated-realistic'
  };
  
  fs.writeFileSync(venuesPath, JSON.stringify(updatedVenuesData, null, 2));
  
  // Generate report
  const report = {
    totalVenues: venues.length,
    successful: successCount,
    failed: venues.length - successCount,
    successRate: `${((successCount / venues.length) * 100).toFixed(1)}%`,
    completedAt: new Date().toISOString(),
    imageTypes: {
      ballroom: updatedVenues.filter(v => v.venueType?.includes('ballroom')).length,
      beach: updatedVenues.filter(v => v.name.toLowerCase().includes('beach')).length,
      garden: updatedVenues.filter(v => v.tags?.includes('garden')).length,
      historic: updatedVenues.filter(v => v.tags?.includes('historic')).length,
      modern: updatedVenues.filter(v => v.tags?.includes('modern')).length,
      rustic: updatedVenues.filter(v => v.tags?.includes('rustic')).length
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'realistic-images-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n🎉 Realistic image assignment complete!`);
  console.log(`📊 Results:`);
  console.log(`   Total venues: ${venues.length}`);
  console.log(`   Successfully processed: ${successCount}`);
  console.log(`   Success rate: ${report.successRate}`);
  console.log(`📁 Images saved to: /public/images/venues/`);
  console.log(`📄 Report saved to: realistic-images-report.json`);
}

// Run the image assignment
if (require.main === module) {
  addRealisticVenueImages().catch(error => {
    console.error('💥 Image assignment failed:', error);
    process.exit(1);
  });
}

module.exports = { addRealisticVenueImages };
