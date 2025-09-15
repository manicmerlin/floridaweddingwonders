import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-pink-400">Florida Wedding Wonders</h3>
            <p className="text-gray-400">Your trusted partner in finding the perfect South Florida wedding venue.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">For Couples</h4>
            <div className="space-y-2 text-gray-400">
              <Link href="/venues" className="block hover:text-white transition">
                Browse Venues
              </Link>
              <Link href="/dress-shops" className="block hover:text-white transition">
                Wedding Dresses
              </Link>
              <Link href="/vendors" className="block hover:text-white transition">
                Wedding Vendors
              </Link>
              <Link href="/contact" className="block hover:text-white transition">
                Planning Tools
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">For Venues</h4>
            <div className="space-y-2 text-gray-400">
              <Link href="/venue-owner" className="block hover:text-white transition">
                List Your Venue
              </Link>
              <Link href="/vendor-owner" className="block hover:text-white transition">
                Vendor Signup
              </Link>
              <Link href="/admin" className="block hover:text-white transition">
                Business Portal
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <div className="space-y-2 text-gray-400">
              <Link href="/contact" className="block hover:text-white transition">
                Contact Us
              </Link>
              <div className="hover:text-white transition cursor-pointer">About Us</div>
              <div className="hover:text-white transition cursor-pointer">Privacy Policy</div>
              <div className="hover:text-white transition cursor-pointer">Terms of Service</div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Florida Wedding Wonders. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
