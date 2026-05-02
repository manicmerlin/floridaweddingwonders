'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { requestPasswordReset } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const result = await requestPasswordReset(email.trim());
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || 'Could not send the reset email. Please try again.');
      return;
    }
    // Always show the same confirmation regardless of whether the email is
    // registered — prevents account enumeration.
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter the email on your account and we'll send a reset link.
            </p>
          </div>

          {sent ? (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 text-center">
              <p>
                If an account exists for <strong>{email}</strong>, a reset link is on
                the way. Check your inbox (and spam folder).
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block font-medium text-pink-600 hover:text-pink-700"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  'Send reset link'
                )}
              </button>

              <div className="text-center text-sm">
                <Link href="/login" className="font-medium text-pink-600 hover:text-pink-700">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
