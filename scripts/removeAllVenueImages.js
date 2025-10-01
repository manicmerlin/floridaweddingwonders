const fs = require('fs');
const path = require('path');

// Read the venues.json file
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const data = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));

console.log(`📋 Found ${data.weddingVenues.length} venues in venues.json`);

// Count venues with images before
const venuesWithImagesBefore = data.weddingVenues.filter(v => v.images && v.images.length > 0).length;
console.log(`📸 Venues with images before: ${venuesWithImagesBefore}`);

// Remove all images from all venues
data.weddingVenues.forEach(venue => {
  if (venue.images) {
    delete venue.images;
  }
});

// Count venues with images after
const venuesWithImagesAfter = data.weddingVenues.filter(v => v.images && v.images.length > 0).length;
console.log(`🗑️  Venues with images after: ${venuesWithImagesAfter}`);

// Create backup first
const backupPath = path.join(__dirname, `../src/data/venues-backup-before-image-removal-${new Date().toISOString().replace(/:/g, '-')}.json`);
fs.writeFileSync(backupPath, fs.readFileSync(venuesPath, 'utf8'));
console.log(`💾 Backup created at: ${backupPath}`);

// Write the updated data back
fs.writeFileSync(venuesPath, JSON.stringify(data, null, 2));
console.log(`✅ Successfully removed all images from venues.json`);
console.log(`📝 ${data.weddingVenues.length} venues now have no placeholder images`);
console.log(`👰🤵 All venues will now show the bride & groom emoji until photos are uploaded`);
