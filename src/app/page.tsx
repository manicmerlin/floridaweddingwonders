import Image from 'next/image';

export default function ComingSoonPage() {
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

          {/* CTA Section */}
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-8">
              Be the first to know when we launch and get exclusive early access to Florida's most sought-after wedding venues.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105">
                Notify Me When We Launch
              </button>
              <button className="bg-white/80 backdrop-blur-sm text-purple-700 px-8 py-4 rounded-full font-semibold text-lg border border-purple-200 hover:bg-white hover:shadow-lg transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-white/90 backdrop-blur-sm border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-600">
            © 2025 Florida Wedding Wonders. Creating unforgettable moments in the Sunshine State.
          </p>
        </div>
      </footer>
    </div>
  )
}
