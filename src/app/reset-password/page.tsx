'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { updatePassword } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);
  const router = useRouter();

  // Supabase encodes the recovery token in the URL hash and
  // auto-exchanges it for a session via the SDK on mount. Wait for the
  // session before showing the form, otherwise we'd ask for a new password
  // without a logged-in context to update.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasRecoverySession(!!data.session);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasRecoverySession(true);
      }
    });
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    const result = await updatePassword(password);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || 'Could not update password. Please try again.');
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/login'), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Set a new password
            </h2>
          </div>

          {done ? (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 text-center">
              Password updated. Redirecting to sign-in…
            </div>
          ) : hasRecoverySession === false ? (
            <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-900 text-center">
              <p>
                This reset link is missing or expired. Request a new one from the
                forgot-password page.
              </p>
              <Link
                href="/forgot-password"
                className="mt-4 inline-block font-medium text-pink-600 hover:text-pink-700"
              >
                Request a new link
              </Link>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                placeholder="New password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />

              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || hasRecoverySession === null}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  'Update password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
