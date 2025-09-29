const fs = require('fs');
const path = require('path');

console.log('🧹 FINAL CLEANUP: Keep real images but limit to 1 per venue\n');

// Load current venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const venues = venuesData.weddingVenues || [];

console.log(`📊 Starting with ${venues.length} venues`);

// Create a map to store unique venues by name
const uniqueVenues = new Map();
let duplicatesRemoved = 0;

venues.forEach((venue, index) => {
  const venueName = venue.name;
  
  if (!uniqueVenues.has(venueName)) {
    // First occurrence - clean up images to only 1 but preserve real images
    const cleanedVenue = { ...venue };
    
    if (cleanedVenue.images && cleanedVenue.images.length > 1) {
      // Keep only the primary image, or first real image (not placeholder)
      let bestImage = cleanedVenue.images.find(img => img.isPrimary);
      
      if (!bestImage) {
        // If no primary, find first real image (not placeholder)
        bestImage = cleanedVenue.images.find(img => 
          img.url.includes('/images/venues/') && !img.url.includes('placeholder')
        );
      }
      
      if (!bestImage) {
        // If no real images, keep first image (might be placeholder)
        bestImage = cleanedVenue.images[0];
      }
      
      // Set as primary and keep only this one
      bestImage.isPrimary = true;
      cleanedVenue.images = [bestImage];
      
      const imageType = bestImage.url.includes('placeholder') ? 'placeholder' : 'real';
      console.log(`🔧 ${venueName}: Reduced from ${venue.images.length} to 1 ${imageType} image`);
    }
    
    uniqueVenues.set(venueName, cleanedVenue);
  } else {
    // Duplicate found - keep the better version
    const existingVenue = uniqueVenues.get(venueName);
    
    // Check if this duplicate has better images
    const existingHasRealImages = existingVenue.images && existingVenue.images.some(img => 
      img.url.includes('/images/venues/') && !img.url.includes('placeholder')
    );
    const duplicateHasRealImages = venue.images && venue.images.some(img => 
      img.url.includes('/images/venues/') && !img.url.includes('placeholder')
    );
    
    if (duplicateHasRealImages && !existingHasRealImages) {
      // Replace with the duplicate that has real images
      const cleanedVenue = { ...venue };
      const realImage = cleanedVenue.images.find(img => 
        img.url.includes('/images/venues/') && !img.url.includes('placeholder')
      );
      realImage.isPrimary = true;
      cleanedVenue.images = [realImage];
      
      uniqueVenues.set(venueName, cleanedVenue);
      console.log(`🔄 Replaced ${venueName} with version that has real image`);
    }
    
    console.log(`❌ Removing duplicate: ${venueName}`);
    duplicatesRemoved++;
  }
});

// Convert back to array
const cleanedVenues = Array.from(uniqueVenues.values());

console.log(`\n✅ Cleanup Results:`);
console.log(`   Original venues: ${venues.length}`);
console.log(`   Unique venues: ${cleanedVenues.length}`);
console.log(`   Duplicates removed: ${duplicatesRemoved}`);

// Count image statistics
let venuesWithRealImages = 0;
let venuesWithPlaceholders = 0;

cleanedVenues.forEach(venue => {
  if (venue.images && venue.images.length > 0) {
    const hasRealImage = venue.images[0].url.includes('/images/venues/') && 
                        !venue.images[0].url.includes('placeholder');
    if (hasRealImage) {
      venuesWithRealImages++;
    } else {
      venuesWithPlaceholders++;
    }
  }
});

console.log(`\n📸 Image Statistics:`);
console.log(`   Venues with real images: ${venuesWithRealImages} (${((venuesWithRealImages / cleanedVenues.length) * 100).toFixed(1)}%)`);
console.log(`   Venues with placeholders: ${venuesWithPlaceholders}`);
console.log(`   Images per venue: 1 (as requested)`);

// Sort venues so ones with real images appear first
cleanedVenues.sort((a, b) => {
  const aHasRealImage = a.images && a.images.length > 0 && 
                       a.images[0].url.includes('/images/venues/') && 
                       !a.images[0].url.includes('placeholder');
  const bHasRealImage = b.images && b.images.length > 0 && 
                       b.images[0].url.includes('/images/venues/') && 
                       !b.images[0].url.includes('placeholder');
  
  if (aHasRealImage && !bHasRealImage) return -1;
  if (!aHasRealImage && bHasRealImage) return 1;
  return 0;
});

// Save cleaned data
const cleanedVenuesData = {
  weddingVenues: cleanedVenues,
  lastUpdated: new Date().toISOString(),
  imageSource: 'google-maps-scraped-final-1-per-venue',
  cleanupDate: new Date().toISOString(),
  duplicatesRemoved: duplicatesRemoved,
  imagesPerVenue: 1,
  realImagesCount: venuesWithRealImages
};

fs.writeFileSync(venuesPath, JSON.stringify(cleanedVenuesData, null, 2));

console.log(`\n🎉 FINAL CLEANUP COMPLETE!`);
console.log(`✅ ${cleanedVenues.length} unique venues`);
console.log(`✅ 1 image per venue (as requested)`);
console.log(`✅ ${venuesWithRealImages} venues with real Google-scraped images`);
console.log(`✅ Venues with real images sorted first`);
console.log(`✅ Ready for deployment!`);

// Show some examples
console.log(`\n📋 Sample venues with real images:`);
const venuesWithImages = cleanedVenues.filter(v => 
  v.images && v.images[0].url.includes('/images/venues/') && 
  !v.images[0].url.includes('placeholder')
).slice(0, 5);

venuesWithImages.forEach((venue, idx) => {
  console.log(`${idx + 1}. ${venue.name}: ${venue.images[0].filename || venue.images[0].url.split('/').pop()}`);
});
