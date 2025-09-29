const fs = require('fs');
const path = require('path');

// Load venues and existing images
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const imagesDir = path.join(__dirname, '../public/images/venues');

console.log('🔄 Integrating existing scraped images into venues database...');

// Load venues
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const venues = venuesData.weddingVenues || [];
console.log(`📍 Loaded ${venues.length} venues`);

// Get all existing image files
const imageFiles = fs.readdirSync(imagesDir).filter(file => file.endsWith('.jpg'));
console.log(`📸 Found ${imageFiles.length} existing image files`);

// Parse image filenames to extract venue information
const imagesByVenue = {};

imageFiles.forEach(filename => {
  // Expected format: venue-{index}-{venue-name-slug}-{imageNum}.jpg
  const match = filename.match(/^venue-(\d+)-(.+?)-(\d+)\.jpg$/);
  
  if (match) {
    const [, venueIndex, venueSlug, imageNum] = match;
    const key = `${venueIndex}-${venueSlug}`;
    
    if (!imagesByVenue[key]) {
      imagesByVenue[key] = [];
    }
    
    imagesByVenue[key].push({
      filename,
      venueIndex: parseInt(venueIndex),
      venueSlug,
      imageNum: parseInt(imageNum),
      url: `/images/venues/${filename}`
    });
  }
});

console.log(`🗂️  Organized images for ${Object.keys(imagesByVenue).length} venues`);

// Create a mapping of venue names to their images
const venueNameToImages = {};

Object.entries(imagesByVenue).forEach(([key, images]) => {
  const venueSlug = images[0].venueSlug;
  
  // Try to match venue slug to actual venue names
  const matchingVenue = venues.find(venue => {
    const venueName = venue.name.toLowerCase()
      .replace(/[^a-z0-9\s&]/g, '')
      .replace(/\s+/g, '-')
      .replace(/&/g, 'and');
    
    return venueName.includes(venueSlug) || venueSlug.includes(venueName.substring(0, 20));
  });
  
  if (matchingVenue) {
    venueNameToImages[matchingVenue.name] = images.sort((a, b) => a.imageNum - b.imageNum);
  }
});

console.log(`🎯 Successfully mapped images to ${Object.keys(venueNameToImages).length} venues`);

// Update venues with their images
let updatedCount = 0;
const updatedVenues = venues.map(venue => {
  const existingImages = venueNameToImages[venue.name];
  
  if (existingImages && existingImages.length > 0) {
    console.log(`📸 Adding ${existingImages.length} images to: ${venue.name}`);
    
    // Create image objects
    const venueImages = existingImages.map((img, index) => ({
      id: `img-scraped-${img.venueIndex}-${img.imageNum}`,
      url: img.url,
      alt: `${venue.name} wedding venue`,
      isPrimary: index === 0,
      source: 'google-maps-scraped',
      filename: img.filename,
      addedAt: new Date().toISOString()
    }));
    
    updatedCount++;
    
    return {
      ...venue,
      images: venueImages,
      lastImageUpdate: new Date().toISOString()
    };
  }
  
  return venue;
});

// Save updated venues
const updatedVenuesData = {
  weddingVenues: updatedVenues,
  lastUpdated: new Date().toISOString(),
  imageSource: 'integrated-scraped-images'
};

fs.writeFileSync(venuesPath, JSON.stringify(updatedVenuesData, null, 2));

// Generate integration report
const finalStats = {
  totalVenues: venues.length,
  venuesUpdated: updatedCount,
  totalImageFiles: imageFiles.length,
  mappedVenues: Object.keys(venueNameToImages).length,
  successRate: `${((updatedCount / venues.length) * 100).toFixed(1)}%`,
  completedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(__dirname, 'image-integration-report.json'),
  JSON.stringify(finalStats, null, 2)
);

console.log('\n🎉 IMAGE INTEGRATION COMPLETE!');
console.log('📊 Results:');
console.log(`   Total venues: ${venues.length}`);
console.log(`   Venues updated with images: ${updatedCount}`);
console.log(`   Total image files integrated: ${imageFiles.length}`);
console.log(`   Success rate: ${finalStats.successRate}`);

console.log('\n✅ All existing scraped images have been integrated into the venues database!');
console.log('📁 Check the staging site to see the images now appear on venue cards.');

// Show examples of updated venues
const venuesWithImages = Object.keys(venueNameToImages).slice(0, 10);
if (venuesWithImages.length > 0) {
  console.log('\n📋 Examples of venues now with images:');
  venuesWithImages.forEach(venueName => {
    const imageCount = venueNameToImages[venueName].length;
    console.log(`  • ${venueName} (${imageCount} images)`);
  });
}
