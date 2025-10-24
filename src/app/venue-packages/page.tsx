'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import PricingSection from '@/components/PricingSection';
import Logo from '@/components/Logo';

export default function VenuePackagesPage() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showEarlyBirdForm, setShowEarlyBirdForm] = useState(false);
  const [earlyBirdForm, setEarlyBirdForm] = useState({
    name: '',
    email: '',
    phone: '',
    venueName: '',
    claimOffer: false
  });
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    venueName: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const EARLY_BIRD_REMAINING = 4; // Update this as venues claim the offer

  const handleEarlyBirdInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEarlyBirdForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEarlyBirdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send email to bennett.boundless@gmail.com
      const emailBody = `
Early Bird Offer Request - Free Premium Year

Name: ${earlyBirdForm.name}
Email: ${earlyBirdForm.email}
Phone: ${earlyBirdForm.phone}
Venue Name: ${earlyBirdForm.venueName}
Claimed Offer: ${earlyBirdForm.claimOffer ? 'Yes' : 'No'}

Submitted: ${new Date().toLocaleString()}
      `;

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'bennett.boundless@gmail.com',
          subject: `🎁 Early Bird Offer Request - ${earlyBirdForm.venueName}`,
          text: emailBody,
          from: earlyBirdForm.email,
          replyTo: earlyBirdForm.email
        }),
      });

      if (response.ok) {
        alert('🎉 Your early bird offer request has been submitted! We\'ll contact you within 24 hours.');
        setEarlyBirdForm({ name: '', email: '', phone: '', venueName: '', claimOffer: false });
        setShowEarlyBirdForm(false);
      } else {
        alert('Something went wrong. Please email us directly at hello@floridaweddingwonders.com');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Something went wrong. Please email us directly at hello@floridaweddingwonders.com');
    }

    setIsSubmitting(false);
  };

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
          <Logo size="md" variant="horizontal" />
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
          
          {/* Early Bird Offer Banner - Clickable */}
          <button
            onClick={() => setShowEarlyBirdForm(true)}
            className="inline-flex items-center bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full px-8 py-4 transition-all hover:scale-105 cursor-pointer group"
          >
            <span className="text-lg font-semibold flex items-center gap-2">
              🎁 Early Bird Special: FREE Premium Year for First 10 Venues! 
              <span className="bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-sm font-bold ml-2">
                {EARLY_BIRD_REMAINING} / 10 Left
              </span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      {/* Early Bird Form Modal */}
      {showEarlyBirdForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">🎁 Claim Your Free Premium Year!</h2>
                  <p className="text-purple-100">Limited to first 10 venues - <span className="font-bold">{EARLY_BIRD_REMAINING} spots remaining</span></p>
                </div>
                <button
                  onClick={() => setShowEarlyBirdForm(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleEarlyBirdSubmit} className="p-8 space-y-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Early Bird Benefit:</strong> Get a FREE year of Premium membership (normally $250/year) - includes priority placement, featured listing, and unlimited photo uploads!
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={earlyBirdForm.name}
                  onChange={handleEarlyBirdInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={earlyBirdForm.email}
                  onChange={handleEarlyBirdInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="john@yourvenue.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={earlyBirdForm.phone}
                  onChange={handleEarlyBirdInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  name="venueName"
                  value={earlyBirdForm.venueName}
                  onChange={handleEarlyBirdInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Beautiful Garden Venue"
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    name="claimOffer"
                    checked={earlyBirdForm.claimOffer}
                    onChange={handleEarlyBirdInputChange}
                    required
                    className="mt-1 h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    <strong className="text-purple-900">Yes, I want to claim the FREE Premium Year offer!</strong>
                    <span className="block mt-1 text-gray-600">
                      ({EARLY_BIRD_REMAINING} out of 10 spots remaining)
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowEarlyBirdForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !earlyBirdForm.claimOffer}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? 'Submitting...' : 'Claim My Free Year! 🎉'}
                </button>
              </div>

              <p className="text-xs text-center text-gray-500">
                We'll contact you within 24 hours to confirm your spot and get you started.
              </p>
            </form>
          </div>
        </div>
      )}

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
            <Logo size="sm" variant="horizontal" showText={false} />
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
