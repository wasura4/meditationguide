'use client';

import React, { useState, useEffect } from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminService } from '@/lib/adminService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  sessions: {
    total: number;
    completed: number;
    average: number;
    growth: number;
  };
  engagement: {
    dailyActive: number[];
    weeklyActive: number[];
    monthlyActive: number;
    retentionRate: number;
  };
  meditation: {
    totalMinutes: number;
    averageSession: number;
    popularTypes: Array<{ type: string; count: number; percentage: number }>;
  };
  content: {
    audioFiles: number;
    dhammaPosts: number;
    totalViews: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    sessionGrowth: Array<{ date: string; count: number }>;
  };
}

export default function AdminAnalyticsPage() {
  const { hasPermission } = useAdminAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { showToast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getAdminAnalytics(timeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load analytics data',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('analytics', 'read')) {
    return (
      <AdminProtectedRoute>
        <AdminLayout currentPage="/admin/analytics">
          <div className="text-center py-12">
            <p className="text-gray-600">You don't have permission to view analytics.</p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  if (loading || !analytics) {
    return (
      <AdminProtectedRoute>
        <AdminLayout currentPage="/admin/analytics">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b9e7a] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatMinutes = (minutes: number) => {
    if (minutes >= 1440) return `${Math.round(minutes / 1440)} days`;
    if (minutes >= 60) return `${Math.round(minutes / 60)} hours`;
    return `${minutes} minutes`;
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/analytics">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Comprehensive insights into your platform</p>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  className={timeRange === range ? 'bg-[#6b9e7a] hover:bg-[#5a8a68] text-white' : ''}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
                </Button>
              ))}
            </div>
          </div>

          {/* User Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.users.total)}</p>
              <p className="text-sm text-gray-500 mt-1">All registered users</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.users.active)}</p>
              <p className="text-sm text-gray-500 mt-1">Users with sessions</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">New Users</p>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.users.new)}</p>
              <div className="flex items-center mt-1">
                <p className="text-sm text-gray-500">Growth: </p>
                <p className={`text-sm font-semibold ml-1 ${analytics.users.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.users.growth >= 0 ? '+' : ''}{analytics.users.growth}%
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{analytics.engagement.retentionRate}%</p>
              <p className="text-sm text-gray-500 mt-1">User engagement</p>
            </div>
          </div>

          {/* Session Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.sessions.total)}</p>
              <div className="flex items-center mt-1">
                <p className="text-sm text-gray-500">Growth: </p>
                <p className={`text-sm font-semibold ml-1 ${analytics.sessions.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.sessions.growth >= 0 ? '+' : ''}{analytics.sessions.growth}%
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.sessions.completed)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {analytics.sessions.total > 0 
                  ? Math.round((analytics.sessions.completed / analytics.sessions.total) * 100) 
                  : 0}% completion rate
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Avg Session</p>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{analytics.sessions.average}</p>
              <p className="text-sm text-gray-500 mt-1">minutes per session</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Minutes</p>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatMinutes(analytics.meditation.totalMinutes)}</p>
              <p className="text-sm text-gray-500 mt-1">Total meditation time</p>
            </div>
          </div>

          {/* Engagement Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Active Users */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Active Users (Last 7 Days)</h3>
              <div className="h-64 flex items-end gap-2">
                {analytics.engagement.dailyActive.map((count, index) => {
                  const maxCount = Math.max(...analytics.engagement.dailyActive, 1);
                  const height = (count / maxCount) * 100;
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const dayIndex = new Date().getDay() - (6 - index);
                  const dayName = days[(dayIndex + 7) % 7];
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '200px' }}>
                        <div
                          className="w-full bg-[#6b9e7a] rounded-t absolute bottom-0 transition-all"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="absolute bottom-2 left-0 right-0 text-center text-xs font-semibold text-gray-700">
                          {count}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-600">{dayName}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Active Users */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Active Users (Last 4 Weeks)</h3>
              <div className="h-64 flex items-end gap-2">
                {analytics.engagement.weeklyActive.map((count, index) => {
                  const maxCount = Math.max(...analytics.engagement.weeklyActive, 1);
                  const height = (count / maxCount) * 100;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '200px' }}>
                        <div
                          className="w-full bg-[#3b82f6] rounded-t absolute bottom-0 transition-all"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="absolute bottom-2 left-0 right-0 text-center text-xs font-semibold text-gray-700">
                          {count}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-600">W{4 - index}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Popular Meditation Types */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Meditation Types</h3>
            <div className="space-y-4">
              {analytics.meditation.popularTypes.length > 0 ? (
                analytics.meditation.popularTypes.map((type, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">{type.type}</p>
                        <p className="text-sm text-gray-600">{type.count} sessions ({type.percentage}%)</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#6b9e7a] h-2 rounded-full transition-all"
                          style={{ width: `${type.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No meditation type data available</p>
              )}
            </div>
          </div>

          {/* Content Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Audio Files</p>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{analytics.content.audioFiles}</p>
              <p className="text-sm text-gray-500 mt-1">Total audio files</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Dhamma Posts</p>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{analytics.content.dhammaPosts}</p>
              <p className="text-sm text-gray-500 mt-1">Total published posts</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.content.totalViews)}</p>
              <p className="text-sm text-gray-500 mt-1">Content views</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}

