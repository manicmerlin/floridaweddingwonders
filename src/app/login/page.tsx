'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingVenueId, setPendingVenueId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if there's a pending venue claim
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl && returnUrl.includes('/venues/') && returnUrl.includes('/claim')) {
      const venueId = returnUrl.split('/venues/')[1]?.split('/claim')[0];
      setPendingVenueId(venueId);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Import Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aflrmpkolumpjhpaxblz.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmbHJtcGtvbHVtcGpocGF4Ymx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0MjcyMTIsImV4cCI6MjA0MjAwMzIxMn0.y7cCU7LNcanterUpMPU6j5rO_hWJlgEYF3z9FRw00LU'
      );
      
      // Check for super admin credentials first
      const { loginAsVenueOwner } = await import('@/lib/auth');
      if (email === 'admin@floridaweddingwonders.com' && password === 'admin123') {
        const success = loginAsVenueOwner(email);
        if (success) {
          const returnUrl = localStorage.getItem('returnUrl');
          if (returnUrl) {
            localStorage.removeItem('returnUrl');
            router.push(returnUrl);
          } else {
            router.push('/admin');
          }
          return;
        }
      }

      // Try Supabase Auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Try demo mode for venue owners
        if (password === 'demo123') {
          const success = loginAsVenueOwner(email);
          if (success) {
            const returnUrl = localStorage.getItem('returnUrl');
            if (returnUrl) {
              localStorage.removeItem('returnUrl');
              router.push(returnUrl);
            } else {
              router.push('/venue-owner/dashboard');
            }
            return;
          }
        }
        
        setError('Invalid credentials. Please check your email and password.');
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Store user data in localStorage
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || '',
          role: data.user.user_metadata?.role || 'guest',
          isAuthenticated: true
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
        document.cookie = `auth-token=${data.user.id}; path=/; max-age=86400`;

        // Check for return URL
        const returnUrl = localStorage.getItem('returnUrl');
        if (returnUrl) {
          localStorage.removeItem('returnUrl');
          router.push(returnUrl);
        } else {
          // Redirect based on role
          if (userData.role === 'venue_owner') {
            router.push('/venue-owner/dashboard');
          } else {
            router.push('/venues');
          }
        }
      }
      
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                create a new account
              </Link>
            </p>
            
            {pendingVenueId && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-blue-800">
                    You'll be redirected to complete your venue claim after signing in.
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            {/* Demo Credentials Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <div>
                  <p><strong>Super Admin:</strong></p>
                  <p>Email: admin@floridaweddingwonders.com</p>
                  <p>Password: admin123</p>
                </div>
                <div>
                  <p><strong>Venue Owner:</strong></p>
                  <p>Email: any@email.com</p>
                  <p>Password: demo123</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
