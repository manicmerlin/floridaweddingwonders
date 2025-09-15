'use client';

import React from 'react';
import { pricingPackages, getPackageColors, PricingPackage } from '@/lib/pricing';

interface PricingCardProps {
  package: PricingPackage;
  isRecommended?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ package: pkg, isRecommended = false }) => {
  const colors = getPackageColors(pkg.color);
  
  return (
    <div className={`
      relative p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl
      ${isRecommended ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100' : 'border-gray-200 bg-white'}
    `}>
      {isRecommended && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold">
            ⭐ Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{pkg.emoji}</div>
        <h3 className="text-2xl font-bold mb-1" style={{ color: colors.primary }}>
          {pkg.name}
        </h3>
        <p className="text-gray-600 text-lg">"{pkg.subtitle}"</p>
        <div className="mt-4">
          <span className="text-3xl font-bold" style={{ color: colors.text }}>
            {pkg.price}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">Outcome:</h4>
        <p className="text-gray-700 leading-relaxed">{pkg.outcome}</p>
      </div>

      <div className="mb-8">
        <h4 className="font-semibold text-gray-800 mb-3">Features:</h4>
        <ul className="space-y-3">
          {pkg.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span className="text-green-500 mr-3 mt-1">✓</span>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.light }}>
        <p className="text-sm font-medium" style={{ color: colors.text }}>
          👉 {pkg.value}
        </p>
      </div>

      <button 
        className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90"
        style={{ backgroundColor: colors.primary }}
      >
        {pkg.ctaText}
      </button>
    </div>
  );
};

const PricingSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Package
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From getting discovered to looking like a pro, we have the right solution for every venue.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPackages.map((pkg, index) => (
            <PricingCard 
              key={pkg.id} 
              package={pkg} 
              isRecommended={pkg.id === 'growth'}
            />
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🎯 Not Sure Which Package to Choose?
            </h3>
            <p className="text-gray-700 text-lg mb-6">
              Start with <strong>Starter (Free)</strong> to get online immediately, then upgrade to <strong>Growth</strong> when you want leads. 
              Ready to go all-in? <strong>Scale</strong> gives you pro media + lifetime exposure for what you'd pay a photographer alone.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/contact" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Get Expert Advice
              </a>
              <a href="/venues" className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-3 rounded-lg font-semibold transition-colors">
                See Examples
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
