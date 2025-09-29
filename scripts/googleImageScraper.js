const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load Google Maps URLs
const googleUrlsPath = path.join(__dirname, 'all-google-maps-urls.txt');
const venuesPath = path.join(__dirname, '../src/data/venues.json');

let venueUrls = [];
let venues = [];

try {
  const urlsData = fs.readFileSync(googleUrlsPath, 'utf8');
  venueUrls = urlsData.split('\n').filter(line => line.trim()).map(line => {
    const parts = line.split(' | ');
    return {
      name: parts[0],
      url: parts[1]
    };
  });
  console.log(`📍 Loaded ${venueUrls.length} Google Maps URLs`);
} catch (error) {
  console.error('❌ Could not load Google URLs:', error.message);
  process.exit(1);
}

try {
  const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
  venues = venuesData.weddingVenues || [];
  console.log(`📍 Loaded ${venues.length} venues from database`);
} catch (error) {
  console.error('❌ Could not load venues.json:', error.message);
  process.exit(1);
}

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, '../public/images/venues');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Download image function
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    // Handle protocol-relative URLs
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
        // Handle redirects
        const redirectUrl = response.headers.location;
        downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Generate safe filename from venue name
function generateSafeFilename(venueName, venueIndex) {
  const safeName = venueName
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, '')
    .replace(/\s+/g, '-')
    .replace(/&/g, 'and')
    .substring(0, 50);
  
  return `${safeName}-${venueIndex + 1}.jpg`;
}

