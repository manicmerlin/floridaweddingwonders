export default function SimpleHomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-4xl mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-purple-600 mb-4">
            Florida Wedding Wonders
          </h1>
          <p className="text-2xl text-gray-600">
            Your Dream Wedding Awaits in South Florida
          </p>
        </div>

        {/* Coming Soon Content */}
        <div className="bg-purple-50 rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-purple-800 mb-4">
            🌴 Coming Soon 🌴
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            We're building something beautiful for you! Florida Wedding Wonders will be your one-stop destination for discovering the perfect wedding venues across South Florida.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-bold text-purple-600 mb-2">🏖️ Stunning Venues</h3>
              <p className="text-gray-600">From beachfront resorts to elegant ballrooms</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-bold text-purple-600 mb-2">📸 Photo Galleries</h3>
              <p className="text-gray-600">Browse beautiful venue photos and inspiration</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-bold text-purple-600 mb-2">💍 Complete Directory</h3>
              <p className="text-gray-600">Vendors, planners, and everything you need</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Want to be notified when we launch?
          </p>
          <div className="bg-purple-600 text-white px-8 py-3 rounded-lg inline-block">
            <strong>Stay tuned for our grand opening!</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
