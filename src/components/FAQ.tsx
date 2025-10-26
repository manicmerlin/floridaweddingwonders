'use client';

import { useState } from 'react';
import { faqData, FAQItem, getAllCategories, getCategoryLabel } from '@/data/faq';

interface FAQProps {
  showCategoryFilter?: boolean;
  defaultLanguage?: 'en' | 'es';
  maxItems?: number;
  category?: FAQItem['category'];
}

export default function FAQ({ 
  showCategoryFilter = true, 
  defaultLanguage = 'en',
  maxItems,
  category 
}: FAQProps) {
  const [language, setLanguage] = useState<'en' | 'es'>(defaultLanguage);
  const [selectedCategory, setSelectedCategory] = useState<FAQItem['category'] | 'all'>('all');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  // Filter FAQs
  let filteredFAQs = category 
    ? faqData.filter(faq => faq.category === category)
    : selectedCategory === 'all' 
      ? faqData 
      : faqData.filter(faq => faq.category === selectedCategory);

  // Limit items if maxItems is specified
  if (maxItems) {
    filteredFAQs = filteredFAQs.slice(0, maxItems);
  }

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const categories = getAllCategories();

  return (
    <div className="w-full">
      {/* Header with Language Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
          {language === 'en' ? 'Frequently Asked Questions' : 'Preguntas Frecuentes'}
        </h2>
        
        {/* Language Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              language === 'en'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('es')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              language === 'es'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Español
          </button>
        </div>
      </div>

      {/* Category Filter */}
      {showCategoryFilter && !category && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {language === 'en' ? 'All Questions' : 'Todas las Preguntas'}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCategoryLabel(cat, language)}
            </button>
          ))}
        </div>
      )}

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQs.map((faq) => (
          <details
            key={faq.id}
            className="group bg-white rounded-lg border border-gray-200 hover:border-pink-300 transition-all duration-200 overflow-hidden"
            open={openItems.has(faq.id)}
            onToggle={(e) => {
              const details = e.target as HTMLDetailsElement;
              if (details.open) {
                const newOpenItems = new Set(openItems);
                newOpenItems.add(faq.id);
                setOpenItems(newOpenItems);
              } else {
                const newOpenItems = new Set(openItems);
                newOpenItems.delete(faq.id);
                setOpenItems(newOpenItems);
              }
            }}
          >
            <summary 
              className="flex items-center justify-between w-full px-6 py-4 cursor-pointer list-none select-none"
              onClick={(e) => {
                e.preventDefault();
                toggleItem(faq.id);
              }}
            >
              <span className="text-lg font-semibold text-gray-900 pr-8 flex-1">
                {faq.question[language]}
              </span>
              <svg
                className={`w-5 h-5 text-pink-600 flex-shrink-0 transition-transform duration-200 ${
                  openItems.has(faq.id) ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            
            <div 
              className={`px-6 pb-4 text-gray-700 leading-relaxed transition-all duration-200 ${
                openItems.has(faq.id) ? 'opacity-100' : 'opacity-0 max-h-0'
              }`}
            >
              <div className="pt-2 border-t border-gray-100">
                {faq.answer[language]}
              </div>
            </div>
          </details>
        ))}
      </div>

      {/* No Results */}
      {filteredFAQs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🤔</div>
          <p className="text-gray-600 text-lg">
            {language === 'en' 
              ? 'No questions found in this category.' 
              : 'No se encontraron preguntas en esta categoría.'}
          </p>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {language === 'en' ? 'Still have questions?' : '¿Todavía tienes preguntas?'}
            </h3>
            <p className="text-gray-600 text-sm">
              {language === 'en' 
                ? 'Browse our venue listings or contact us for personalized assistance.' 
                : 'Explore nuestros listados de lugares o contáctenos para asistencia personalizada.'}
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/venues"
              className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              {language === 'en' ? 'Browse Venues' : 'Explorar Lugares'}
            </a>
            <a
              href="#contact"
              className="px-6 py-2.5 bg-white hover:bg-gray-50 text-pink-600 font-medium rounded-lg border border-pink-200 transition-colors whitespace-nowrap"
            >
              {language === 'en' ? 'Contact Us' : 'Contáctenos'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
