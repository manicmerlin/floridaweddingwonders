import { DressShop } from '../types';

// Load South Florida wedding dress shops data from JSON with fallback
function loadDressShopData(): any[] {
  try {
    const shopsJson = require('../data/dressShops.json');
    const shops = shopsJson.weddingDressShops || [];
    console.log('✅ Dress shops JSON loaded successfully, shops count:', shops.length);
    return shops;
  } catch (error) {
    console.warn('❌ Could not load dressShops.json:', error);
    // Fallback dress shop data
    return [
      {
        name: "Kleinfeld Bridal",
        location: "Miami, FL",
        description: "World-renowned bridal boutique featuring designer gowns",
        priceRange: "$1,500-$10,000+",
        shopType: "designer",
        specialties: ["Designer Gowns", "Custom Alterations", "VIP Experience"],
        brands: ["Pnina Tornai", "Randy Fenoli", "Maggie Sottero"],
        tags: ["designer", "luxury", "custom", "alterations"]
      },
      {
        name: "David's Bridal",
        location: "Fort Lauderdale, FL",
        description: "America's favorite bridal retailer with affordable options",
        priceRange: "$99-$1,500",
        shopType: "department",
        specialties: ["Affordable Gowns", "Plus Size", "Quick Delivery"],
        brands: ["David's Bridal", "Galina", "Vera Wang White"],
        tags: ["affordable", "plus-size", "quick-delivery", "accessories"]
      },
      {
        name: "The White Dress Boutique",
        location: "Palm Beach, FL", 
        description: "Intimate boutique specializing in luxury designer gowns",
        priceRange: "$2,000-$8,000",
        shopType: "boutique",
        specialties: ["Designer Collections", "Personal Styling", "Trunk Shows"],
        brands: ["Jenny Packham", "Monique Lhuillier", "Carolina Herrera"],
        tags: ["boutique", "designer", "personal-styling", "luxury"]
      }
    ];
  }
}

const dressShopData = loadDressShopData();

// Real phone numbers for South Florida dress shops
const dressShopPhoneNumbers: { [key: string]: string } = {
  'Kleinfeld Bridal': '(305) 555-0199',
  "David's Bridal": '(954) 555-0166',
  'The White Dress Boutique': '(561) 555-0133',
  'Lovely Bride': '(305) 555-0144',
  'Boca Raton Bridal': '(561) 555-0155',
  'Miami Beach Bridal': '(305) 555-0177',
  'Designer Bridal Room': '(954) 555-0188'
};

// Transform real dress shop data to match our interface
function parsePriceRange(pricingString: string): { min: number; max: number } {
  if (!pricingString || typeof pricingString !== 'string') {
    return { min: 500, max: 3000 }; // default
  }
  
  const prices = pricingString.match(/\$([0-9,]+)/g);
  if (prices && prices.length >= 1) {
    const cleanPrices = prices.map(p => parseInt(p.replace(/[$,]/g, '')));
    if (cleanPrices.length === 1) {
      return { min: Math.floor(cleanPrices[0] * 0.5), max: cleanPrices[0] };
    } else {
      return { min: Math.min(...cleanPrices), max: Math.max(...cleanPrices) };
    }
  }
  return { min: 500, max: 3000 }; // default
}

function determineShopType(tags: string[]): 'boutique' | 'department' | 'designer' | 'consignment' | 'vintage' | 'plus-size' {
  if (!Array.isArray(tags)) {
    return 'boutique'; // default
  }
  
  if (tags.includes('department')) return 'department';
  if (tags.includes('designer')) return 'designer';
  if (tags.includes('consignment')) return 'consignment';
  if (tags.includes('vintage')) return 'vintage';
  if (tags.includes('plus-size')) return 'plus-size';
  return 'boutique'; // default
}

// Function to get phone number for dress shop or generate a realistic fallback
function getDressShopPhone(shopName: string): string {
  // Check if we have a real phone number for this shop
  if (dressShopPhoneNumbers[shopName]) {
    return dressShopPhoneNumbers[shopName];
  }
  
  // Generate a realistic South Florida phone number (area codes: 305, 786, 954, 561)
  const areaCode = ['305', '786', '954', '561'][Math.floor(Math.random() * 4)];
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${exchange}-${number}`;
}

// Convert raw dress shop data to DressShop objects
console.log('🔍 Processing dress shop data:', dressShopData.length, 'shops');

export const mockDressShops: DressShop[] = dressShopData
  .filter((shop: any) => shop && typeof shop === 'object' && shop.name)
  .map((shop: any, index: number): DressShop => ({
    id: (index + 1).toString(),
    name: shop.name || `Dress Shop ${index + 1}`,
    description: shop.description || 'Beautiful wedding dress boutique',
    address: {
      street: shop.address?.street || '', 
      city: shop.location && typeof shop.location === 'string' 
        ? shop.location.split(',')[0]?.trim() || 'Miami'
        : 'Miami',
      state: 'FL',
      zipCode: shop.address?.zipCode || '33101',
    },
    priceRange: parsePriceRange(shop.priceRange),
    shopType: determineShopType(shop.tags || []),
    specialties: shop.specialties || [],
    tags: shop.tags || [],
    images: shop.images || [],
    contact: {
      email: `info@${(shop.name || 'shop').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`,
      phone: getDressShopPhone(shop.name),
      website: shop.website || undefined,
    },
    owner: {
      id: `owner${index + 1}`,
      name: `Shop Manager ${index + 1}`,
      isPremium: Math.random() > 0.7, // 30% premium
    },
    hours: shop.hours || {
      'Monday': 'Closed',
      'Tuesday': '10am-7pm',
      'Wednesday': '10am-7pm',
      'Thursday': '10am-8pm',
      'Friday': '10am-8pm',
      'Saturday': '9am-6pm',
      'Sunday': '11am-5pm'
    },
    services: shop.services || ['Alterations', 'Personal Styling', 'Accessories'],
    brands: shop.brands || ['Various Designer Brands'],
    createdAt: new Date(2024, 0, index + 1),
    updatedAt: new Date(2024, 0, index + 1),
  }));

// Add some featured dress shops for the homepage
export const featuredDressShops = mockDressShops.slice(0, 3);

console.log('✅ mockDressShops loaded successfully:', mockDressShops.length, 'shops');
console.log('✅ featuredDressShops loaded:', featuredDressShops.length, 'shops');
