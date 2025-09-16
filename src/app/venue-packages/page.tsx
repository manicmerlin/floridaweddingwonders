'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import PricingSection from '@/components/PricingSection';

export default function VenuePackagesPage() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    venueName: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    // Scroll to contact form
    document.getElementById('contact-form')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here we'll integrate with Stripe and email system
      const response = await fetch('/api/venue-package-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactForm,
          selectedPackage,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        alert('Thank you! We\'ll contact you within 24 hours to set up your package.');
        setContactForm({ name: '', email: '', venueName: '', phone: '', message: '' });
        setSelectedPackage(null);
      } else {
        alert('Something went wrong. Please try again or call us directly.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Something went wrong. Please try again or call us directly.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center">
            <Image 
              src="/images/logo.png" 
              alt="Florida Wedding Wonders" 
              width={40} 
              height={40}
              className="mr-3"
            />
            <span className="text-xl font-bold text-gray-800">Florida Wedding Wonders</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-500 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">
            🏛️ Venue Owner Success Packages
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Join Florida's premier wedding venue directory and start booking more weddings. 
            Choose the package that fits your goals and budget.
          </p>
          <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
            <span className="text-lg font-semibold">🎁 Early Bird Special: FREE Premium Year for First 50 Venues!</span>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <PricingSection onPackageSelect={handlePackageSelect} />
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              🚀 Ready to Get Started?
            </h2>
            {selectedPackage && (
              <div className="inline-flex items-center bg-purple-100 text-purple-800 px-6 py-3 rounded-full font-semibold">
                You selected: <span className="ml-2 capitalize">{selectedPackage}</span> Package
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={contactForm.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="John Smith"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    name="venueName"
                    value={contactForm.venueName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Beautiful Garden Venue"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="john@beautifulgarden.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us about your venue (Optional)
                </label>
                <textarea
                  name="message"
                  value={contactForm.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tell us about your venue, capacity, unique features, or any questions you have..."
                />
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Get Started Today! 🚀'}
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  We'll contact you within 24 hours to set up your package and get you started.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                💰 When do I pay for my package?
              </h3>
              <p className="text-gray-600">
                For Growth ($250/yr): We'll set up a simple monthly payment plan ($25/month). 
                For Scale ($2,500): 50% upfront, 50% when your professional photos are delivered.
                Starter is completely free, no payment required.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                📸 How does the professional photo shoot work?
              </h3>
              <p className="text-gray-600">
                For Scale package customers, we'll schedule a professional photographer and drone operator 
                to capture your venue's best features. Typically takes 2-3 hours and includes 50+ edited photos 
                plus a 2-minute video highlight reel.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                📈 How quickly will I see results?
              </h3>
              <p className="text-gray-600">
                Most venues see their first inquiries within 2-4 weeks of going live. 
                Growth package customers typically book 1-3 additional weddings within their first 6 months, 
                easily covering the annual cost.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🔄 Can I upgrade or downgrade later?
              </h3>
              <p className="text-gray-600">
                Absolutely! Start with Starter or Growth, then upgrade to Scale anytime. 
                Scale customers get lifetime Growth benefits, so there's no downgrading needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-6">
            <Image 
              src="/images/logo.png" 
              alt="Florida Wedding Wonders" 
              width={40} 
              height={40}
              className="mr-3"
            />
            <span className="text-xl font-bold">Florida Wedding Wonders</span>
          </div>
          <p className="text-gray-400 mb-4">
            Helping Florida venues connect with couples since 2025
          </p>
          <div className="space-x-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              Home
            </Link>
            <a href="mailto:hello@floridaweddingwonders.com" className="text-gray-400 hover:text-white transition-colors">
              Contact
            </a>
            <a href="tel:+15551234567" className="text-gray-400 hover:text-white transition-colors">
              (555) 123-4567
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
