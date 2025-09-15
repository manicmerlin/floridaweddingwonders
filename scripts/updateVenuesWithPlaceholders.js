import fs from 'fs';
import path from 'path';

const VENUES_JSON_PATH = path.join(process.cwd(), 'src/data/venues.json');

// Venues that should keep their real images
const VENUES_WITH_REAL_IMAGES = [
  'Ancient Spanish Monastery'
];

/**
 * Creates placeholder images for a venue
 */
function createPlaceholderImages(venueName) {
  return [
    {
      id: 'placeholder-primary',
      url: '/images/venue-placeholder.svg',
      alt: `${venueName} - Wedding venue placeholder`,
      isPrimary: true
    },
    {
      id: 'placeholder-1',
      url: '/images/venue-placeholder.svg',
      alt: `${venueName} - Ceremony space`,
      isPrimary: false
    },
    {
      id: 'placeholder-2',
      url: '/images/venue-placeholder.svg',
      alt: `${venueName} - Reception area`,
      isPrimary: false
    },
    {
      id: 'placeholder-3',
      url: '/images/venue-placeholder.svg',
      alt: `${venueName} - Venue details`,
      isPrimary: false
    }
  ];
}

/**
 * Checks if a venue should use placeholder images
 */
function shouldUsePlaceholder(venueName) {
  return !VENUES_WITH_REAL_IMAGES.includes(venueName);
}

/**
 * Updates a venue to use placeholder images (unless it should keep real images)
 */
function updateVenueImages(venue) {
  if (!shouldUsePlaceholder(venue.name)) {
    // Keep original images for venues that should have real images
    return venue;
  }
  
  return {
    ...venue,
    images: createPlaceholderImages(venue.name),
    lastImageUpdate: new Date().toISOString()
  };
}

async function updateVenuesWithPlaceholders() {
  try {
    console.log('📖 Reading venues.json...');
    
    // Read the current venues data
    const venuesData = JSON.parse(fs.readFileSync(VENUES_JSON_PATH, 'utf8'));
    
    console.log(`✅ Found ${venuesData.weddingVenues.length} venues`);
    
    // Update each venue (except those that should keep real images)
    const updatedVenues = venuesData.weddingVenues.map(venue => {
      const updated = updateVenueImages(venue);
      if (updated !== venue) {
        console.log(`🔄 Updated ${venue.name} with placeholder images`);
      } else {
        console.log(`⏭️  Keeping real images for ${venue.name}`);
      }
      return updated;
    });
    
    // Create the updated data structure
    const updatedData = {
      weddingVenues: updatedVenues
    };
    
    // Write back to file
    console.log('💾 Writing updated venues.json...');
    fs.writeFileSync(VENUES_JSON_PATH, JSON.stringify(updatedData, null, 2));
    
    console.log('✅ Successfully updated venues with placeholder images!');
    console.log(`📊 Summary:`);
    console.log(`   - Total venues: ${updatedVenues.length}`);
    console.log(`   - Updated with placeholders: ${updatedVenues.filter(v => v.images?.[0]?.url.includes('venue-placeholder.svg')).length}`);
    console.log(`   - Kept real images: ${updatedVenues.filter(v => !v.images?.[0]?.url.includes('venue-placeholder.svg')).length}`);
    
  } catch (error) {
    console.error('❌ Error updating venues:', error);
    process.exit(1);
  }
}

// Run the script
updateVenuesWithPlaceholders();
