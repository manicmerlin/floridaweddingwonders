'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LeadQualificationForm, { LeadQualificationData } from '../../../components/LeadQualificationForm';

export default function CompleteProfile() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Pre-fill form with user's basic info
      if (parsedUser.leadQualification?.fullName) {
        // User already has profile complete, redirect to dashboard
        router.push('/guest/dashboard');
      }
    } else {
      // No user logged in, redirect to login
      router.push('/login');
    }
  }, [router]);

  const handleProfileSubmit = async (leadData: LeadQualificationData) => {
    setIsLoading(true);

    try {
      // Simulate API call to save lead qualification data
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update user data with lead qualification
      const updatedUser = {
        ...user,
        leadQualification: leadData,
        profileComplete: true
      };

      // Store updated user data
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Check for return URL (in case they were trying to favorite a venue)
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
        localStorage.removeItem('returnUrl');
        router.push(returnUrl);
      } else {
        router.push('/guest/dashboard');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipForNow = () => {
    // Allow users to skip but mark profile as incomplete
    const updatedUser = {
      ...user,
      profileComplete: false
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl) {
      localStorage.removeItem('returnUrl');
      router.push(returnUrl);
    } else {
      router.push('/guest/dashboard');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-100 rounded-full mb-4">
            <span className="text-3xl">💖</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Florida Wedding Wonders, {user.name}!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let's create your wedding profile so we can help you find the perfect venues tailored to your special day.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
            Why Complete Your Profile?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mb-3">
                <span className="text-xl">🎯</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Better Matches</h3>
              <p className="text-gray-600 text-sm">
                Get venue recommendations that fit your guest count, budget, and style preferences.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                <span className="text-xl">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Faster Responses</h3>
              <p className="text-gray-600 text-sm">
                Venues can respond quicker when they have all your details upfront.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <span className="text-xl">💰</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Better Pricing</h3>
              <p className="text-gray-600 text-sm">
                Venues can offer more accurate quotes and special deals for your needs.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <LeadQualificationForm
          initialData={{
            fullName: user.name,
            email: user.email
          }}
          onSubmit={handleProfileSubmit}
          submitButtonText={isLoading ? "Saving Profile..." : "Complete My Profile"}
          title="Your Wedding Details"
          description="This information helps venues provide you with the most relevant options and accurate pricing."
        />

        {/* Skip Option */}
        <div className="text-center mt-8">
          <button
            onClick={handleSkipForNow}
            className="text-gray-500 hover:text-gray-700 underline text-sm"
          >
            Skip for now (you can complete this later in your profile)
          </button>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-4">
          <Link href="/guest/dashboard" className="text-pink-600 hover:text-pink-700 transition text-sm">
            ← Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
