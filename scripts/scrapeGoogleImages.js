const fs = require('fs');
const path = require('path');
const https = require('https');
const puppeteer = require('puppeteer');

// Load venues data
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

// Load Google Maps URLs
const googleUrlsPath = path.join(__dirname, 'google-maps-urls.txt');
let googleUrls = new Map();

try {
  const urlsContent = fs.readFileSync(googleUrlsPath, 'utf8');
  const lines = urlsContent.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    const [venueName, url] = line.split(' | ');
    if (venueName && url) {
      googleUrls.set(venueName.trim(), url.trim());
    }
  });
  
  console.log(`🔗 Loaded ${googleUrls.size} Google Maps URLs`);
} catch (error) {
  console.error('❌ Could not load google-maps-urls.txt:', error.message);
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
    // Handle data URLs
    if (url.startsWith('data:')) {
      try {
        const base64Data = url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filepath, buffer);
        resolve(filepath);
      } catch (error) {
        reject(error);
      }
      return;
    }

    // Handle HTTP/HTTPS URLs
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
        reject(new Error(`Failed to download image: ${response.statusCode} ${response.statusMessage}`));
      }
    }).on('error', reject);
  });
}

// Generate safe filename from venue name
function generateSafeFilename(venueName, imageIndex = 0) {
  const safeName = venueName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  return `${safeName}-google-${imageIndex + 1}.jpg`;
}

// Scrape images from Google Maps for a single venue
async function scrapeVenueFromGoogle(page, venueName, googleUrl, venueIndex) {
  try {
    console.log(`\n📸 Processing venue ${venueIndex + 1}: ${venueName}`);
    console.log(`🔗 URL: ${googleUrl}`);
    
    // Navigate to Google Maps URL
    await page.goto(googleUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find and click the first photo
    let imageUrls = [];
    
    try {
      // Look for photo thumbnails in Google Maps
      const photoSelectors = [
        '[data-value="Photo"]', // Photo button
        '[jsaction*="photo"]', // Elements with photo actions
        'img[src*="googleusercontent"]', // Google hosted images
        'img[src*="maps.googleapis.com"]', // Maps API images
        '[role="img"]', // Image elements
        '.photo-container img',
        '.section-hero-header-image img'
      ];
      
      let foundPhotos = false;
      
      for (const selector of photoSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          
          // Get image URLs from this selector
          const images = await page.evaluate((sel) => {
            const elements = document.querySelectorAll(sel);
            const urls = [];
            
            elements.forEach(el => {
              if (el.tagName === 'IMG' && el.src) {
                // Filter out small icons and logos
                if (el.naturalWidth > 200 && el.naturalHeight > 150) {
                  urls.push({
                    src: el.src,
                    width: el.naturalWidth,
                    height: el.naturalHeight
                  });
                }
              }
            });
            
            return urls;
          }, selector);
          
          if (images.length > 0) {
            imageUrls.push(...images);
            foundPhotos = true;
            console.log(`  ✅ Found ${images.length} images with selector: ${selector}`);
            break;
          }
          
        } catch (selectorError) {
          // Continue to next selector
          continue;
        }
      }
      
      // If no photos found with selectors, try clicking photo buttons
      if (!foundPhotos) {
        try {
          // Try to click photos section
          const photoButtons = await page.$$('[data-value="Photo"], [aria-label*="photo" i], [aria-label*="Photo"]');
          
          if (photoButtons.length > 0) {
            console.log(`  📱 Clicking photo button...`);
            await photoButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Now look for images in the photo viewer
            const viewerImages = await page.evaluate(() => {
              const imgs = document.querySelectorAll('img[src*="googleusercontent"], img[src*="maps.googleapis.com"]');
              const urls = [];
              
              imgs.forEach(img => {
                if (img.naturalWidth > 300 && img.naturalHeight > 200) {
                  urls.push({
                    src: img.src,
                    width: img.naturalWidth,
                    height: img.naturalHeight
                  });
                }
              });
              
              return urls;
            });
            
            if (viewerImages.length > 0) {
              imageUrls.push(...viewerImages);
              foundPhotos = true;
              console.log(`  ✅ Found ${viewerImages.length} images in photo viewer`);
            }
          }
        } catch (clickError) {
          console.log(`  ⚠️  Could not click photo button: ${clickError.message}`);
        }
      }
      
    } catch (scrapeError) {
      console.log(`  ⚠️  Error scraping photos: ${scrapeError.message}`);
    }
    
    // Download the best image (largest one)
    if (imageUrls.length > 0) {
      // Sort by size and take the largest
      imageUrls.sort((a, b) => (b.width * b.height) - (a.width * a.height));
      const bestImage = imageUrls[0];
      
      console.log(`  ⬇️  Downloading best image (${bestImage.width}x${bestImage.height})...`);
      
      const filename = generateSafeFilename(venueName, 0);
      const filepath = path.join(imagesDir, filename);
      
      try {
        await downloadImage(bestImage.src, filepath);
        console.log(`  ✅ Downloaded: ${filename}`);
        
        return {
          id: `google-img-${venueIndex + 1}`,
          url: `/images/venues/${filename}`,
          alt: `${venueName} - Google Maps photo`,
          isPrimary: true,
          source: 'google-maps',
          dimensions: {
            width: bestImage.width,
            height: bestImage.height
          }
        };
        
      } catch (downloadError) {
        console.log(`  ❌ Failed to download image: ${downloadError.message}`);
        return null;
      }
      
    } else {
      console.log(`  ⚠️  No suitable images found for ${venueName}`);
      return null;
    }
    
  } catch (error) {
    console.log(`  ❌ Error processing ${venueName}: ${error.message}`);
    return null;
  }
}

