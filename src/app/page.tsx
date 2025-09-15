'use client';

import Image from 'next/image';
import { useState } from 'react';
import PricingSection from '@/components/PricingSection';

export default function ComingSoonPage() {
  const [emailData, setEmailData] = useState({
    email: '',
    userType: 'regular_user' as 'regular_user' | 'venue_owner',
    venueName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: emailData.userType,
          email: emailData.email,
          venueName: emailData.venueName
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setEmailData({ email: '', userType: 'regular_user', venueName: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Email submission error:', error);
      setSubmitStatus('error');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Mjg1RjQiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAweiIvPjwvZz48L2c+PC9zdmc+')] bg-repeat"></div>
        </div>
        
        {/* Main Content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center justify-center mb-6">
              <Image 
                src="/images/logo.png" 
                alt="Florida Wedding Wonders" 
                width={80} 
                height={80}
                className="mr-4"
              />
              <div className="text-left">
                <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 bg-clip-text text-transparent leading-tight">
                  Florida Wedding Wonders
                </h1>
                <p className="text-xl lg:text-2xl text-gray-600 mt-2">
                  Your Dream Wedding Awaits in South Florida
                </p>
              </div>
            </div>
          </div>

          {/* Coming Soon Banner */}
          <div className="mb-12">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full border border-purple-200 mb-6">
              <span className="text-2xl mr-3">🌴</span>
              <span className="text-lg font-semibold text-purple-800">Coming Soon</span>
              <span className="text-2xl ml-3">🌴</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-6">
              We're Building Something Beautiful
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Florida Wedding Wonders will be your ultimate destination for discovering the most stunning wedding venues across the Sunshine State. From beachfront ceremonies to elegant ballrooms, we're curating the perfect collection for your special day.
            </p>
          </div>

          {/* Email Signup Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 mb-16 border border-white/50 shadow-xl max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              🎯 Get Early Access & Exclusive Benefits
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    I am a:
                  </label>
                  <select
                    name="userType"
                    value={emailData.userType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="regular_user">Future Bride/Groom</option>
                    <option value="venue_owner">Venue Owner</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={emailData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {emailData.userType === 'venue_owner' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    name="venueName"
                    value={emailData.venueName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your venue name"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : emailData.userType === 'venue_owner' ? 'Get Your Free Premium Year!' : 'Notify Me When We Launch!'}
              </button>

              {submitStatus === 'success' && (
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    🎉 Success! Check your email for next steps.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">
                    ❌ Something went wrong. Please try again.
                  </p>
                </div>
              )}
            </form>

            {emailData.userType === 'venue_owner' && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <p className="text-purple-800 font-medium text-center">
                  🎁 <strong>Early Bird Special:</strong> Venue owners who sign up now get a FREE Premium year (normally $250)!
                </p>
              </div>
            )}
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">🏖️</div>
              <h3 className="text-xl font-bold text-purple-700 mb-3">Stunning Venues</h3>
              <p className="text-gray-600">From oceanfront resorts to historic estates, discover Florida's most breathtaking wedding venues.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-xl font-bold text-pink-700 mb-3">Photo Galleries</h3>
              <p className="text-gray-600">Browse stunning venue photography and get inspired for your perfect wedding day.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">💍</div>
              <h3 className="text-xl font-bold text-rose-700 mb-3">Complete Directory</h3>
              <p className="text-gray-600">Connect with trusted vendors, planners, and everything you need for your dream wedding.</p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 mb-16 border border-white/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">130+</div>
                <div className="text-gray-600 font-medium">Premium Venues</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">50+</div>
                <div className="text-gray-600 font-medium">Trusted Vendors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent mb-2">1000+</div>
                <div className="text-gray-600 font-medium">Happy Couples</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">5★</div>
                <div className="text-gray-600 font-medium">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Venue Owner Pricing Section */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              🏛️ For Venue Owners: Choose Your Success Package
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join Florida's premier wedding venue directory and start booking more weddings
            </p>
          </div>
          
          <PricingSection />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-12">
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
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
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
  )
}
