const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');

// Load Google Maps URLs
const googleUrlsPath = path.join(__dirname, 'all-google-maps-urls.txt');
const venuesPath = path.join(__dirname, '../src/data/venues.json');

let venueUrls = [];
let venues = [];

// Free proxy list (you can expand this with paid services)
const proxyList = [
  // These are example free proxies - you'd want to use a reliable proxy service
  null, // No proxy for first attempts
  '8.8.8.8:8080',
  '1.1.1.1:8080',
  // Add more proxies as needed
];

let currentProxyIndex = 0;

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

// Get random user agent
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Get next proxy
function getNextProxy() {
  const proxy = proxyList[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;
  return proxy;
}

// Create driver with proxy and randomized settings
async function createDriver() {
  const proxy = getNextProxy();
  const userAgent = getRandomUserAgent();
  
  const options = new chrome.Options();
  
  // Basic stealth options
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-setuid-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-accelerated-2d-canvas');
  options.addArguments('--no-first-run');
  options.addArguments('--no-zygote');
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1920,1080');
  options.addArguments(`--user-agent=${userAgent}`);
  
  // Anti-detection measures
  options.addArguments('--disable-blink-features=AutomationControlled');
  options.addArguments('--disable-extensions');
  options.addArguments('--disable-plugins-discovery');
  options.addArguments('--disable-default-apps');
  options.addArguments('--disable-sync');
  options.addArguments('--disable-translate');
  options.addArguments('--hide-scrollbars');
  options.addArguments('--mute-audio');
  options.addArguments('--no-default-browser-check');
  options.addArguments('--disable-background-timer-throttling');
  options.addArguments('--disable-backgrounding-occluded-windows');
  options.addArguments('--disable-renderer-backgrounding');
  
  // Add proxy if available
  if (proxy) {
    options.addArguments(`--proxy-server=http://${proxy}`);
    console.log(`🔄 Using proxy: ${proxy}`);
  } else {
    console.log('🔄 Using direct connection');
  }
  
  // Set preferences to avoid automation detection
  options.setUserPreferences({
    'profile.default_content_setting_values.notifications': 2,
    'profile.default_content_settings.popups': 0,
    'profile.managed_default_content_settings.images': 1
  });
  
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  
  // Execute stealth scripts
  await driver.executeScript(`
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
    
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin' },
        { name: 'Chrome PDF Viewer' },
        { name: 'Native Client' }
      ],
    });
    
    window.chrome = {
      runtime: {},
    };
    
    const originalQuery = window.navigator.permissions.query;
    return window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  `);
  
  return driver;
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
        const redirectUrl = response.headers.location;
        downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Generate safe filename
function generateSafeFilename(venueName, venueIndex) {
  const safeName = venueName
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, '')
    .replace(/\s+/g, '-')
    .replace(/&/g, 'and')
    .substring(0, 50);
  
  return `${safeName}-${venueIndex + 1}.jpg`;
}

// Scrape first image from Google Maps using Selenium
async function scrapeGoogleImageSelenium(driver, venueUrl, venueName) {
  try {
    console.log(`  🔍 Navigating to: ${venueUrl.url}`);
    
    // Navigate to the URL
    await driver.get(venueUrl.url);
    
    // Wait for page to load
    await driver.sleep(3000);
    
    // Handle cookie consent if present
    try {
      const cookieButton = await driver.findElement(By.css('button[aria-label*="Accept"], button[aria-label*="I agree"], .VfPpkd-LgbsSe[aria-label*="Accept"]'));
      if (cookieButton) {
        await cookieButton.click();
        await driver.sleep(1000);
      }
    } catch (e) {
      // No cookie consent found, continue
    }
    
    // Wait for images to load
    await driver.sleep(5000);
    
    // Multiple strategies to find venue images
    const imageSelectors = [
      // Main hero image
      'div[data-photo-index="0"] img',
      'img[src*="googleusercontent.com"][src*="places"]',
      'img[src*="maps.gstatic.com"]',
      'img[src*="streetviewpixels"]',
      
      // Gallery images
      '.section-hero-header-image img',
      '.section-hero img',
      '.gallery-image img',
      '.section-carousel img',
      'img[role="img"]',
      
      // Fallback selectors
      'img[src*="googleusercontent"]',
      'img[src*="gstatic"]'
    ];
    
    let bestImage = null;
    let bestScore = 0;
    
    for (const selector of imageSelectors) {
      try {
        const images = await driver.findElements(By.css(selector));
        
        for (const img of images) {
          try {
            const src = await img.getAttribute('src');
            const alt = await img.getAttribute('alt') || '';
            
            if (!src || 
                src.includes('profile') || 
                src.includes('avatar') || 
                src.includes('logo') ||
                src.includes('icon') ||
                !src.includes('http') ||
                src.includes('data:image')) {
              continue;
            }
            
            // Get image dimensions
            const rect = await img.getRect();
            const width = rect.width;
            const height = rect.height;
            
            // Skip small images
            if (width < 200 || height < 150) {
              continue;
            }
            
            // Score the image based on various factors
            let score = 0;
            
            // Size score (bigger is better, up to a point)
            score += Math.min(width * height / 10000, 50);
            
            // URL quality score
            if (src.includes('googleusercontent.com')) score += 30;
            if (src.includes('places')) score += 20;
            if (src.includes('=w') && src.includes('=h')) score += 15; // High-res indicator
            
            // Alt text relevance
            if (alt.toLowerCase().includes(venueName.toLowerCase().split(' ')[0])) score += 25;
            
            // Position bonus (first images are usually better)
            if (imageSelectors.indexOf(selector) < 3) score += 10;
            
            if (score > bestScore) {
              bestScore = score;
              bestImage = src;
              console.log(`  📸 Found better image (score: ${score}): ${src.substring(0, 60)}...`);
            }
            
          } catch (imgError) {
            continue;
          }
        }
        
      } catch (selectorError) {
        continue;
      }
    }
    
    return bestImage;
    
  } catch (error) {
    console.log(`  ❌ Error scraping ${venueName}: ${error.message}`);
    return null;
  }
}

// Main scraping function
async function scrapeVenueImagesSelenium() {
  console.log('🚀 Starting enhanced Google Maps image scraping...');
  console.log('🔧 Using Selenium WebDriver with proxy rotation');
  console.log('🔍 Extracting first photo from each venue\'s Google listing');
  
  const updatedVenues = [];
  let successCount = 0;
  let skippedCount = 0;
  let failureCount = 0;
  
  // Process in smaller batches
  const batchSize = 3; // Smaller batches for stability
  const batches = [];
  
  for (let i = 0; i < venueUrls.length; i += batchSize) {
    batches.push(venueUrls.slice(i, i + batchSize));
  }
  
  let driver = null;
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`\n📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} venues)`);
    
    // Create new driver for each batch (fresh session)
    if (driver) {
      await driver.quit();
    }
    
    try {
      driver = await createDriver();
    } catch (error) {
      console.log(`❌ Failed to create driver: ${error.message}`);
      continue;
    }
    
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
      
      // Check if venue already has real images (not placeholders)
      const hasRealImages = venue.images && venue.images.some(img => !img.url.includes('placeholder'));
      if (hasRealImages) {
        console.log(`  ⏭️  Venue already has real images, skipping`);
        updatedVenues.push(venue);
        skippedCount++;
        continue;
      }
      
      try {
        const imageUrl = await scrapeGoogleImageSelenium(driver, venueUrl, venueUrl.name);
        
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
            source: 'google-maps-selenium'
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
          failureCount++;
        }
        
      } catch (error) {
        console.log(`  💥 Error processing ${venueUrl.name}: ${error.message}`);
        updatedVenues.push(venue);
        failureCount++;
      }
      
      // Random delay between requests (2-5 seconds)
      const delay = 2000 + Math.random() * 3000;
      console.log(`  ⏱️  Waiting ${Math.round(delay/1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Longer delay between batches
    if (batchIndex < batches.length - 1) {
      const batchDelay = 15000 + Math.random() * 10000; // 15-25 seconds
      console.log(`\n⏸️  Pausing ${Math.round(batchDelay/1000)}s between batches...`);
      await new Promise(resolve => setTimeout(resolve, batchDelay));
    }
  }
  
  if (driver) {
    await driver.quit();
  }
  
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
    imageSource: 'google-maps-selenium-scraped'
  };
  
  fs.writeFileSync(venuesPath, JSON.stringify(updatedVenuesData, null, 2));
  
  // Generate report
  const report = {
    totalVenues: venueUrls.length,
    successful: successCount,
    skipped: skippedCount,
    failed: failureCount,
    successRate: `${((successCount / venueUrls.length) * 100).toFixed(1)}%`,
    completedAt: new Date().toISOString(),
    venuesWithImages: updatedVenues.filter(v => v.images && v.images.length > 0).length,
    proxiesUsed: proxyList.length,
    batchesProcessed: Math.ceil(venueUrls.length / batchSize)
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'selenium-scrape-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n🎉 Enhanced Google Maps image scraping complete!`);
  console.log(`📊 Results:`);
  console.log(`   Total venues processed: ${venueUrls.length}`);
  console.log(`   Successfully scraped: ${successCount}`);
  console.log(`   Skipped (already had images): ${skippedCount}`);
  console.log(`   Failed: ${failureCount}`);
  console.log(`   Success rate: ${report.successRate}`);
  console.log(`📁 Images saved to: /public/images/venues/`);
  console.log(`📄 Report saved to: selenium-scrape-report.json`);
}

// Test function for smaller batch
async function testScraping(maxVenues = 5) {
  console.log(`🧪 Testing enhanced scraper with first ${maxVenues} venues...`);
  
  const originalUrls = [...venueUrls];
  venueUrls = venueUrls.slice(0, maxVenues);
  
  await scrapeVenueImagesSelenium();
  
  venueUrls = originalUrls;
}

// Run the scraper
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    const maxVenues = parseInt(args.find(arg => arg.startsWith('--max='))?.split('=')[1]) || 3;
    testScraping(maxVenues).catch(error => {
      console.error('💥 Test scraping failed:', error);
      process.exit(1);
    });
  } else {
    scrapeVenueImagesSelenium().catch(error => {
      console.error('💥 Scraping failed:', error);
      process.exit(1);
    });
  }
}

module.exports = { scrapeVenueImagesSelenium, testScraping };
