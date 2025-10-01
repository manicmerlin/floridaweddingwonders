'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockVenues } from '../../../lib/mockData';
import { Venue } from '../../../types';
import Image from 'next/image';
import Link from 'next/link';
import LeadQualificationForm, { LeadQualificationData } from '../../../components/LeadQualificationForm';
import VenueCard from '../../../components/VenueCard';
import { FavoritesManager } from '../../../lib/favorites';

export default function GuestDashboard() {
  const [user, setUser] = useState<any>(null);
  const [savedVenuesCount, setSavedVenuesCount] = useState(0);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'saved' | 'browse' | 'profile'>('saved');
  const router = useRouter();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Load saved venues count
      setSavedVenuesCount(FavoritesManager.getSavedVenuesCount(parsedUser.email));
    }
    
    setVenues(mockVenues);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    document.cookie = 'guest-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/login');
  };



  const handleProfileUpdate = async (leadData: LeadQualificationData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update user data with lead qualification
      const updatedUser = {
        ...user,
        leadQualification: leadData,
        profileComplete: true
      };

      // Store updated user data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };



  const getFilteredVenues = () => {
    return venues.filter(venue =>
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.address.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access your dashboard.</p>
          <Link href="/login" className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">SoFlo Venues</Link>
              <span className="ml-3 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
                Guest Portal
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">Hello, {user.name}!</span>
              <Link href="/venues" className="text-gray-700 hover:text-gray-900 font-medium">
                Browse All Venues
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name}! 💕</h1>
          <p className="text-gray-600">Manage your favorite venues and discover new wedding locations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-pink-600">{savedVenuesCount}</div>
            <div className="text-gray-600">Saved Venues</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{venues.filter(v => v.availability.isAvailable).length}</div>
            <div className="text-gray-600">Available Venues</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{venues.length}</div>
            <div className="text-gray-600">Total Venues</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'saved', name: 'Saved Venues', icon: '💖', count: savedVenuesCount },
                { id: 'browse', name: 'Browse Venues', icon: '🔍', count: venues.length },
                { id: 'profile', name: 'My Profile', icon: '👤', count: null }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                  {tab.count !== null && (
                    <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Saved Venues Tab */}
            {activeTab === 'saved' && (
              <div>
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-100 rounded-full mb-4">
                    <span className="text-3xl">💖</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Saved Venues</h2>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {savedVenuesCount > 0 
                      ? `You have ${savedVenuesCount} venue${savedVenuesCount !== 1 ? 's' : ''} saved. View and manage them all in one place.`
                      : 'Start saving venues you love by clicking the heart icon. They\'ll appear here for easy comparison.'
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/guest/saved-venues"
                      className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                      {savedVenuesCount > 0 ? 'View Saved Venues' : 'Browse Venues to Save'}
                    </Link>
                    {savedVenuesCount === 0 && (
                      <button
                        onClick={() => setActiveTab('browse')}
                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                      >
                        Browse Here
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Browse Tab */}
            {activeTab === 'browse' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Discover Wedding Venues</h2>
                  <input
                    type="text"
                    placeholder="Search venues by name or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredVenues().slice(0, 12).map((venue) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                    />
                  ))}
                </div>

                <div className="text-center mt-8">
                  <Link
                    href="/venues"
                    className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition"
                  >
                    View All Venues ({venues.length} total)
                  </Link>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">My Wedding Profile</h2>
                  <p className="text-gray-600">
                    Keep your wedding details up-to-date to receive the best venue matches and pricing.
                  </p>
                </div>

                {/* Profile Status Card */}
                <div className={`p-4 rounded-lg mb-6 ${
                  user.leadQualification ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {user.leadQualification ? '✅' : '⚠️'}
                    </span>
                    <div>
                      <h3 className={`font-semibold ${
                        user.leadQualification ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        {user.leadQualification ? 'Profile Complete' : 'Profile Incomplete'}
                      </h3>
                      <p className={`text-sm ${
                        user.leadQualification ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {user.leadQualification 
                          ? 'Your profile is complete and venues can provide you with accurate quotes.'
                          : 'Complete your profile to get better venue matches and faster responses.'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <LeadQualificationForm
                    initialData={{
                      fullName: user.name,
                      email: user.email,
                      ...user.leadQualification
                    }}
                    onSubmit={handleProfileUpdate}
                    submitButtonText="Update My Profile"
                    title="Update Your Wedding Details"
                    description="Changes to your profile help venues provide more accurate pricing and recommendations."
                  />
                </div>

                {/* Profile Benefits */}
                <div className="mt-8 bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    Why Keep Your Profile Updated?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-3 mt-1">🎯</span>
                      <div>
                        <h4 className="font-medium text-blue-900">Better Matches</h4>
                        <p className="text-blue-700 text-sm">
                          Venues that fit your guest count, budget, and style preferences
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-3 mt-1">💰</span>
                      <div>
                        <h4 className="font-medium text-blue-900">Accurate Pricing</h4>
                        <p className="text-blue-700 text-sm">
                          Get quotes tailored to your specific needs and budget
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-3 mt-1">⚡</span>
                      <div>
                        <h4 className="font-medium text-blue-900">Faster Responses</h4>
                        <p className="text-blue-700 text-sm">
                          Venues can respond quickly with all your details upfront
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-3 mt-1">📅</span>
                      <div>
                        <h4 className="font-medium text-blue-900">Availability Alerts</h4>
                        <p className="text-blue-700 text-sm">
                          Get notified when venues have openings for your dates
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


