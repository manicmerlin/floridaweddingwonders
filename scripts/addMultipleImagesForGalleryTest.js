const fs = require('fs');
const path = require('path');

// Load venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
console.log('Looking for venues file at:', venuesPath);

let venuesData;
try {
  const venuesFile = fs.readFileSync(venuesPath, 'utf8');
  venuesData = JSON.parse(venuesFile);
  const venues = venuesData.weddingVenues || venuesData; // Handle both structures
  console.log(`Loaded ${venues.length} venues from file`);
} catch (error) {
  console.error('Error loading venues:', error);
  process.exit(1);
}

// Our three real images that we want to use
const realImages = [
  {
    filename: "venue-9-ancient-spanish-monastery-1.jpg",
    alt: "Ancient Spanish Monastery wedding venue",
    url: "/images/venues/venue-9-ancient-spanish-monastery-1.jpg"
  },
  {
    filename: "venue-10-curtiss-mansion-1.jpg", 
    alt: "Curtiss Mansion wedding venue",
    url: "/images/venues/venue-10-curtiss-mansion-1.jpg"
  },
  {
    filename: "venue-1-hialeah-park-racing-casino-2.jpg",
    alt: "Hialeah Park Racing & Casino wedding venue",
    url: "/images/venues/venue-1-hialeah-park-racing-casino-2.jpg"
  }
];

const venues = venuesData.weddingVenues || venuesData; // Handle both structures

console.log(`Found ${venues.length} venues to process`);

// Add multiple images to first 10 venues for gallery testing
const venuesToUpdate = Math.min(10, venues.length);
for (let i = 0; i < venuesToUpdate; i++) {
  const venue = venues[i];
  
  // Clear existing images
  venue.images = [];
  
  // Add 3-6 images per venue for good gallery testing
  const numImages = 3 + Math.floor(Math.random() * 4); // 3-6 images
  
  for (let j = 0; j < numImages; j++) {
    const imageIndex = j % realImages.length; // Cycle through our real images
    const realImage = realImages[imageIndex];
    
    venue.images.push({
      id: `img-gallery-test-${venue.id}-${j + 1}`,
      url: realImage.url,
      alt: `${venue.name} wedding venue - Photo ${j + 1}`,
      isPrimary: j === 0, // First image is primary
      source: "gallery-test",
      filename: realImage.filename,
      addedAt: new Date().toISOString()
    });
  }
  
  console.log(`✅ Added ${venue.images.length} images to ${venue.name}`);
}

// Keep single images for remaining venues as they were
console.log(`\n📝 Updated ${venuesToUpdate} venues with multiple images for gallery testing`);
console.log(`📝 Remaining ${venues.length - venuesToUpdate} venues kept with single images`);

// Write updated venues back to file
const updatedData = venuesData.weddingVenues ? { weddingVenues: venues } : venues;
fs.writeFileSync(venuesPath, JSON.stringify(updatedData, null, 2));

console.log('\n🎉 Gallery test images added successfully!');
console.log('First 10 venues now have 3-6 images each for testing the gallery layout.');
