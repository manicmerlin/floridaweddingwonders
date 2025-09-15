'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginAsVenueOwner, getAvailableVenueOwners } from '@/lib/auth';

export default function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Demo users for development
  const DEMO_USERS = {
    'admin@soflowedding.com': { password: 'soflo2025', role: 'admin', name: 'Admin User' },
    'venue@example.com': { password: 'venue123', role: 'venue_owner', name: 'John Venue Owner' },
    'guest@example.com': { password: 'guest123', role: 'guest', name: 'Sarah Guest' },
    // Super Admin - can edit all venues
    'admin@floridaweddingwonders.com': { password: 'superadmin2025', role: 'super_admin', name: 'Super Admin', venueId: 'all' },
    // Venue owner demo accounts
    'manager@curtissmansion.com': { password: 'curtiss123', role: 'venue_owner', name: 'Curtiss Manager', venueId: '11' },
    'owner@hialeahpark.com': { password: 'hialeah123', role: 'venue_owner', name: 'Hialeah Owner', venueId: '1' }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check demo users
    const user = DEMO_USERS[credentials.email as keyof typeof DEMO_USERS];
    
    if (user && user.password === credentials.password) {
      // Set authentication
      const userData = {
        id: Math.random().toString(36).substr(2, 9),
        email: credentials.email,
        name: user.name,
        role: user.role,
        isAuthenticated: true
      };

      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set appropriate cookie based on role
      if (user.role === 'admin') {
        document.cookie = 'admin-auth=authenticated; path=/; max-age=86400'; // 24 hours
        router.push('/admin');
      } else if (user.role === 'super_admin') {
        // Super admin - can manage all venues
        const loginSuccess = loginAsVenueOwner(credentials.email, 'all');
        if (loginSuccess) {
          router.push('/venues'); // Show all venues, can manage any
        } else {
          setError('Failed to authenticate super admin');
          setIsLoading(false);
          return;
        }
      } else if (user.role === 'venue_owner') {
        // Check if this is a venue-specific owner
        const venueOwner = user as any;
        if (venueOwner.venueId) {
          // Use the venue owner authentication system
          const loginSuccess = loginAsVenueOwner(credentials.email, venueOwner.venueId);
          if (loginSuccess) {
            router.push(`/venues/${venueOwner.venueId}/manage`);
          } else {
            setError('Failed to authenticate venue owner');
            setIsLoading(false);
            return;
          }
        } else {
          document.cookie = 'venue-owner-auth=authenticated; path=/; max-age=86400'; // 24 hours
          router.push('/venue-owner/dashboard');
        }
      } else {
        document.cookie = 'guest-auth=authenticated; path=/; max-age=86400'; // 24 hours
        router.push('/guest/dashboard');
      }
    } else {
      setError('Invalid email or password');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your Florida Wedding Wonders account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Demo Accounts:</h3>
          <div className="text-xs text-gray-600 space-y-2">
            <div>
              <p className="font-medium">Super Admin (All Venues):</p>
              <p>admin@floridaweddingwonders.com / superadmin2025</p>
            </div>
            <div>
              <p className="font-medium">System Admin:</p>
              <p>admin@soflowedding.com / soflo2025</p>
            </div>
            <div>
              <p className="font-medium">Venue Owners:</p>
              <p>manager@curtissmansion.com / curtiss123</p>
              <p>owner@hialeahpark.com / hialeah123</p>
            </div>
            <div>
              <p className="font-medium">Guest:</p>
              <p>guest@example.com / guest123</p>
            </div>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-pink-600 hover:text-pink-700 font-medium transition">
              Create one here
            </Link>
          </p>
        </div>

        {/* Forgot Password */}
        <div className="text-center mt-3">
          <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700 transition">
            Forgot your password?
          </Link>
        </div>

        {/* Back to Site */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-pink-600 hover:text-pink-700 transition">
            ← Back to main site
          </Link>
        </div>
      </div>
    </div>
  );
}
