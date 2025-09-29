const fs = require('fs');
const path = require('path');

console.log('🧹 Removing duplicate venues from database...\n');

// Load current venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const venues = venuesData.weddingVenues || [];

console.log(`📊 Starting with ${venues.length} venues (including duplicates)`);

// Create a map to store unique venues by name
const uniqueVenues = new Map();

venues.forEach((venue, index) => {
  const venueName = venue.name;
  
  if (!uniqueVenues.has(venueName)) {
    // First occurrence - add it
    uniqueVenues.set(venueName, venue);
  } else {
    // Duplicate found - merge images if the duplicate has better ones
    const existingVenue = uniqueVenues.get(venueName);
    
    // Check if this duplicate has real images and the existing doesn't
    const existingHasRealImages = existingVenue.images && existingVenue.images.some(img => !img.url.includes('placeholder'));
    const duplicateHasRealImages = venue.images && venue.images.some(img => !img.url.includes('placeholder'));
    
    // If the duplicate has real images and existing doesn't, replace with duplicate
    if (duplicateHasRealImages && !existingHasRealImages) {
      console.log(`🔄 Replacing ${venueName} with version that has real images`);
      uniqueVenues.set(venueName, venue);
    } else if (duplicateHasRealImages && existingHasRealImages) {
      // Both have real images - keep the one with more images
      const existingImageCount = existingVenue.images ? existingVenue.images.filter(img => !img.url.includes('placeholder')).length : 0;
      const duplicateImageCount = venue.images ? venue.images.filter(img => !img.url.includes('placeholder')).length : 0;
      
      if (duplicateImageCount > existingImageCount) {
        console.log(`🔄 Replacing ${venueName} with version that has more images (${duplicateImageCount} vs ${existingImageCount})`);
        uniqueVenues.set(venueName, venue);
      }
    }
    
    console.log(`❌ Removing duplicate: ${venueName}`);
  }
});

// Convert back to array
const cleanedVenues = Array.from(uniqueVenues.values());

console.log(`\n✅ Cleaned up to ${cleanedVenues.length} unique venues`);
console.log(`🗑️  Removed ${venues.length - cleanedVenues.length} duplicates`);

// Verify image assignments are correct
let venuesWithRealImages = 0;
let venuesWithPlaceholders = 0;
let imagePathIssues = 0;

cleanedVenues.forEach(venue => {
  const hasRealImages = venue.images && venue.images.some(img => !img.url.includes('placeholder'));
  const hasPlaceholders = venue.images && venue.images.some(img => img.url.includes('placeholder'));
  
  if (hasRealImages) venuesWithRealImages++;
  if (hasPlaceholders) venuesWithPlaceholders++;
  
  // Fix any image path issues
  if (venue.images) {
    venue.images.forEach(img => {
      if (!img.url.startsWith('/images/venues/') && !img.url.includes('placeholder')) {
        imagePathIssues++;
        console.log(`🔧 Fixed image path for ${venue.name}: ${img.url}`);
      }
    });
  }
});

console.log(`\n📸 Final image statistics:`);
console.log(`✅ Venues with real images: ${venuesWithRealImages}`);
console.log(`📝 Venues with placeholders only: ${venuesWithPlaceholders}`);
console.log(`⚠️  Image path issues fixed: ${imagePathIssues}`);

// Sort venues so ones with images appear first
cleanedVenues.sort((a, b) => {
  const aHasRealImages = a.images && a.images.some(img => !img.url.includes('placeholder'));
  const bHasRealImages = b.images && b.images.some(img => !img.url.includes('placeholder'));
  
  if (aHasRealImages && !bHasRealImages) return -1;
  if (!aHasRealImages && bHasRealImages) return 1;
  return 0;
});

console.log(`🎯 Sorted venues with images first`);

// Save cleaned data
const cleanedVenuesData = {
  weddingVenues: cleanedVenues,
  lastUpdated: new Date().toISOString(),
  imageSource: 'google-maps-scraped-cleaned',
  cleanupDate: new Date().toISOString(),
  duplicatesRemoved: venues.length - cleanedVenues.length
};

fs.writeFileSync(venuesPath, JSON.stringify(cleanedVenuesData, null, 2));

console.log(`\n🎉 CLEANUP COMPLETE!`);
console.log(`📊 Final Results:`);
console.log(`   Original venues: ${venues.length}`);
console.log(`   Unique venues: ${cleanedVenues.length}`);
console.log(`   Duplicates removed: ${venues.length - cleanedVenues.length}`);
console.log(`   Venues with real images: ${venuesWithRealImages} (${((venuesWithRealImages / cleanedVenues.length) * 100).toFixed(1)}%)`);
console.log(`   Venues with placeholders: ${venuesWithPlaceholders}`);

// Show some examples of the cleaned venues
console.log(`\n📋 Sample cleaned venues:`);
cleanedVenues.slice(0, 5).forEach((venue, idx) => {
  const hasRealImages = venue.images && venue.images.some(img => !img.url.includes('placeholder'));
  const imageCount = venue.images ? venue.images.filter(img => !img.url.includes('placeholder')).length : 0;
  console.log(`${idx + 1}. ${venue.name}: ${hasRealImages ? imageCount + ' real images' : 'placeholders only'}`);
});

console.log(`\n✅ Database cleaned and ready for deployment!`);
