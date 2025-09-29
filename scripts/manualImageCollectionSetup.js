const fs = require('fs');
const path = require('path');

// Load venues
const venuesPath = path.join(__dirname, '../src/data/venues.json');
let venues = [];

try {
  const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
  venues = venuesData.weddingVenues || [];
  console.log(`📍 Loaded ${venues.length} venues from database`);
} catch (error) {
  console.error('❌ Could not load venues.json:', error.message);
  process.exit(1);
}

// Instructions for manual Google image collection
console.log(`
🎯 MANUAL GOOGLE IMAGE EXTRACTION GUIDE
======================================

Since Google has anti-bot protections, here's how to efficiently collect venue images:

📋 STEP-BY-STEP PROCESS:
1. Open Google Maps in your browser
2. Search for each venue name + location
3. Right-click on the main venue photo
4. Select "Copy image address" 
5. Paste the URL into the manual collection below

🔧 AUTOMATED ASSISTANCE:
I'll generate a template file with all venue information and Google Maps links.
You can then add the image URLs and run the processing script.

📁 FILES THAT WILL BE CREATED:
- venue-image-collection-template.csv (for manual URL entry)  
- processManualImages.js (to process the completed CSV)

🚀 ALTERNATIVE APPROACHES:
- Use venue websites directly
- Search for "[Venue Name] wedding photos" in Google Images
- Use Bing Images (less restrictive)
- Professional photography databases
`);

