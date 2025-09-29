const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Load Google Maps URLs and venues
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

// Create images directory
const imagesDir = path.join(__dirname, '../public/images/venues');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// User agents for rotation
const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// HTTP request with user agent rotation and redirect following
function makeRequest(url, options = {}, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error('Too many redirects'));
      return;
    }
    
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.google.com/',
        ...options.headers
      }
    };

    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = client.request(requestOptions, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : new URL(res.headers.location, url).href;
        
        console.log(`  🔄 Following redirect to: ${redirectUrl.substring(0, 60)}...`);
        makeRequest(redirectUrl, options, redirectCount + 1)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Download image function
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }
    
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Referer': 'https://maps.google.com/'
      }
    };
    
    client.get(url, requestOptions, (response) => {
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

// Extract images from Google Maps HTML
function extractImagesFromHtml(html, venueName) {
  const images = [];
  
  // Regex patterns for different Google image sources
  const patterns = [
    // High-resolution Google user content images
    /https:\/\/lh[0-9]+\.googleusercontent\.com\/[^"'\s]+/g,
    // Google Maps static images
    /https:\/\/maps\.gstatic\.com\/[^"'\s]+/g,
    // Street View images
    /https:\/\/streetviewpixels-pa\.googleapis\.com\/[^"'\s]+/g,
    // Google Places photos
    /https:\/\/places\.googleapis\.com\/[^"'\s]+/g
  ];
  
  patterns.forEach(pattern => {
    const matches = html.match(pattern) || [];
    matches.forEach(match => {
      // Clean up the URL
      let cleanUrl = match.replace(/\\u003d/g, '=').replace(/\\u0026/g, '&');
      
      // Skip if it's a small icon or profile image
      if (cleanUrl.includes('=s32') || 
          cleanUrl.includes('=s48') || 
          cleanUrl.includes('=s64') ||
          cleanUrl.includes('profile') ||
          cleanUrl.includes('avatar') ||
          cleanUrl.includes('icon')) {
        return;
      }
      
      // Try to get higher resolution version
      if (cleanUrl.includes('googleusercontent.com')) {
        // Replace size parameters with larger ones
        cleanUrl = cleanUrl.replace(/=s\d+/, '=s800');
        cleanUrl = cleanUrl.replace(/=w\d+/, '=w800');
        cleanUrl = cleanUrl.replace(/=h\d+/, '=h600');
        
        if (!cleanUrl.includes('=s') && !cleanUrl.includes('=w')) {
          cleanUrl += '=s800';
        }
      }
      
      images.push(cleanUrl);
    });
  });
  
  // Remove duplicates and return the best candidates
  const uniqueImages = [...new Set(images)];
  
  // Score images based on URL characteristics
  const scoredImages = uniqueImages.map(url => {
    let score = 0;
    
    // Prefer googleusercontent.com (usually venue photos)
    if (url.includes('googleusercontent.com')) score += 30;
    
    // Prefer larger images
    if (url.includes('=s800') || url.includes('=w800')) score += 20;
    if (url.includes('=s600') || url.includes('=w600')) score += 15;
    if (url.includes('=s400') || url.includes('=w400')) score += 10;
    
    // Avoid certain types
    if (url.includes('maps.gstatic.com')) score -= 10; // Often UI elements
    if (url.includes('streetview')) score -= 5; // Street view might not be venue
    
    return { url, score };
  });
  
  // Sort by score and return top candidate
  scoredImages.sort((a, b) => b.score - a.score);
  
  console.log(`  📊 Found ${uniqueImages.length} unique images, best score: ${scoredImages[0]?.score || 0}`);
  
  return scoredImages.length > 0 ? scoredImages[0].url : null;
}

// Scrape venue image from Google Maps
async function scrapeVenueImage(venueUrl, venueName) {
  try {
    console.log(`  🔍 Fetching: ${venueUrl.url}`);
    
    const response = await makeRequest(venueUrl.url);
    
    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode}`);
    }
    
    const imageUrl = extractImagesFromHtml(response.body, venueName);
    
    if (imageUrl) {
      console.log(`  ✅ Found image: ${imageUrl.substring(0, 60)}...`);
      return imageUrl;
    } else {
      console.log(`  ❌ No suitable images found in HTML`);
      return null;
    }
    
  } catch (error) {
    console.log(`  💥 Error scraping ${venueName}: ${error.message}`);
    return null;
  }
}

// Main scraping function
async function scrapeVenueImagesHttp() {
  console.log('🚀 Starting HTTP-based Google Maps image scraping...');
  console.log('🔧 Using direct HTTP requests with user agent rotation');
  console.log('🔍 Extracting venue photos from Google Maps HTML');
  
  const updatedVenues = [];
  let successCount = 0;
  let skippedCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < venueUrls.length; i++) {
    const venueUrl = venueUrls[i];
    
    console.log(`\n📸 Processing venue ${i + 1}/${venueUrls.length}: ${venueUrl.name}`);
    
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
      const imageUrl = await scrapeVenueImage(venueUrl, venueUrl.name);
      
      if (imageUrl) {
        const filename = generateSafeFilename(venueUrl.name, i);
        const filepath = path.join(imagesDir, filename);
        
        console.log(`  ⬇️  Downloading image...`);
        await downloadImage(imageUrl, filepath);
        
        // Create image object
        const venueImage = {
          id: `img-scraped-${i + 1}`,
          url: `/images/venues/${filename}`,
          alt: `${venue.name} wedding venue`,
          isPrimary: true,
          source: 'google-maps-http',
          scrapedAt: new Date().toISOString()
        };
        
        // Update venue with new image (replace placeholders)
        const updatedVenue = {
          ...venue,
          images: [venueImage],
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
    
    // Random delay between requests (1-3 seconds)
    const delay = 1000 + Math.random() * 2000;
    console.log(`  ⏱️  Waiting ${Math.round(delay/1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Save progress every 10 venues
    if ((i + 1) % 10 === 0) {
      console.log(`\n💾 Saving progress... (${i + 1}/${venueUrls.length} processed)`);
      
      // Add any remaining venues that weren't processed yet
      const processedVenueNames = new Set(updatedVenues.map(v => v.name));
      venues.forEach(venue => {
        if (!processedVenueNames.has(venue.name)) {
          updatedVenues.push(venue);
        }
      });
      
      const progressData = {
        weddingVenues: updatedVenues,
        lastUpdated: new Date().toISOString(),
        imageSource: 'google-maps-http-progress'
      };
      
      fs.writeFileSync(venuesPath, JSON.stringify(progressData, null, 2));
    }
  }
  
  // Add any remaining venues that weren't in the URL list
  const processedVenueNames = new Set(updatedVenues.map(v => v.name));
  venues.forEach(venue => {
    if (!processedVenueNames.has(venue.name)) {
      updatedVenues.push(venue);
    }
  });
  
  // Save final updated venues data
  const updatedVenuesData = {
    weddingVenues: updatedVenues,
    lastUpdated: new Date().toISOString(),
    imageSource: 'google-maps-http-scraped'
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
    venuesWithImages: updatedVenues.filter(v => v.images && v.images.some(img => !img.url.includes('placeholder'))).length
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'http-scrape-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n🎉 HTTP-based Google Maps image scraping complete!`);
  console.log(`📊 Results:`);
  console.log(`   Total venues processed: ${venueUrls.length}`);
  console.log(`   Successfully scraped: ${successCount}`);
  console.log(`   Skipped (already had images): ${skippedCount}`);
  console.log(`   Failed: ${failureCount}`);
  console.log(`   Success rate: ${report.successRate}`);
  console.log(`📁 Images saved to: /public/images/venues/`);
  console.log(`📄 Report saved to: http-scrape-report.json`);
}

// Test function for smaller batch
async function testHttpScraping(maxVenues = 5) {
  console.log(`🧪 Testing HTTP scraper with first ${maxVenues} venues...`);
  
  const originalUrls = [...venueUrls];
  venueUrls = venueUrls.slice(0, maxVenues);
  
  await scrapeVenueImagesHttp();
  
  venueUrls = originalUrls;
}

// Run the scraper
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    const maxVenues = parseInt(args.find(arg => arg.startsWith('--max='))?.split('=')[1]) || 3;
    testHttpScraping(maxVenues).catch(error => {
      console.error('💥 Test scraping failed:', error);
      process.exit(1);
    });
  } else {
    scrapeVenueImagesHttp().catch(error => {
      console.error('💥 Scraping failed:', error);
      process.exit(1);
    });
  }
}

module.exports = { scrapeVenueImagesHttp, testHttpScraping };
