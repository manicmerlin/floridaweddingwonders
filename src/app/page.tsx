'use client';

import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-6">
        <div className="relative z-10 text-center max-w-6xl mx-auto">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex justify-center mb-8">
              <Image 
                src="/images/logo.png" 
                alt="Florida Wedding Wonders" 
                width={150} 
                height={150}
                className="drop-shadow-lg"
              />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-8">
            Florida Wedding Wonders
          </h1>
          <p className="text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
            Discover stunning wedding venues, trusted vendors, and beautiful bridal shops across the Sunshine State.
          </p>
          
          {/* Main Navigation Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <a 
              href="/venues" 
              className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white p-8 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-white/20"
            >
              <div className="text-5xl mb-4">🏛️</div>
              <div className="text-2xl mb-3 group-hover:text-purple-200 transition-colors">Wedding Venues</div>
              <div className="text-sm text-gray-300 leading-relaxed">From beachfront ceremonies to elegant ballrooms, discover Florida's most breathtaking wedding venues.</div>
            </a>
            
            <a 
              href="/vendors" 
              className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white p-8 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-white/20"
            >
              <div className="text-5xl mb-4">🎯</div>
              <div className="text-2xl mb-3 group-hover:text-pink-200 transition-colors">Wedding Vendors</div>
              <div className="text-sm text-gray-300 leading-relaxed">Connect with trusted photographers, caterers, florists, and all the professionals you need for your perfect day.</div>
            </a>
            
            <a 
              href="/dress-shops" 
              className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white p-8 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-white/20"
            >
              <div className="text-5xl mb-4">👗</div>
              <div className="text-2xl mb-3 group-hover:text-rose-200 transition-colors">Bridal Shops</div>
              <div className="text-sm text-gray-300 leading-relaxed">Browse stunning bridal collections from Florida's premier dress shops and find your dream gown.</div>
            </a>
          </div>

          {/* Stats Section */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">130+</div>
                <div className="text-gray-300 font-medium">Premium Venues</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">50+</div>
                <div className="text-gray-300 font-medium">Trusted Vendors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">31+</div>
                <div className="text-gray-300 font-medium">Bridal Shops</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">5★</div>
                <div className="text-gray-300 font-medium">Quality Service</div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-8 mb-16">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Plan Your Dream Wedding?</h3>
            <p className="text-gray-300 mb-6">Start exploring Florida's most beautiful venues and connect with trusted wedding professionals.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/venues" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                Explore Venues 🏛️
              </a>
              <a 
                href="/venue-packages" 
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                List Your Venue 💼
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900/50 backdrop-blur-sm text-white py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Image 
                  src="/images/logo.png" 
                  alt="Florida Wedding Wonders" 
                  width={40} 
                  height={40}
                  className="mr-3"
                />
                <span className="text-xl font-bold">Florida Wedding Wonders</span>
              </div>
              <p className="text-gray-400">
                Creating unforgettable moments in the Sunshine State.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/venues" className="hover:text-white transition-colors">Wedding Venues</a></li>
                <li><a href="/vendors" className="hover:text-white transition-colors">Wedding Vendors</a></li>
                <li><a href="/dress-shops" className="hover:text-white transition-colors">Bridal Shops</a></li>
                <li><a href="/venue-packages" className="hover:text-white transition-colors">List Your Venue</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-400">
                <p>📧 hello@floridaweddingwonders.com</p>
                <p>📱 (555) 123-4567</p>
                <p>📍 South Florida</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 Florida Wedding Wonders. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
