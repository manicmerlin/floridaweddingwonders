import fs from 'fs';
import path from 'path';

const VENUES_JSON_PATH = path.join(process.cwd(), 'src/data/venues.json');

async function checkVenuePhotos() {
  try {
    console.log('📖 Reading venues.json to check photo status...');
    
    // Read the current venues data
    const venuesData = JSON.parse(fs.readFileSync(VENUES_JSON_PATH, 'utf8'));
    
    const venues = venuesData.weddingVenues;
    console.log(`✅ Found ${venues.length} venues\n`);
    
    let withRealPhotos = 0;
    let withPlaceholders = 0;
    
    console.log('📊 Venue Photo Status:\n');
    
    venues.forEach((venue, index) => {
      const venueId = index + 1;
      const hasPlaceholder = venue.images && venue.images.some(img => 
        img.url.includes('venue-placeholder.svg')
      );
      
      if (hasPlaceholder) {
        withPlaceholders++;
        console.log(`🎨 ${venueId.toString().padStart(3)}: ${venue.name} - PLACEHOLDER`);
      } else {
        withRealPhotos++;
        console.log(`📸 ${venueId.toString().padStart(3)}: ${venue.name} - REAL PHOTOS`);
        if (venue.images && venue.images.length > 0) {
          console.log(`     Primary: ${venue.images.find(img => img.isPrimary)?.url || 'none'}`);
        }
      }
    });
    
    console.log('\n📈 Summary:');
    console.log(`   - Venues with real photos: ${withRealPhotos}`);
    console.log(`   - Venues with placeholders: ${withPlaceholders}`);
    console.log(`   - Total venues: ${venues.length}`);
    
    // Check if photo-based sorting would work
    console.log('\n🔄 Photo-based sorting preview (first 10):');
    const sortedVenues = [...venues].sort((a, b) => {
      const aHasPhotos = a.images && !a.images.some(img => img.url.includes('venue-placeholder.svg'));
      const bHasPhotos = b.images && !b.images.some(img => img.url.includes('venue-placeholder.svg'));
      
      if (aHasPhotos && !bHasPhotos) return -1;
      if (!aHasPhotos && bHasPhotos) return 1;
      return a.name.localeCompare(b.name);
    });
    
    sortedVenues.slice(0, 10).forEach((venue, index) => {
      const hasRealPhotos = venue.images && !venue.images.some(img => img.url.includes('venue-placeholder.svg'));
      const status = hasRealPhotos ? '📸 REAL' : '🎨 PLACEHOLDER';
      console.log(`   ${(index + 1).toString().padStart(2)}: ${venue.name} - ${status}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking venue photos:', error);
    process.exit(1);
  }
}

// Run the script
checkVenuePhotos();