// Main scraping function
async function scrapeAllGoogleImages() {
  console.log('🚀 Starting Google Maps image scraping...');
  console.log('📝 This will scrape the first image from each venue\'s Google listing');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Set to true for production
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  });
  
  const page = await browser.newPage();
  
  // Set viewport and user agent
  await page.setViewport({ width: 1920, height: 1080 });
  
  const updatedVenues = [];
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i];
    const googleUrl = googleUrls.get(venue.name);
    
    if (!googleUrl) {
      console.log(`\n⚠️  No Google URL found for: ${venue.name}`);
      updatedVenues.push(venue);
      failureCount++;
      continue;
    }
    
    try {
      const googleImage = await scrapeVenueFromGoogle(page, venue.name, googleUrl, i);
      
      if (googleImage) {
        // Update venue with Google image
        const updatedVenue = {
          ...venue,
          images: [googleImage, ...(venue.images || [])],
          lastImageUpdate: new Date().toISOString(),
          imageSource: 'google-maps'
        };
        
        updatedVenues.push(updatedVenue);
        successCount++;
      } else {
        updatedVenues.push(venue);
        failureCount++;
      }
      
      // Small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`\n❌ Failed to process ${venue.name}: ${error.message}`);
      updatedVenues.push(venue);
      failureCount++;
    }
    
    // Save progress every 10 venues
    if ((i + 1) % 10 === 0) {
      console.log(`\n💾 Saving progress... (${i + 1}/${venues.length} processed)`);
      const progressData = {
        weddingVenues: updatedVenues,
        lastUpdated: new Date().toISOString(),
        imageSource: 'google-maps-partial'
      };
      fs.writeFileSync(venuesPath, JSON.stringify(progressData, null, 2));
    }
  }
  
  await browser.close();
  
  // Save final results
  const finalVenuesData = {
    weddingVenues: updatedVenues,
    lastUpdated: new Date().toISOString(),
    imageSource: 'google-maps'
  };
  
  fs.writeFileSync(venuesPath, JSON.stringify(finalVenuesData, null, 2));
  
  // Generate report
  const report = {
    totalVenues: venues.length,
    successful: successCount,
    failed: failureCount,
    successRate: `${((successCount / venues.length) * 100).toFixed(1)}%`,
    completedAt: new Date().toISOString(),
    venuesWithImages: updatedVenues.filter(v => v.images && v.images.length > 0).length
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'google-scrape-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n🎉 Google image scraping complete!`);
  console.log(`📊 Results:`);
  console.log(`   Total venues: ${venues.length}`);
  console.log(`   Successfully scraped: ${successCount}`);
  console.log(`   Failed: ${failureCount}`);
  console.log(`   Success rate: ${report.successRate}`);
  console.log(`📁 Images saved to: /public/images/venues/`);
  console.log(`📄 Report saved to: google-scrape-report.json`);
}

// Run the scraper
if (require.main === module) {
  scrapeAllGoogleImages().catch(error => {
    console.error('💥 Scraping failed:', error);
    process.exit(1);
  });
}

module.exports = { scrapeAllGoogleImages };