// Scrape first image from Google Maps
async function scrapeGoogleImage(browser, venueUrl, venueName) {
  const page = await browser.newPage();
  
  try {
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log(`  🔍 Navigating to: ${venueUrl.url}`);
    await page.goto(venueUrl.url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for images to load
    await page.waitForTimeout(3000);
    
    // Try multiple selectors for Google Maps images
    const imageSelectors = [
      'img[src*="googleusercontent.com"]',
      'img[src*="maps.gstatic.com"]',
      'img[src*="streetviewpixels"]',
      'div[data-photo-index="0"] img',
      '.section-hero-header-image img',
      '.section-hero img',
      'img[role="img"]',
      '.gallery-image img',
      '.section-carousel img'
    ];
    
    let imageUrl = null;
    
    for (const selector of imageSelectors) {
      try {
        const images = await page.$$(selector);
        
        for (const img of images) {
          const src = await img.getAttribute('src');
          
          if (src && 
              !src.includes('profile') && 
              !src.includes('avatar') && 
              !src.includes('logo') &&
              !src.includes('icon') &&
              src.includes('http') &&
              (src.includes('googleusercontent') || src.includes('gstatic') || src.includes('streetview'))) {
            
            // Get image dimensions to filter out small images
            const box = await img.boundingBox();
            if (box && box.width > 200 && box.height > 150) {
              imageUrl = src;
              console.log(`  ✅ Found image: ${src.substring(0, 80)}...`);
              break;
            }
          }
        }
        
        if (imageUrl) break;
      } catch (selectorError) {
        continue;
      }
    }
    
    return imageUrl;
    
  } catch (error) {
    console.log(`  ❌ Error scraping ${venueName}: ${error.message}`);
    return null;
  } finally {
    await page.close();
  }
}

// Main scraping function
async function scrapeVenueImages() {
  console.log('🚀 Starting Google Maps image scraping...');
  console.log('🔍 Extracting first photo from each venue\'s Google listing');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
  
  const updatedVenues = [];
  let successCount = 0;
  let skippedCount = 0;
  
  // Process in smaller batches to avoid overwhelming Google
  const batchSize = 5;
  const batches = [];
  
  for (let i = 0; i < venueUrls.length; i += batchSize) {
    batches.push(venueUrls.slice(i, i + batchSize));
  }
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`\n📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} venues)`);
    
    for (let i = 0; i < batch.length; i++) {
      const venueUrl = batch[i];
      const venueIndex = batchIndex * batchSize + i;
      
      console.log(`\n📸 Processing venue ${venueIndex + 1}/${venueUrls.length}: ${venueUrl.name}`);
      
      // Find matching venue in database
      const venue = venues.find(v => 
        v.name.toLowerCase().includes(venueUrl.name.toLowerCase()) ||
        venueUrl.name.toLowerCase().includes(v.name.toLowerCase())
      );
      
      if (!venue) {
        console.log(`  ⚠️  Venue not found in database, skipping`);
        skippedCount++;
        continue;
      }
      
      // Check if venue already has images
      if (venue.images && venue.images.length > 0) {
        console.log(`  ⏭️  Venue already has images, skipping`);
        updatedVenues.push(venue);
        skippedCount++;
        continue;
      }
      
      try {
        const imageUrl = await scrapeGoogleImage(browser, venueUrl, venueUrl.name);
        
        if (imageUrl) {
          const filename = generateSafeFilename(venueUrl.name, venueIndex);
          const filepath = path.join(imagesDir, filename);
          
          console.log(`  ⬇️  Downloading image...`);
          await downloadImage(imageUrl, filepath);
          
          // Create image object
          const venueImage = {
            id: `img-${venueIndex + 1}`,
            url: `/images/venues/${filename}`,
            alt: `${venue.name} wedding venue`,
            isPrimary: true,
            source: 'google-maps'
          };
          
          // Update venue with image
          const updatedVenue = {
            ...venue,
            images: [venueImage, ...(venue.images || [])],
            lastImageUpdate: new Date().toISOString()
          };
          
          updatedVenues.push(updatedVenue);
          successCount++;
          
          console.log(`  ✅ Added image: ${filename}`);
          
        } else {
          console.log(`  ❌ No suitable image found`);
          updatedVenues.push(venue);
        }
        
      } catch (error) {
        console.log(`  💥 Error processing ${venueUrl.name}: ${error.message}`);
        updatedVenues.push(venue);
      }
      
      // Delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Longer delay between batches
    if (batchIndex < batches.length - 1) {
      console.log(`\n⏸️  Pausing 10 seconds between batches...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  await browser.close();
  
  // Add any remaining venues that weren't in the URL list
  const processedVenueNames = new Set(updatedVenues.map(v => v.name));
  venues.forEach(venue => {
    if (!processedVenueNames.has(venue.name)) {
      updatedVenues.push(venue);
    }
  });
  
  // Save updated venues data
  const updatedVenuesData = {
    weddingVenues: updatedVenues,
    lastUpdated: new Date().toISOString(),
    imageSource: 'google-maps-scraped'
  };
  
  fs.writeFileSync(venuesPath, JSON.stringify(updatedVenuesData, null, 2));
  
  // Generate report
  const report = {
    totalVenues: venueUrls.length,
    successful: successCount,
    skipped: skippedCount,
    failed: venueUrls.length - successCount - skippedCount,
    successRate: `${((successCount / venueUrls.length) * 100).toFixed(1)}%`,
    completedAt: new Date().toISOString(),
    venuesWithImages: updatedVenues.filter(v => v.images && v.images.length > 0).length
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'google-scrape-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n🎉 Google Maps image scraping complete!`);
  console.log(`📊 Results:`);
  console.log(`   Total venues processed: ${venueUrls.length}`);
  console.log(`   Successfully scraped: ${successCount}`);
  console.log(`   Skipped (already had images): ${skippedCount}`);
  console.log(`   Failed: ${venueUrls.length - successCount - skippedCount}`);
  console.log(`   Success rate: ${report.successRate}`);
  console.log(`📁 Images saved to: /public/images/venues/`);
  console.log(`📄 Report saved to: google-scrape-report.json`);
}

// Run the scraper
if (require.main === module) {
  scrapeVenueImages().catch(error => {
    console.error('💥 Scraping failed:', error);
    process.exit(1);
  });
}

module.exports = { scrapeVenueImages };
