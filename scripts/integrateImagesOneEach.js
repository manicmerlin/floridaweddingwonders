const fs = require('fs');
const path = require('path');

console.log('🔗 Integrating scraped images with venues (1 per venue)\n');

// Load current venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const venues = venuesData.weddingVenues || [];

console.log(`📊 Starting with ${venues.length} venues`);

// Get all venue images from the directory
const imagesDir = path.join(__dirname, '../public/images/venues');
const imageFiles = fs.readdirSync(imagesDir)
  .filter(file => file.match(/venue-\d+-.+\.(jpg|jpeg|png)$/i))
  .sort();

console.log(`📸 Found ${imageFiles.length} scraped venue images`);

// Create a map of venue images organized by venue number
const venueImageMap = new Map();

imageFiles.forEach(filename => {
  const match = filename.match(/venue-(\d+)-(.+)\.(jpg|jpeg|png)$/i);
  if (match) {
    const venueNum = parseInt(match[1]);
    const venueName = match[2].replace(/-/g, ' ').toLowerCase();
    
    if (!venueImageMap.has(venueNum)) {
      venueImageMap.set(venueNum, []);
    }
    venueImageMap.get(venueNum).push({
      filename,
      venueName,
      fullPath: `/images/venues/${filename}`
    });
  }
});

console.log(`🗂️  Organized images from ${venueImageMap.size} venue numbers`);

// Function to normalize venue names for matching
function normalizeVenueName(name) {
  return name.toLowerCase()
    .replace(/['"&]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .trim();
}

// Match images to venues
let venuesUpdated = 0;
let imagesAssigned = 0;

venues.forEach((venue, venueIndex) => {
  const normalizedVenueName = normalizeVenueName(venue.name);
  let bestMatch = null;
  let bestScore = 0;
  
  // Check each venue number's images
  for (const [venueNum, images] of venueImageMap.entries()) {
    for (const image of images) {
      const normalizedImageName = normalizeVenueName(image.venueName);
      
      // Calculate similarity score
      const venueWords = normalizedVenueName.split(' ');
      const imageWords = normalizedImageName.split(' ');
      
      let matchingWords = 0;
      venueWords.forEach(word => {
        if (word.length > 2 && imageWords.some(imgWord => 
          imgWord.includes(word) || word.includes(imgWord)
        )) {
          matchingWords++;
        }
      });
      
      const score = matchingWords / Math.max(venueWords.length, imageWords.length);
      
      if (score > bestScore && score > 0.3) { // Minimum 30% match
        bestScore = score;
        bestMatch = image;
      }
    }
  }
  
  // If we found a good match, assign ONE image
  if (bestMatch && bestScore > 0.3) {
    venue.images = [{
      id: `img-scraped-${Date.now()}-${venueIndex}`,
      url: bestMatch.fullPath,
      alt: `${venue.name} wedding venue`,
      isPrimary: true,
      source: 'google-maps-scraped',
      filename: bestMatch.filename,
      addedAt: new Date().toISOString()
    }];
    
    venue.lastImageUpdate = new Date().toISOString();
    venuesUpdated++;
    imagesAssigned++;
    
    console.log(`✅ ${venue.name}: ${bestMatch.filename} (${(bestScore * 100).toFixed(0)}% match)`);
  } else {
    // Keep placeholder if no match found
    venue.images = [{
      id: `img-placeholder-${venueIndex}`,
      url: '/images/venue-placeholder.svg',
      alt: `${venue.name} wedding venue`,
      isPrimary: true,
      source: 'placeholder'
    }];
  }
});

// Save updated venues
const updatedVenuesData = {
  weddingVenues: venues,
  lastUpdated: new Date().toISOString(),
  imageSource: 'google-maps-scraped-1-per-venue',
  imageIntegrationDate: new Date().toISOString(),
  venuesWithImages: venuesUpdated,
  totalImages: imagesAssigned
};

fs.writeFileSync(venuesPath, JSON.stringify(updatedVenuesData, null, 2));

console.log(`\n🎉 IMAGE INTEGRATION COMPLETE!`);
console.log(`✅ ${venuesUpdated} venues updated with real images`);
console.log(`✅ ${venues.length - venuesUpdated} venues using placeholders`);
console.log(`✅ 1 image per venue (as requested)`);
console.log(`✅ ${((venuesUpdated / venues.length) * 100).toFixed(1)}% venue coverage with real images`);
console.log(`✅ Ready for deployment!`);
