const fs = require('fs');
const path = require('path');

// Load venues data
const venuesData = JSON.parse(fs.readFileSync('./src/data/venues.json', 'utf8'));
const venues = venuesData.weddingVenues;

console.log('🔍 Verifying image availability for all venues...\n');

let totalImages = 0;
let missingImages = 0;
let availableImages = 0;

venues.forEach((venue, index) => {
  const venueId = index + 1;
  const images = venue.images || [];
  
  if (images.length === 0) {
    console.log(`❌ ${venue.name}: No images configured`);
    return;
  }
  
  console.log(`📍 ${venue.name}:`);
  
  images.forEach(image => {
    totalImages++;
    
    if (image.url.startsWith('/images/venues/')) {
      const imagePath = path.join('./public', image.url);
      
      if (fs.existsSync(imagePath)) {
        console.log(`  ✅ ${image.url}`);
        availableImages++;
      } else {
        console.log(`  ❌ Missing: ${image.url}`);
        missingImages++;
      }
    } else {
      console.log(`  🌐 External: ${image.url}`);
      availableImages++; // Count external URLs as available
    }
  });
  
  console.log('');
});

console.log('\n📊 Summary:');
console.log(`📸 Total images configured: ${totalImages}`);
console.log(`✅ Available images: ${availableImages}`);
console.log(`❌ Missing images: ${missingImages}`);
console.log(`📈 Success rate: ${((availableImages / totalImages) * 100).toFixed(1)}%`);

// List all available image files
const imagesDir = './public/images/venues';
if (fs.existsSync(imagesDir)) {
  const imageFiles = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg'));
  console.log(`\n📁 Total image files on disk: ${imageFiles.length}`);
  
  // Find unused images
  const usedImages = venues.flatMap(v => v.images || [])
    .filter(img => img.url.startsWith('/images/venues/'))
    .map(img => img.url.replace('/images/venues/', ''));
  
  const unusedImages = imageFiles.filter(file => !usedImages.includes(file));
  
  if (unusedImages.length > 0) {
    console.log(`🗂️  Unused images: ${unusedImages.length}`);
    console.log(unusedImages.slice(0, 5).map(f => `  - ${f}`).join('\n'));
    if (unusedImages.length > 5) console.log(`  ... and ${unusedImages.length - 5} more`);
  }
}
