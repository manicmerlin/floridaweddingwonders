'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [venueName, setVenueName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isVenueOwner, setIsVenueOwner] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Save to database
      const { data, error } = await supabase
        .from('email_subscribers')
        .insert([
          {
            email: email,
            venue_name: isVenueOwner ? venueName : null,
            is_venue_owner: isVenueOwner
          }
        ]);

      if (error) {
        console.error('Error saving email:', error);
        alert('There was an error saving your email. Please try again.');
        return;
      }

      console.log('Email saved successfully:', data);

      // Send email notifications (admin notification + user welcome)
      try {
        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            venueName: venueName,
            isVenueOwner: isVenueOwner
          }),
        });

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          console.log('Email notifications sent:', emailResult);
        } else {
          console.warn('Email notifications failed, but registration saved');
        }
      } catch (emailError) {
        console.warn('Email service error:', emailError);
        // Don't block the user experience if emails fail
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('There was an unexpected error. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-pink-100">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              {isVenueOwner 
                ? "We've received your venue registration and will contact you soon about your free premium year!"
                : "You're now on our VIP list! We'll notify you as soon as we launch."
              }
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setEmail('');
                setVenueName('');
                setIsVenueOwner(false);
              }}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Submit another email →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-yellow-800" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold font-heading text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Florida Wedding Wonders
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Florida's most comprehensive wedding venue directory is coming soon
            </p>
            
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full inline-block font-semibold shadow-lg">
              Launching Soon • 130+ Premium Venues
            </div>
          </div>
        </div>
      </div>

      {/* Special Offer Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-100">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
              🎉 Founding Partner Program - Limited Time!
            </h2>
          </div>
          
          <div className="px-8 py-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                First 10 Venues Get Our Scale Package FREE!
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Claim your lifetime Scale package worth $2,500 at no cost. 
                Includes pro photo shoot, drone video, and permanent exposure.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Pro Photo + Drone Video</h4>
                  <p className="text-sm text-gray-600">Full professional media shoot included ($1,500+ value)</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Lifetime Membership</h4>
                  <p className="text-sm text-gray-600">Never pay again - permanent exposure</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Founding Partner Badge</h4>
                  <p className="text-sm text-gray-600">Exclusive recognition + homepage rotation</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto" id="signup">
              <div className="mb-4">
                <label className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    checked={isVenueOwner}
                    onChange={(e) => setIsVenueOwner(e.target.checked)}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-gray-700 font-medium">I own/manage a wedding venue in Florida</span>
                </label>
              </div>

              {isVenueOwner && (
                <div className="mb-4">
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Your venue name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              <div className="mb-6">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>{isVenueOwner ? 'Claim My Free Scale Package' : 'Get Early Access'}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What's Coming</h2>
          <p className="text-lg text-gray-600">A complete wedding planning ecosystem for Florida couples</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">130+ Curated Venues</h3>
            <p className="text-gray-600">From beachfront resorts to historic estates, discover Florida's most beautiful wedding venues.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Matching</h3>
            <p className="text-gray-600">Advanced filters for budget, guest count, style, and location to find your perfect venue.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Vendor Directory</h3>
            <p className="text-gray-600">Complete marketplace for photographers, planners, florists, and all your wedding needs.</p>
          </div>
        </div>
      </div>

      {/* Pricing Preview */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing for Venues
            </h2>
            <p className="text-xl text-gray-600">
              Choose the package that fits your business goals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Package */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🟢</div>
                <h3 className="text-2xl font-bold text-green-600 mb-1">Starter</h3>
                <p className="text-gray-600 text-lg">"Get Listed"</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-green-700">Free</span>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">Exist online so couples can find you.</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Appear in search results</li>
                  <li>• 2 photos, 1 short blurb</li>
                  <li>• One contact method</li>
                  <li>• Basic tags (3 max)</li>
                </ul>
              </div>
              <div className="bg-green-50 p-3 rounded-lg mb-6">
                <p className="text-xs text-green-700">👉 Good for visibility, bad for standing out.</p>
              </div>
            </div>

            {/* Growth Package */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-400 hover:shadow-xl transition-all relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold">Most Popular</span>
              </div>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🔵</div>
                <h3 className="text-2xl font-bold text-blue-600 mb-1">Growth</h3>
                <p className="text-gray-600 text-lg">"Get Leads"</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-blue-700">$250/yr</span>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">Look credible, get inquiries, start booking weddings.</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Unlimited photos + 1 video</li>
                  <li>• Full description + unlimited tags</li>
                  <li>• "Request Info" button → capture leads</li>
                  <li>• Upload menus, floorplans, packages</li>
                  <li>• Featured placement + analytics</li>
                  <li>• Social links + special offers unlocked</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg mb-6">
                <p className="text-xs text-blue-700">👉 One booking covers the cost, everything else is profit.</p>
              </div>
            </div>

            {/* Scale Package */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-400 hover:shadow-xl transition-all">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🟣</div>
                <h3 className="text-2xl font-bold text-purple-600 mb-1">Scale</h3>
                <p className="text-gray-600 text-lg">"Look Pro, Pay Once"</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-purple-700">$2,500 lifetime</span>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">Pro media + permanent exposure.</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Pro photo + drone video shoot</li>
                  <li>• Lifetime Growth membership (never pay again)</li>
                  <li>• Founding Partner badge</li>
                  <li>• Featured in our marketing + homepage rotation</li>
                </ul>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg mb-6">
                <p className="text-xs text-purple-700">👉 You'd pay this much for media alone. We give you media + forever exposure.</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 mb-6">
              Not sure which package? Start free, upgrade when ready!
            </p>
            <a 
              href="#signup" 
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Get Started Today
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Florida Wedding Wonders</h3>
          <p className="text-gray-400 mb-6">Coming Soon • Follow our journey</p>
          <p className="text-sm text-gray-500">© 2025 Florida Wedding Wonders. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
