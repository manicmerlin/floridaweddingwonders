const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

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

// High-quality wedding venue images from Unsplash
const weddingVenueImages = [
  'https://images.unsplash.com/photo-1519167758481-83f29c8ba875?w=1200&h=800&fit=crop&q=80', // Elegant ballroom
  'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1200&h=800&fit=crop&q=80', // Reception setup
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop&q=80', // Grand venue
  'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=1200&h=800&fit=crop&q=80', // Garden ceremony
  'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1200&h=800&fit=crop&q=80', // Beach wedding
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&h=800&fit=crop&q=80', // Luxury ballroom
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&h=800&fit=crop&q=80', // Reception hall
  'https://images.unsplash.com/photo-1520637836862-4d197d17c2a4?w=1200&h=800&fit=crop&q=80', // Outdoor venue
  'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&h=800&fit=crop&q=80', // Modern venue
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop&q=80', // Historic venue
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop&q=80', // Rustic barn
  'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1200&h=800&fit=crop&q=80', // Garden party
  'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&h=800&fit=crop&q=80', // Waterfront venue
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop&q=80', // Rooftop venue
  'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=1200&h=800&fit=crop&q=80', // City venue
  'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1200&h=800&fit=crop&q=80', // Elegant setup
];

// Additional interior and detail shots
const interiorImages = [
  'https://images.unsplash.com/photo-1546883845-800e490290ea?w=1200&h=800&fit=crop&q=80', // Dining setup
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop&q=80', // Reception details
  'https://images.unsplash.com/photo-1483424817076-9a31dd839849?w=1200&h=800&fit=crop&q=80', // Dance floor
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&h=800&fit=crop&q=80', // Bar area
  'https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=1200&h=800&fit=crop&q=80', // Lounge area
  'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=1200&h=800&fit=crop&q=80', // Bridal suite
  'https://images.unsplash.com/photo-1542332213-31f87348057f?w=1200&h=800&fit=crop&q=80', // Ceremony space
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1200&h=800&fit=crop&q=80', // Outdoor patio
];

// Download image function
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const writeStream = fs.createWriteStream(filepath);
        response.pipe(writeStream);
        
        writeStream.on('finish', () => {
          writeStream.close();
          resolve(filepath);
        });
        
        writeStream.on('error', reject);
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Generate safe filename from venue name
function generateSafeFilename(venueName, index, imageIndex) {
  const safeName = venueName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  return `venue-${index + 1}-${safeName}-${imageIndex + 1}.jpg`;
}

// Scrape images for all venues
async function scrapeAllVenueImages() {
  console.log('🚀 Starting venue image scraping...');
  
  const updatedVenues = [];
  const totalImages = weddingVenueImages.concat(interiorImages);
  
  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i];
    console.log(`\n📸 Processing venue ${i + 1}/${venues.length}: ${venue.name}`);
    
    const venueImages = [];
    const imageCount = 3 + (i % 2); // 3-4 images per venue
    
    for (let j = 0; j < imageCount; j++) {
      try {
        const imageUrl = totalImages[(i * 4 + j) % totalImages.length];
        const filename = generateSafeFilename(venue.name, i, j);
        const filepath = path.join(imagesDir, filename);
        
        console.log(`  ⬇️  Downloading image ${j + 1}/${imageCount}...`);
        await downloadImage(imageUrl, filepath);
        
        venueImages.push({
          id: `img${i + 1}-${j + 1}`,
          url: `/images/venues/${filename}`,
          alt: j === 0 
            ? `${venue.name} main venue photo`
            : j === 1 
            ? `${venue.name} ceremony setup`
            : j === 2
            ? `${venue.name} reception area`
            : `${venue.name} additional view`,
          isPrimary: j === 0,
        });
        
        console.log(`  ✅ Saved: ${filename}`);
        
        // Small delay to be respectful to the image server
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`  ❌ Failed to download image ${j + 1}:`, error.message);
      }
    }
    
    // Add images to venue data
    const updatedVenue = {
      ...venue,
      images: venueImages,
      lastImageUpdate: new Date().toISOString()
    };
    
    updatedVenues.push(updatedVenue);
    console.log(`  ✅ Completed venue: ${venue.name} (${venueImages.length} images)`);
  }
  
  // Save updated venues data with local image paths
  const updatedVenuesData = {
    weddingVenues: updatedVenues,
    lastUpdated: new Date().toISOString(),
    imageSource: 'local'
  };
  
  fs.writeFileSync(venuesPath, JSON.stringify(updatedVenuesData, null, 2));
  console.log('\n✅ Updated venues.json with local image paths');
  
  // Generate image manifest
  const imageManifest = {
    totalVenues: venues.length,
    totalImages: updatedVenues.reduce((sum, venue) => sum + venue.images.length, 0),
    generatedAt: new Date().toISOString(),
    venues: updatedVenues.map(venue => ({
      id: venue.name,
      name: venue.name,
      imageCount: venue.images.length,
      images: venue.images.map(img => img.url)
    }))
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../public/images/venues/manifest.json'), 
    JSON.stringify(imageManifest, null, 2)
  );
  
  console.log(`\n🎉 Scraping complete!`);
  console.log(`📊 Total venues processed: ${venues.length}`);
  console.log(`📸 Total images downloaded: ${imageManifest.totalImages}`);
  console.log(`📁 Images stored in: /public/images/venues/`);
}

// Run the scraper
if (require.main === module) {
  scrapeAllVenueImages().catch(error => {
    console.error('💥 Scraping failed:', error);
    process.exit(1);
  });
}

module.exports = { scrapeAllVenueImages };