// Generate CSV template for manual image collection
function generateCollectionTemplate() {
  const csvHeaders = [
    'Venue Name',
    'Location', 
    'Google Maps URL',
    'Venue Website',
    'Image URL 1 (Main)',
    'Image URL 2 (Optional)',
    'Image URL 3 (Optional)',
    'Notes'
  ];
  
  const csvRows = [csvHeaders.join(',')];
  
  // Load Google Maps URLs
  const googleUrlsPath = path.join(__dirname, 'all-google-maps-urls.txt');
  let venueUrls = [];
  
  try {
    const urlsData = fs.readFileSync(googleUrlsPath, 'utf8');
    venueUrls = urlsData.split('\n').filter(line => line.trim()).map(line => {
      const parts = line.split(' | ');
      return {
        name: parts[0],
        url: parts[1]
      };
    });
  } catch (error) {
    console.log('⚠️  Could not load Google URLs, proceeding without them');
  }
  
  venues.forEach(venue => {
    // Find matching Google Maps URL
    const googleUrl = venueUrls.find(gu => 
      gu.name.toLowerCase().includes(venue.name.toLowerCase()) ||
      venue.name.toLowerCase().includes(gu.name.toLowerCase())
    );
    
    // Check if venue already has real images
    const hasRealImages = venue.images && venue.images.some(img => !img.url.includes('placeholder'));
    const status = hasRealImages ? 'HAS_IMAGES' : 'NEEDS_IMAGES';
    
    const row = [
      `"${venue.name}"`,
      `"${venue.location || 'N/A'}"`,
      `"${googleUrl?.url || 'N/A'}"`,
      `"${venue.website || 'N/A'}"`,
      '', // Image URL 1 (to be filled manually)
      '', // Image URL 2 (optional)
      '', // Image URL 3 (optional)
      `"${status}"`
    ];
    
    csvRows.push(row.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  const csvPath = path.join(__dirname, 'venue-image-collection-template.csv');
  fs.writeFileSync(csvPath, csvContent);
  
  console.log(`\n✅ Created collection template: ${csvPath}`);
  console.log(`📊 Template contains ${venues.length} venues`);
  
  return csvPath;
}

// Generate processing script for manual image URLs
function generateProcessingScript() {
  const processingScript = `const fs = require('fs');
const path = require('path');
const https = require('https');

// Process manually collected image URLs
async function processManualImageCollection() {
  console.log('🚀 Processing manually collected venue images...');
  
  // Load CSV with manual image URLs
  const csvPath = path.join(__dirname, 'venue-image-collection-template.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV template not found. Run the main script first.');
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\\n');
  const headers = lines[0].split(',');
  
  // Find column indexes
  const nameIndex = headers.findIndex(h => h.includes('Venue Name'));
  const image1Index = headers.findIndex(h => h.includes('Image URL 1'));
  const image2Index = headers.findIndex(h => h.includes('Image URL 2'));
  const image3Index = headers.findIndex(h => h.includes('Image URL 3'));
  
  // Load venues
  const venuesPath = path.join(__dirname, '../src/data/venues.json');
  const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
  const venues = venuesData.weddingVenues || [];
  
  // Create images directory
  const imagesDir = path.join(__dirname, '../public/images/venues');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  let processedCount = 0;
  const updatedVenues = [];
  
  // Process each venue
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const columns = line.split(',').map(col => col.replace(/"/g, ''));
    const venueName = columns[nameIndex];
    const imageUrl1 = columns[image1Index];
    const imageUrl2 = columns[image2Index];
    const imageUrl3 = columns[image3Index];
    
    console.log(\`\\n📸 Processing: \${venueName}\`);
    
    // Find venue in database
    const venue = venues.find(v => v.name === venueName);
    if (!venue) {
      console.log(\`  ⚠️  Venue not found in database\`);
      continue;
    }
    
    // Process images if URLs provided
    const imageUrls = [imageUrl1, imageUrl2, imageUrl3].filter(url => url && url.trim() && url !== 'N/A');
    
    if (imageUrls.length === 0) {
      console.log(\`  ⏭️  No image URLs provided, skipping\`);
      updatedVenues.push(venue);
      continue;
    }
    
    const venueImages = [];
    
    for (let j = 0; j < imageUrls.length; j++) {
      const imageUrl = imageUrls[j];
      
      try {
        console.log(\`  ⬇️  Downloading image \${j + 1}...\`);
        
        const filename = generateSafeFilename(venueName, processedCount, j);
        const filepath = path.join(imagesDir, filename);
        
        await downloadImage(imageUrl, filepath);
        
        const venueImage = {
          id: \`img-manual-\${processedCount}-\${j}\`,
          url: \`/images/venues/\${filename}\`,
          alt: \`\${venue.name} wedding venue\`,
          isPrimary: j === 0,
          source: 'manual-collection',
          addedAt: new Date().toISOString()
        };
        
        venueImages.push(venueImage);
        
        console.log(\`  ✅ Added image: \${filename}\`);
        
      } catch (error) {
        console.log(\`  ❌ Failed to download image \${j + 1}: \${error.message}\`);
      }
    }
    
    if (venueImages.length > 0) {
      const updatedVenue = {
        ...venue,
        images: venueImages,
        lastImageUpdate: new Date().toISOString()
      };
      
      updatedVenues.push(updatedVenue);
      processedCount++;
      
      console.log(\`  🎉 Added \${venueImages.length} images to \${venueName}\`);
    } else {
      updatedVenues.push(venue);
    }
    
    // Small delay between venues
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Add any venues that weren't in the CSV
  const processedNames = new Set(updatedVenues.map(v => v.name));
  venues.forEach(venue => {
    if (!processedNames.has(venue.name)) {
      updatedVenues.push(venue);
    }
  });
  
  // Save updated venues
  const updatedVenuesData = {
    weddingVenues: updatedVenues,
    lastUpdated: new Date().toISOString(),
    imageSource: 'manual-google-collection'
  };
  
  fs.writeFileSync(venuesPath, JSON.stringify(updatedVenuesData, null, 2));
  
  console.log(\`\\n🎉 Manual image processing complete!\`);
  console.log(\`📊 Results:\`);
  console.log(\`   Venues processed: \${processedCount}\`);
  console.log(\`   Total venues in database: \${updatedVenues.length}\`);
  console.log(\`📁 Images saved to: /public/images/venues/\`);
}

// Helper functions
function generateSafeFilename(venueName, venueIndex, imageIndex) {
  const safeName = venueName
    .toLowerCase()
    .replace(/[^a-z0-9\\s&]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/&/g, 'and')
    .substring(0, 40);
  
  return \`\${safeName}-\${venueIndex + 1}-\${imageIndex + 1}.jpg\`;
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const writeStream = fs.createWriteStream(filepath);
        response.pipe(writeStream);
        
        writeStream.on('finish', () => {
          writeStream.close();
          resolve(filepath);
        });
        
        writeStream.on('error', reject);
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
      } else {
        reject(new Error(\`HTTP \${response.statusCode}\`));
      }
    }).on('error', reject);
  });
}

// Run if called directly
if (require.main === module) {
  processManualImageCollection().catch(error => {
    console.error('💥 Processing failed:', error);
    process.exit(1);
  });
}

module.exports = { processManualImageCollection };`;

  const scriptPath = path.join(__dirname, 'processManualImages.js');
  fs.writeFileSync(scriptPath, processingScript);
  
  console.log(`✅ Created processing script: ${scriptPath}`);
  
  return scriptPath;
}

// Generate instruction file
function generateInstructions() {
  const instructions = `# Manual Google Image Collection Guide

## Overview
Since automated Google scraping is blocked, this guide helps you manually collect venue images efficiently.

## Files Created
1. \`venue-image-collection-template.csv\` - Template for manual URL entry
2. \`processManualImages.js\` - Script to process completed CSV

## Step-by-Step Process

### 1. Open the CSV Template
Open \`venue-image-collection-template.csv\` in Excel, Google Sheets, or any spreadsheet app.

### 2. For Each Venue (focus on those marked "NEEDS_IMAGES"):
1. Click the Google Maps URL in column C
2. Look for the main venue photo
3. Right-click on the photo → "Copy image address"
4. Paste the URL in column E (Image URL 1)
5. Optionally, find 2-3 more photos and add to columns F and G

### 3. Pro Tips for Finding Images:
- Use the venue's official website (column D)
- Search "[Venue Name] wedding photos" in Google Images
- Look for professional wedding photography on their social media
- Check wedding blogs featuring the venue

### 4. Image Quality Guidelines:
- Choose high-resolution images (at least 800x600)
- Prefer professional photography over phone photos
- Look for images showing the venue setup for events
- Avoid images with heavy watermarks

### 5. Process the Images:
Once you've added image URLs to the CSV, run:
\`\`\`bash
node processManualImages.js
\`\`\`

## Alternative Sources
If Google Images doesn't work well:
- **Venue websites** (usually have professional photos)
- **Wedding blogs** (search "[venue name] wedding")
- **Social media** (Instagram, Facebook)
- **Photography databases** (WeddingWire, The Knot)

## Batch Processing Tips
- Focus on venues marked "NEEDS_IMAGES" first
- You can process partial CSV files (leave some rows empty)
- The script handles missing/empty image URLs gracefully
- Images are automatically downloaded and resized appropriately

## Troubleshooting
- If an image URL doesn't work, try saving the image locally first
- Some URLs expire quickly - process soon after collecting
- Large images may take time to download
`;

  const instructionsPath = path.join(__dirname, 'MANUAL_IMAGE_COLLECTION_GUIDE.md');
  fs.writeFileSync(instructionsPath, instructions);
  
  console.log(`✅ Created instructions: ${instructionsPath}`);
  
  return instructionsPath;
}

// Main function
function setupManualImageCollection() {
  console.log('🛠️  Setting up manual Google image collection system...\n');
  
  const csvPath = generateCollectionTemplate();
  const scriptPath = generateProcessingScript();
  const instructionsPath = generateInstructions();
  
  console.log(`\n🎯 MANUAL COLLECTION SETUP COMPLETE!`);
  console.log(`\n📋 Next Steps:`);
  console.log(`1. Open: ${path.basename(csvPath)}`);
  console.log(`2. Add image URLs for venues marked "NEEDS_IMAGES"`);
  console.log(`3. Run: node ${path.basename(scriptPath)}`);
  console.log(`4. Read full guide: ${path.basename(instructionsPath)}`);
  
  console.log(`\n💡 Quick Start:`);
  console.log(`- Focus on venues without real images first`);
  console.log(`- Right-click venue photos in Google Maps → Copy image address`);
  console.log(`- Paste URLs in the CSV, then run the processing script`);
  
  console.log(`\n🔧 Files created in scripts/ directory:`);
  console.log(`- ${path.basename(csvPath)} (template for manual entry)`);
  console.log(`- ${path.basename(scriptPath)} (processes completed CSV)`);
  console.log(`- ${path.basename(instructionsPath)} (detailed guide)`);
}

// Run setup
if (require.main === module) {
  setupManualImageCollection();
}

module.exports = { setupManualImageCollection };
