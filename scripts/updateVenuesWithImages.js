const fs = require('fs');
const path = require('path');

// Load original venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));

// Get list of downloaded images
const imagesDir = path.join(__dirname, '../public/images/venues');
const imageFiles = fs.readdirSync(imagesDir).filter(file => file.endsWith('.jpg'));

console.log(`📁 Found ${imageFiles.length} downloaded images`);

// Update venues with local image paths
const updatedVenues = venuesData.weddingVenues.map((venue, index) => {
  const venueId = index + 1;
  
  // Find images for this venue
  const venueImages = imageFiles.filter(filename => 
    filename.startsWith(`venue-${venueId}-`)
  ).sort().map((filename, imageIndex) => ({
    id: `img${venueId}-${imageIndex + 1}`,
    url: `/images/venues/${filename}`,
    alt: imageIndex === 0 
      ? `${venue.name} main venue photo`
      : imageIndex === 1 
      ? `${venue.name} ceremony setup`
      : imageIndex === 2
      ? `${venue.name} reception area`
      : `${venue.name} additional view`,
    isPrimary: imageIndex === 0,
  }));
  
  console.log(`✨ ${venue.name}: ${venueImages.length} local images`);
  
  return {
    ...venue,
    images: venueImages,
    lastImageUpdate: new Date().toISOString()
  };
});

// Save updated venues data
const updatedVenuesData = {
  weddingVenues: updatedVenues,
  lastUpdated: new Date().toISOString(),
  imageSource: 'local',
  totalVenues: updatedVenues.length,
  totalImages: updatedVenues.reduce((sum, venue) => sum + (venue.images?.length || 0), 0)
};

fs.writeFileSync(venuesPath, JSON.stringify(updatedVenuesData, null, 2));

console.log('\n🎉 Updated venues.json with local image paths');
console.log(`📊 Total venues: ${updatedVenuesData.totalVenues}`);
console.log(`📸 Total images: ${updatedVenuesData.totalImages}`);

// Generate summary report
const summary = updatedVenues.map(venue => ({
  name: venue.name,
  imageCount: venue.images?.length || 0,
  hasImages: (venue.images?.length || 0) > 0
}));

const venuesWithImages = summary.filter(v => v.hasImages).length;
console.log(`✅ Venues with local images: ${venuesWithImages}/${updatedVenues.length}`);

// Save image manifest
const imageManifest = {
  totalVenues: updatedVenues.length,
  venuesWithImages,
  totalImages: updatedVenuesData.totalImages,
  generatedAt: new Date().toISOString(),
  venues: summary
};

fs.writeFileSync(
  path.join(__dirname, '../public/images/venues/manifest.json'), 
  JSON.stringify(imageManifest, null, 2)
);

console.log('📋 Created image manifest: /public/images/venues/manifest.json');
