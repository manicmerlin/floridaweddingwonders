'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ClaimsManagement from '@/components/admin/ClaimsManagement';
import UsersManagement from '@/components/admin/UsersManagement';
import { isSuperAdmin, getCurrentUser } from '@/lib/auth';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      try {
        const { isAuthenticated } = getCurrentUser();
        const isSuper = isSuperAdmin();
        
        console.log('Admin auth check:', { isAuthenticated, isSuper });
        
        if (!isAuthenticated || !isSuper) {
          console.log('Not authorized, redirecting to login');
          // Redirect to login if not authenticated or not super admin
          router.push('/login');
          return;
        }
        
        console.log('Authorization successful');
        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure localStorage is available
    setTimeout(checkAuth, 100);
  }, [router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render admin content if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'claims', label: 'Venue Claims', icon: '🏛️' },
    { id: 'venues', label: 'Venue Management', icon: '⚙️' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'seo', label: 'SEO Tools', icon: '🔍' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className="bg-purple-600 text-white p-3 rounded-lg mr-4">
              <span className="text-2xl">🔑</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600">Manage venues, claims, and users</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-blue-50">
                    <span className="text-2xl">🏛️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Venues</p>
                    <p className="text-2xl font-semibold text-gray-900">124</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-yellow-50">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Claims</p>
                    <p className="text-2xl font-semibold text-gray-900">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-green-50">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Claimed Venues</p>
                    <p className="text-2xl font-semibold text-gray-900">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-purple-50">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-semibold text-gray-900">3</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab('claims')}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🏛️</span>
                        <div>
                          <p className="font-medium text-gray-900">Review Venue Claims</p>
                          <p className="text-sm text-gray-600">Approve or deny venue ownership claims</p>
                        </div>
                      </div>
                    </button>

                    <Link
                      href="/venue-owner/dashboard"
                      className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">⚙️</span>
                        <div>
                          <p className="font-medium text-gray-900">Manage Venues</p>
                          <p className="text-sm text-gray-600">Edit venue information and photos</p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/venues"
                      className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">👀</span>
                        <div>
                          <p className="font-medium text-gray-900">View Public Site</p>
                          <p className="text-sm text-gray-600">See the site as users do</p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/admin/indexnow"
                      className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🔍</span>
                        <div>
                          <p className="font-medium text-gray-900">IndexNow Manager</p>
                          <p className="text-sm text-gray-600">Notify search engines of content updates</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-4xl block mb-2">📝</span>
                      <p>No recent activity</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Venue Claims Management</h3>
            <p className="text-gray-600 mb-4">Claims management features coming soon...</p>
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl block mb-2">🏛️</span>
              <p>No pending claims at this time</p>
            </div>
          </div>
        )}

        {activeTab === 'venues' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Venue Management</h3>
            <p className="text-gray-600 mb-4">
              As a super admin, you can manage all venues through the venue owner dashboard.
            </p>
            <Link
              href="/venue-owner/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              Open Venue Management
            </Link>
          </div>
        )}

        {activeTab === 'users' && (
          <UsersManagement />
        )}

        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">SEO & Search Engine Tools</h3>
              <p className="text-gray-600 mb-6">
                Manage search engine optimization and indexing for your content.
              </p>

              <div className="space-y-3">
                <Link
                  href="/admin/indexnow"
                  className="block p-4 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-3xl mr-4">🔍</span>
                      <div>
                        <p className="font-medium text-gray-900">IndexNow Manager</p>
                        <p className="text-sm text-gray-600">
                          Instantly notify search engines (Bing, Yandex) when content updates
                        </p>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>

                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center">
                    <span className="text-3xl mr-4 opacity-50">📊</span>
                    <div>
                      <p className="font-medium text-gray-500">Analytics Dashboard</p>
                      <p className="text-sm text-gray-400">Coming soon...</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center">
                    <span className="text-3xl mr-4 opacity-50">🗺️</span>
                    <div>
                      <p className="font-medium text-gray-500">Sitemap Manager</p>
                      <p className="text-sm text-gray-400">Coming soon...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 About IndexNow</h4>
              <p className="text-sm text-blue-800 mb-2">
                IndexNow is a protocol that allows you to instantly notify search engines when content
                is created, updated, or deleted. This helps your changes get indexed faster than
                waiting for crawlers to discover them naturally.
              </p>
              <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                <li>Submit individual URLs or batch submit up to 10,000 URLs</li>
                <li>Supports Bing, Yandex, Seznam.cz, Naver, and more</li>
                <li>Automatic notifications on venue photo uploads</li>
                <li>Faster indexing = Better SEO = More traffic</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
