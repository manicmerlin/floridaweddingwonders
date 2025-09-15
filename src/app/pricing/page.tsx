import PricingSection from '@/components/PricingSection';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Plans - Florida Wedding Wonders',
  description: 'Choose the perfect package for your wedding venue. From free listings to pro media shoots, we have plans that scale with your business.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Wedding Venue Packages
          </h1>
          <p className="text-xl md:text-2xl text-purple-100 leading-relaxed">
            Get discovered, get leads, or get the full pro treatment. 
            <br />
            Plans that grow with your business.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-gray-700">
                Absolutely! You can upgrade to Growth or Scale anytime. Downgrades happen at your next billing cycle. 
                Scale package is lifetime, so no worries about renewals.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                What's included in the pro photo/video shoot?
              </h3>
              <p className="text-gray-700">
                Scale package includes a full-day professional photoshoot with drone footage, interior/exterior shots, 
                detail photos, and a 2-3 minute promotional video. Delivered within 2 weeks, all edited and ready to use.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                How does the lead capture work?
              </h3>
              <p className="text-gray-700">
                Growth and Scale packages get a "Request Info" button that sends inquiries directly to your email. 
                You also get access to a dashboard showing all leads, their details, and response tracking.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Is there a setup fee?
              </h3>
              <p className="text-gray-700">
                No setup fees for any package! Starter is completely free forever. Growth is $250/year. 
                Scale is $2,500 one-time payment for lifetime access.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                What makes Florida Wedding Wonders different?
              </h3>
              <p className="text-gray-700">
                We're Florida-focused, so couples searching here are local. Our Growth package pays for itself with one booking. 
                Our Scale package gives you pro media + lifetime exposure for what you'd pay a photographer alone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join hundreds of Florida venues already growing their business with us.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="/register" 
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Free Today
            </a>
            <a 
              href="/contact" 
              className="border-2 border-white text-white hover:bg-white hover:text-purple-600 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Questions? Contact Us
            </a>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
