'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  venueId: string;
  range: number;
  totals: {
    totalViews: number;
    uniqueVisitors: number;
    mobileViews: number;
    desktopViews: number;
    tabletViews: number;
  };
  dailyData: Array<{
    date: string;
    total_views: number;
    unique_visitors: number;
    mobile_views: number;
    desktop_views: number;
    tablet_views: number;
  }>;
  actions: {
    [key: string]: number;
  };
}

interface VenueAnalyticsPanelProps {
  venueId: string;
}

export default function VenueAnalyticsPanel({ venueId }: VenueAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [venueId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/venue-analytics?venueId=${venueId}&range=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Unable to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <span className="text-4xl mb-2 block">📊</span>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Unavailable</h3>
        <p className="text-gray-600 mb-4">{error || 'No analytics data available yet'}</p>
        <p className="text-sm text-gray-500">Views will start tracking once your venue page is visited</p>
      </div>
    );
  }

  const { totals, dailyData, actions } = analytics;

  // Prepare chart data
  const viewsChartData = {
    labels: dailyData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Total Views',
        data: dailyData.map(d => d.total_views),
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        tension: 0.3
      },
      {
        label: 'Unique Visitors',
        data: dailyData.map(d => d.unique_visitors),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.3
      }
    ]
  };

  const deviceChartData = {
    labels: ['Mobile', 'Desktop', 'Tablet'],
    datasets: [
      {
        data: [totals.mobileViews, totals.desktopViews, totals.tabletViews],
        backgroundColor: [
          'rgba(236, 72, 153, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(6, 182, 212, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };

  // Calculate engagement metrics
  const engagementRate = totals.uniqueVisitors > 0 
    ? ((Object.values(actions).reduce((a, b) => a + b, 0) / totals.uniqueVisitors) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">📊 Venue Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
        </select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-3xl mb-2">👁️</div>
          <div className="text-3xl font-bold mb-1">{totals.totalViews.toLocaleString()}</div>
          <div className="text-pink-100">Total Views</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-3xl mb-2">👤</div>
          <div className="text-3xl font-bold mb-1">{totals.uniqueVisitors.toLocaleString()}</div>
          <div className="text-purple-100">Unique Visitors</div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-3xl font-bold mb-1">{engagementRate}%</div>
          <div className="text-cyan-100">Engagement Rate</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-3xl mb-2">📱</div>
          <div className="text-3xl font-bold mb-1">
            {((totals.mobileViews / totals.totalViews) * 100).toFixed(0)}%
          </div>
          <div className="text-emerald-100">Mobile Traffic</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Views Over Time Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Views Over Time</h3>
          <div className="h-80">
            <Line data={viewsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
          <div className="h-80 flex items-center justify-center">
            <Doughnut data={deviceChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* User Actions */}
      {Object.keys(actions).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actions.phone_click && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📞</div>
                <div className="text-2xl font-bold text-gray-900">{actions.phone_click}</div>
                <div className="text-sm text-gray-600">Phone Clicks</div>
              </div>
            )}
            {actions.email_click && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">✉️</div>
                <div className="text-2xl font-bold text-gray-900">{actions.email_click}</div>
                <div className="text-sm text-gray-600">Email Clicks</div>
              </div>
            )}
            {actions.website_click && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🌐</div>
                <div className="text-2xl font-bold text-gray-900">{actions.website_click}</div>
                <div className="text-sm text-gray-600">Website Visits</div>
              </div>
            )}
            {actions.gallery_open && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🖼️</div>
                <div className="text-2xl font-bold text-gray-900">{actions.gallery_open}</div>
                <div className="text-sm text-gray-600">Gallery Opens</div>
              </div>
            )}
            {actions.save_venue && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">💝</div>
                <div className="text-2xl font-bold text-gray-900">{actions.save_venue}</div>
                <div className="text-sm text-gray-600">Saves</div>
              </div>
            )}
            {actions.share && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🔗</div>
                <div className="text-2xl font-bold text-gray-900">{actions.share}</div>
                <div className="text-sm text-gray-600">Shares</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insights & Tips */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Insights & Tips</h3>
        <div className="space-y-3 text-sm text-gray-700">
          {totals.mobileViews > totals.desktopViews && (
            <p>📱 <strong>Mobile-first audience:</strong> Most of your visitors are on mobile. Ensure your photos look great on smaller screens.</p>
          )}
          {totals.totalViews > 0 && actions.phone_click && (
            <p>📞 <strong>Strong phone engagement:</strong> {((actions.phone_click / totals.uniqueVisitors) * 100).toFixed(1)}% of visitors clicked your phone number. Make sure you respond quickly!</p>
          )}
          {totals.totalViews > 100 && Object.keys(actions).length === 0 && (
            <p>🎯 <strong>Engagement opportunity:</strong> You're getting views but few actions. Consider adding more compelling CTAs or updating your photos.</p>
          )}
          {totals.uniqueVisitors > 50 && !actions.email_click && (
            <p>✉️ <strong>Email visibility:</strong> No email clicks yet. Make sure your contact email is prominently displayed.</p>
          )}
        </div>
      </div>
    </div>
  );
}
