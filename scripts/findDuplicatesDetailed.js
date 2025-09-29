const fs = require('fs');
const path = require('path');

console.log('🔍 Detailed duplicate analysis...\n');

// Load current venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const venues = venuesData.weddingVenues || [];

console.log(`📊 Total venues in file: ${venues.length}`);

// Create a map to count occurrences by name
const venueNameCounts = new Map();
const duplicateGroups = new Map();

venues.forEach((venue, index) => {
  const venueName = venue.name;
  
  if (!venueNameCounts.has(venueName)) {
    venueNameCounts.set(venueName, { count: 1, indices: [index] });
  } else {
    const current = venueNameCounts.get(venueName);
    current.count++;
    current.indices.push(index);
    venueNameCounts.set(venueName, current);
    
    // Track this as a duplicate group
    if (!duplicateGroups.has(venueName)) {
      duplicateGroups.set(venueName, current);
    }
  }
});

console.log(`\n🔍 Duplicate Analysis:`);
console.log(`   Unique venue names: ${venueNameCounts.size}`);
console.log(`   Total venue entries: ${venues.length}`);
console.log(`   Duplicate venue names: ${duplicateGroups.size}`);

if (duplicateGroups.size > 0) {
  console.log(`\n❌ DUPLICATES FOUND:`);
  
  let totalDuplicateEntries = 0;
  for (const [venueName, data] of duplicateGroups) {
    console.log(`\n🔄 "${venueName}": ${data.count} entries`);
    console.log(`   Indices: ${data.indices.join(', ')}`);
    
    // Show details of each duplicate
    data.indices.forEach((index, i) => {
      const venue = venues[index];
      const hasRealImages = venue.images && venue.images.some(img => !img.url.includes('placeholder'));
      const imageCount = venue.images ? venue.images.filter(img => !img.url.includes('placeholder')).length : 0;
      
      console.log(`   ${i + 1}. Index ${index}: ${hasRealImages ? imageCount + ' real images' : 'placeholders only'}`);
      
      if (venue.images && venue.images.length > 0) {
        console.log(`      First image: ${venue.images[0].url}`);
      }
    });
    
    totalDuplicateEntries += data.count - 1; // -1 because we want to keep one
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Entries that should be removed: ${totalDuplicateEntries}`);
  console.log(`   Final unique venues after cleanup: ${venues.length - totalDuplicateEntries}`);
  
} else {
  console.log(`\n✅ NO DUPLICATES FOUND`);
  console.log(`   All ${venues.length} venues have unique names`);
}

// Also check for venues that have the scraped images we found
console.log(`\n📸 Checking Ancient Spanish Monastery specifically:`);
const ancientSpanish = venues.filter(v => v.name.includes('Ancient Spanish') || v.name.includes('Spanish Monastery'));
ancientSpanish.forEach((venue, idx) => {
  console.log(`${idx + 1}. "${venue.name}"`);
  console.log(`   Location: ${venue.location}`);
  console.log(`   Images: ${venue.images ? venue.images.length : 0}`);
  if (venue.images && venue.images.length > 0) {
    venue.images.forEach((img, i) => {
      console.log(`     ${i + 1}. ${img.url}`);
    });
  }
  console.log('');
});

console.log(`\n🖼️  Checking for unlinked Ancient Spanish Monastery images:`);
const imageDir = path.join(__dirname, '../public/images/venues');
try {
  const imageFiles = fs.readdirSync(imageDir);
  const ancientSpanishImages = imageFiles.filter(file => 
    file.toLowerCase().includes('ancient') || 
    file.toLowerCase().includes('spanish') || 
    file.toLowerCase().includes('monastery')
  );
  
  console.log(`Found ${ancientSpanishImages.length} Ancient Spanish Monastery image files:`);
  ancientSpanishImages.forEach(file => {
    console.log(`   - ${file}`);
  });
  
} catch (error) {
  console.log(`Error reading image directory: ${error.message}`);
}
