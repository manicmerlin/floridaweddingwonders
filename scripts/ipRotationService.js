const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Enhanced proxy service with multiple providers
class ProxyRotator {
  constructor() {
    this.proxies = [];
    this.currentIndex = 0;
    this.failedProxies = new Set();
    this.lastRotation = Date.now();
    this.rotationInterval = 30000; // Rotate every 30 seconds
  }

  // Load free proxy list from multiple sources
  async loadFreeProxies() {
    console.log('🔄 Loading free proxy list...');
    
    const freeProxySources = [
      'https://api.proxyscrape.com/v2/?request=get&protocol=http&format=textplain&country=US&timeout=10000&limit=20',
      'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
      'https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt'
    ];

    const allProxies = new Set();
    
    for (const source of freeProxySources) {
      try {
        console.log(`  📥 Fetching from: ${source.substring(0, 50)}...`);
        const response = await axios.get(source, { timeout: 10000 });
        const proxies = response.data
          .split('\n')
          .filter(line => line.trim() && line.includes(':'))
          .map(line => line.trim());
        
        proxies.forEach(proxy => allProxies.add(proxy));
        console.log(`  ✅ Found ${proxies.length} proxies`);
        
      } catch (error) {
        console.log(`  ❌ Failed to fetch from source: ${error.message}`);
      }
    }

    // Convert to array and add some manual backup proxies
    this.proxies = Array.from(allProxies);
    
    // Add some known working proxy services (these are examples - use real ones)
    const backupProxies = [
      null, // Direct connection
      '8.8.8.8:8080',
      '1.1.1.1:8080',
      '208.67.222.222:8080'
    ];
    
    this.proxies = [...this.proxies, ...backupProxies];
    
    console.log(`📊 Total proxies loaded: ${this.proxies.length}`);
    return this.proxies.length;
  }

  // Test proxy connectivity
  async testProxy(proxy) {
    if (!proxy) return true; // Direct connection
    
    try {
      const testUrl = 'http://httpbin.org/ip';
      const response = await axios.get(testUrl, {
        proxy: {
          host: proxy.split(':')[0],
          port: parseInt(proxy.split(':')[1])
        },
        timeout: 5000
      });
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Get next working proxy
  async getNextProxy() {
    // Rotate if enough time has passed
    if (Date.now() - this.lastRotation > this.rotationInterval) {
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
      this.lastRotation = Date.now();
    }

    let attempts = 0;
    const maxAttempts = this.proxies.length;

    while (attempts < maxAttempts) {
      const currentProxy = this.proxies[this.currentIndex];
      
      // Skip failed proxies
      if (!this.failedProxies.has(currentProxy)) {
        // Test proxy if it's not direct connection and hasn't been tested recently
        if (currentProxy === null || await this.testProxy(currentProxy)) {
          console.log(`🔄 Using proxy: ${currentProxy || 'direct connection'}`);
          return currentProxy;
        } else {
          // Mark as failed
          this.failedProxies.add(currentProxy);
          console.log(`❌ Proxy failed: ${currentProxy}`);
        }
      }

      // Move to next proxy
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
      attempts++;
    }

    // If all proxies failed, clear failed list and try direct connection
    console.log('⚠️  All proxies failed, using direct connection');
    this.failedProxies.clear();
    return null;
  }

  // Mark proxy as failed
  markProxyFailed(proxy) {
    if (proxy) {
      this.failedProxies.add(proxy);
      console.log(`🚫 Marked proxy as failed: ${proxy}`);
    }
  }

  // Get proxy statistics
  getStats() {
    return {
      totalProxies: this.proxies.length,
      failedProxies: this.failedProxies.size,
      workingProxies: this.proxies.length - this.failedProxies.size,
      currentProxy: this.proxies[this.currentIndex] || 'direct'
    };
  }
}

// User agent rotation
class UserAgentRotator {
  constructor() {
    this.userAgents = [
      // Chrome on different platforms
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      
      // Safari
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
      
      // Firefox
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0',
      
      // Edge
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    ];
    this.currentIndex = 0;
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  getNextUserAgent() {
    const userAgent = this.userAgents[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.userAgents.length;
    return userAgent;
  }
}

// IP rotation service integration
class IPRotationService {
  constructor() {
    this.proxyRotator = new ProxyRotator();
    this.userAgentRotator = new UserAgentRotator();
    this.requestCount = 0;
    this.rotateEvery = 5; // Rotate after every 5 requests
  }

  async initialize() {
    console.log('🚀 Initializing IP rotation service...');
    await this.proxyRotator.loadFreeProxies();
    console.log('✅ IP rotation service ready');
  }

  async getRotatedConnection() {
    this.requestCount++;
    
    // Rotate proxy and user agent periodically
    if (this.requestCount % this.rotateEvery === 0) {
      console.log('🔄 Rotating connection...');
    }

    const proxy = await this.proxyRotator.getNextProxy();
    const userAgent = this.userAgentRotator.getRandomUserAgent();

    return {
      proxy,
      userAgent,
      stats: this.proxyRotator.getStats()
    };
  }

  markConnectionFailed(proxy) {
    this.proxyRotator.markProxyFailed(proxy);
  }

  getStats() {
    return {
      ...this.proxyRotator.getStats(),
      totalRequests: this.requestCount,
      rotateEvery: this.rotateEvery
    };
  }

  // Test the rotation service
  async testRotation() {
    console.log('🧪 Testing IP rotation service...');
    
    for (let i = 0; i < 5; i++) {
      const connection = await this.getRotatedConnection();
      console.log(`Test ${i + 1}:`, {
        proxy: connection.proxy || 'direct',
        userAgent: connection.userAgent.substring(0, 50) + '...'
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ IP rotation test complete');
    console.log('📊 Final stats:', this.getStats());
  }
}

// Export for use in other scripts
module.exports = {
  ProxyRotator,
  UserAgentRotator,
  IPRotationService
};

// Test if run directly
if (require.main === module) {
  const service = new IPRotationService();
  service.initialize()
    .then(() => service.testRotation())
    .catch(error => {
      console.error('💥 IP rotation test failed:', error);
      process.exit(1);
    });
}
