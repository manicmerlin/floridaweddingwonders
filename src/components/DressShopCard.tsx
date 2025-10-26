'use client';

import { DressShop } from '../types';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface DressShopCardProps {
  shop: DressShop;
  showFavorites?: boolean;
}

// Function to get color scheme based on shop type
const getShopColors = (shopType: string) => {
  const colorSchemes = {
    boutique: 'from-pink-400 to-rose-400',
    department: 'from-blue-400 to-indigo-400', 
    designer: 'from-purple-400 to-violet-400',
    consignment: 'from-green-400 to-emerald-400',
    vintage: 'from-amber-400 to-orange-400',
    'plus-size': 'from-teal-400 to-cyan-400',
  };
  
  return colorSchemes[shopType as keyof typeof colorSchemes] || 'from-pink-400 to-purple-400';
};

export default function DressShopCard({ shop, showFavorites = false }: DressShopCardProps) {
  const [user, setUser] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const gradientColors = getShopColors(shop.shopType);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Check if shop is in favorites
      if (parsedUser.role === 'guest') {
        const favorites = JSON.parse(localStorage.getItem(`shop-favorites-${parsedUser.id}`) || '[]');
        setIsFavorite(favorites.includes(shop.id));
      }
    }
  }, [shop.id]);

  const toggleFavorite = () => {
    if (!user || user.role !== 'guest') return;
    
    const favorites = JSON.parse(localStorage.getItem(`shop-favorites-${user.id}`) || '[]');
    const newFavorites = isFavorite 
      ? favorites.filter((id: string) => id !== shop.id)
      : [...favorites, shop.id];
    
    localStorage.setItem(`shop-favorites-${user.id}`, JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };
  
  // Get the primary image or fall back to first image
  const primaryImage = shop.images?.find(img => img.isPrimary) || shop.images?.[0];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-48 overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={`${shop.name} - ${shop.shopType} bridal shop in Florida`}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            quality={85}
          />
        ) : (
          // Fallback to gradient if no image available
          <div className={`h-full bg-gradient-to-br ${gradientColors} flex items-center justify-center`} role="img" aria-label={`${shop.name} - ${shop.shopType} bridal shop`}>
            <div className="text-center text-white p-4">
              <div className="text-2xl mb-2" aria-hidden="true">
                {shop.shopType === 'boutique' ? '👗' : 
                 shop.shopType === 'department' ? '🏬' :
                 shop.shopType === 'designer' ? '✨' :
                 shop.shopType === 'consignment' ? '♻️' :
                 shop.shopType === 'vintage' ? '🕰️' : '💖'}
              </div>
              <div className="text-lg font-semibold leading-tight">{shop.name}</div>
            </div>
          </div>
        )}
        
        {/* Image overlay for shop name when image is present */}
        {primaryImage && (
          <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-10 transition-all duration-300">
            <div className="absolute bottom-4 left-4 text-white">
              <div className="text-lg font-semibold leading-tight drop-shadow-lg">{shop.name}</div>
            </div>
          </div>
        )}
        
        {/* Favorite Button - Only show for guests */}
        {showFavorites && user?.role === 'guest' && (
          <button
            onClick={toggleFavorite}
            className="absolute top-2 left-2 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition shadow-sm"
          >
            <svg 
              className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
        
        {shop.owner?.isPremium && (
          <div className="absolute top-2 right-2 bg-pink-600 text-white px-2 py-1 rounded text-xs font-semibold shadow-sm">
            PREMIUM
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{shop.name}</h3>
        <p className="text-gray-600 mb-3 line-clamp-2">{shop.description}</p>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-500">
            {shop.address.city}, {shop.address.state}
          </span>
          <span className="text-lg font-bold text-pink-600">
            ${shop.priceRange.min.toLocaleString()}-${shop.priceRange.max.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm bg-pink-100 text-pink-700 px-2 py-1 rounded capitalize">
            {shop.shopType}
          </span>
          <span className="text-sm text-gray-500">
            {shop.brands.length} Brand{shop.brands.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {shop.specialties.slice(0, 3).map((specialty) => (
            <span
              key={specialty}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
            >
              {specialty}
            </span>
          ))}
          {shop.specialties.length > 3 && (
            <span className="text-xs text-gray-500">
              +{shop.specialties.length - 3} more
            </span>
          )}
        </div>
        
        <Link href={`/dress-shops/${shop.id}`} className="block w-full">
          <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
}
