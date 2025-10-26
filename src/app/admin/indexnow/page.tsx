'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SubmissionResult {
  success: boolean;
  message: string;
  url?: string;
  count?: number;
  error?: string;
}

export default function IndexNowAdminPage() {
  const router = useRouter();
  const [singleUrl, setSingleUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'sitemap'>('single');

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: singleUrl }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setSingleUrl('');
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to submit URL',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const urls = bulkUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      if (urls.length === 0) {
        setResult({
          success: false,
          error: 'No URLs provided',
          message: 'Please enter at least one URL',
        });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setBulkUrls('');
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to submit URLs',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSitemapSubmit = async () => {
    setIsSubmitting(true);
    setResult(null);

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floridaweddingwonders.com';
      const response = await fetch('/api/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `${siteUrl}/sitemap.xml` }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to submit sitemap',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickActions = [
    { label: 'Home Page', url: '/' },
    { label: 'All Venues', url: '/venues' },
    { label: 'All Vendors', url: '/vendors' },
    { label: 'Dress Shops', url: '/dress-shops' },
    { label: 'Blog', url: '/blog' },
    { label: 'FAQ', url: '/faq' },
  ];

  const handleQuickAction = (path: string) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floridaweddingwonders.com';
    setSingleUrl(`${siteUrl}${path}`);
    setActiveTab('single');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-pink-600 hover:text-pink-800 mb-4 flex items-center gap-2"
          >
            ← Back to Admin
          </button>
          <h1 className="text-3xl font-bold text-gray-900">IndexNow Management</h1>
          <p className="mt-2 text-gray-600">
            Notify search engines about content updates instantly
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">About IndexNow</h3>
          <p className="text-sm text-blue-800">
            IndexNow allows you to instantly notify search engines (Bing, Yandex, etc.) when
            content is added or updated. This helps your changes get indexed faster than waiting
            for crawlers to discover them naturally.
          </p>
          <ul className="mt-2 text-sm text-blue-800 list-disc list-inside">
            <li>Submit individual URLs for specific pages</li>
            <li>Batch submit multiple URLs at once (max 10,000)</li>
            <li>Notify search engines about your sitemap</li>
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.url}
                onClick={() => handleQuickAction(action.url)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('single')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'single'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Single URL
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'bulk'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bulk URLs
              </button>
              <button
                onClick={() => setActiveTab('sitemap')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'sitemap'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sitemap
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Single URL Tab */}
            {activeTab === 'single' && (
              <form onSubmit={handleSingleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="singleUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    URL to Submit
                  </label>
                  <input
                    type="url"
                    id="singleUrl"
                    value={singleUrl}
                    onChange={(e) => setSingleUrl(e.target.value)}
                    placeholder="https://floridaweddingwonders.com/venues/new-venue"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the full URL of the page you want to notify search engines about
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit URL'}
                </button>
              </form>
            )}

            {/* Bulk URLs Tab */}
            {activeTab === 'bulk' && (
              <form onSubmit={handleBulkSubmit} className="space-y-4">
                <div>
                  <label htmlFor="bulkUrls" className="block text-sm font-medium text-gray-700 mb-2">
                    URLs to Submit (one per line)
                  </label>
                  <textarea
                    id="bulkUrls"
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    placeholder="https://floridaweddingwonders.com/venues/venue-1&#10;https://floridaweddingwonders.com/venues/venue-2&#10;https://floridaweddingwonders.com/blog/new-post"
                    rows={10}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500 font-mono text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Maximum 10,000 URLs per submission. One URL per line.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit URLs'}
                </button>
              </form>
            )}

            {/* Sitemap Tab */}
            {activeTab === 'sitemap' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Submit Your Sitemap</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This will notify search engines to crawl your sitemap.xml file, which contains
                    all your public pages. This is useful after making bulk content updates.
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Sitemap URL:</strong>{' '}
                    <code className="bg-white px-2 py-1 rounded">
                      {process.env.NEXT_PUBLIC_SITE_URL || 'https://floridaweddingwonders.com'}/sitemap.xml
                    </code>
                  </p>
                </div>
                <button
                  onClick={handleSitemapSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Sitemap'}
                </button>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div
                className={`mt-6 p-4 rounded-md ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {result.success ? (
                      <svg
                        className="h-5 w-5 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3
                      className={`text-sm font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {result.success ? 'Success!' : 'Error'}
                    </h3>
                    <p
                      className={`mt-1 text-sm ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {result.message}
                    </p>
                    {result.url && (
                      <p className="mt-1 text-xs text-gray-600 break-all">{result.url}</p>
                    )}
                    {result.count && (
                      <p className="mt-1 text-xs text-gray-600">
                        Submitted {result.count} URL{result.count !== 1 ? 's' : ''}
                      </p>
                    )}
                    {result.error && (
                      <p className="mt-2 text-xs text-red-600 font-mono">{result.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documentation Link */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h2>
          <p className="text-sm text-gray-600 mb-4">
            Check out our comprehensive IndexNow documentation for setup instructions, testing
            guides, and best practices.
          </p>
          <a
            href="https://github.com/yourusername/SoFloWeddingVenues/blob/main/INDEXNOW_INTEGRATION.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:text-pink-800 text-sm font-medium"
          >
            View Documentation →
          </a>
        </div>
      </div>
    </div>
  );
}
