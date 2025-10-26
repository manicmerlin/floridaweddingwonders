'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import FAQ from '@/components/FAQ';
import SEO from '@/components/SEO';
import { generateFAQSchema } from '@/lib/seo';
import { faqData } from '@/data/faq';

export default function FAQPage() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  // Generate FAQ schema for structured data (use English version for schema)
  const faqSchema = generateFAQSchema(
    faqData.map(faq => ({
      question: faq.question.en,
      answer: faq.answer.en,
    }))
  );

  return (
    <>
      <SEO
        title="Frequently Asked Questions - Florida Wedding Planning Guide"
        description="Get answers to common questions about booking wedding venues in Florida, pricing, timing, beach permits, weather considerations, and vendor requirements. Expert advice for planning your perfect Florida wedding."
        canonical="https://floridaweddingwonders.com/faq"
        path="/faq"
        keywords={[
          'Florida wedding FAQ',
          'wedding venue questions',
          'Florida wedding planning',
          'book wedding venue Florida',
          'wedding venue cost Florida',
          'beach wedding permit Florida',
          'Florida wedding season',
          'wedding insurance Florida',
        ]}
        jsonLd={[faqSchema]}
      />
      
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              {language === 'en' 
                ? 'Wedding Planning Questions?' 
                : '¿Preguntas sobre Planificación de Bodas?'}
            </h1>
            <p className="text-xl lg:text-2xl text-pink-100 max-w-3xl mx-auto leading-relaxed">
              {language === 'en'
                ? 'Everything you need to know about planning your Florida wedding—from booking venues to beach permits, pricing, and timing.'
                : 'Todo lo que necesita saber sobre la planificación de su boda en Florida: desde la reserva de lugares hasta permisos de playa, precios y horarios.'}
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold mb-1">12</div>
                <div className="text-sm text-pink-100">
                  {language === 'en' ? 'Topics Covered' : 'Temas Cubiertos'}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold mb-1">130+</div>
                <div className="text-sm text-pink-100">
                  {language === 'en' ? 'Venues Listed' : 'Lugares Listados'}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold mb-1">2</div>
                <div className="text-sm text-pink-100">
                  {language === 'en' ? 'Languages' : 'Idiomas'}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold mb-1">100%</div>
                <div className="text-sm text-pink-100">
                  {language === 'en' ? 'Free Help' : 'Ayuda Gratis'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <FAQ 
              showCategoryFilter={true} 
              defaultLanguage={language}
            />
          </div>
        </section>

        {/* Additional Resources */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              {language === 'en' ? 'Explore More Resources' : 'Explore Más Recursos'}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Venues */}
              <a 
                href="/venues"
                className="group bg-gradient-to-br from-pink-50 to-purple-50 p-8 rounded-xl border border-pink-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-5xl mb-4">🏛️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                  {language === 'en' ? 'Browse Venues' : 'Explorar Lugares'}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {language === 'en'
                    ? 'Discover 130+ stunning wedding venues across Florida, from beachfront to ballrooms.'
                    : 'Descubra más de 130 impresionantes lugares para bodas en Florida, desde frente al mar hasta salones de baile.'}
                </p>
              </a>

              {/* Vendors */}
              <a 
                href="/vendors"
                className="group bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {language === 'en' ? 'Find Vendors' : 'Encontrar Proveedores'}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {language === 'en'
                    ? 'Connect with trusted photographers, caterers, florists, and more for your big day.'
                    : 'Conéctese con fotógrafos, caterers, floristas de confianza y más para su gran día.'}
                </p>
              </a>

              {/* Dress Shops */}
              <a 
                href="/dress-shops"
                className="group bg-gradient-to-br from-rose-50 to-pink-50 p-8 rounded-xl border border-rose-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-5xl mb-4">👗</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-rose-600 transition-colors">
                  {language === 'en' ? 'Bridal Shops' : 'Tiendas Nupciales'}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {language === 'en'
                    ? 'Find your dream wedding dress from Florida\'s premier bridal boutiques and designers.'
                    : 'Encuentre el vestido de novia de sus sueños en las boutiques y diseñadores nupciales premier de Florida.'}
                </p>
              </a>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              {language === 'en' 
                ? 'Need Personalized Help?' 
                : '¿Necesita Ayuda Personalizada?'}
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              {language === 'en'
                ? 'Our team is here to help you find the perfect venue and plan your dream Florida wedding.'
                : 'Nuestro equipo está aquí para ayudarle a encontrar el lugar perfecto y planificar la boda de sus sueños en Florida.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:info@floridaweddingwonders.com"
                className="px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition-colors"
              >
                {language === 'en' ? 'Email Us' : 'Envíenos un Correo'}
              </a>
              <a
                href="/venues"
                className="px-8 py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg transition-colors"
              >
                {language === 'en' ? 'Start Browsing' : 'Comenzar a Explorar'}
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
