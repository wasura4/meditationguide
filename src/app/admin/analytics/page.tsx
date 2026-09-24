'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminService } from '@/lib/adminService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { PATH_STAGES } from '@/constants/path';
import { User } from '@/types';

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number | null;
  };
  sessions: {
    total: number;
    completed: number;
    average: number;
    growth: number | null;
  };
  engagement: {
    dailyActive: number[];
    weeklyActive: number[];
    monthlyActive: number;
    participationRate: number;
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
    totalAudioListens: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    sessionGrowth: Array<{ date: string; count: number }>;
  };
  pathProgress?: {
    byStage: Array<{ stage: number; count: number; percentage: number }>;
    totalWithProgress: number;
  };
  topUsers: Array<{
    user: User;
    sessionCount: number;
    totalMinutes: number;
    meditationTypes: Array<{ type: string; count: number }>;
  }>;
}

interface UsersByStage {
  [stage: number]: Array<{
    id: string;
    email: string;
    displayName: string;
  }>;
}

export default function AdminAnalyticsPage() {
  const { hasPermission } = useAdminAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [usersByStage, setUsersByStage] = useState<UsersByStage | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [showUserDetails, setShowUserDetails] = useState(false);
  const { showToast } = useToast();

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setAnalytics(null);
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
  }, [timeRange, showToast]);

  const loadUsersByStage = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const users = await AdminService.getUsersByStage();
      setUsersByStage(users);
      setShowUserDetails(true);
    } catch (error) {
      console.error('Error loading users by stage:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load user details',
        duration: 5000,
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics, retry]);

  if (!hasPermission('analytics', 'read')) {
    return (
      <AdminProtectedRoute>
        <AdminLayout currentPage="/admin/analytics">
          <div className="text-center py-12">
            <p className="text-muted-foreground">You don&apos;t have permission to view analytics.</p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout currentPage="/admin/analytics">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ring)] mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading analytics...</p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  if (!analytics) return <AdminLayout currentPage="/admin/analytics"><div role="alert" className="app-card p-6"><h1 className="text-xl font-semibold">Analytics could not load</h1><p className="my-3 text-muted-foreground">Check your connection and try again.</p><Button onClick={()=>setRetry(value=>value+1)}>Retry</Button></div></AdminLayout>;

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
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">Comprehensive insights into your platform</p>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  className={timeRange === range ? 'bg-[var(--primary)] hover:opacity-90 text-white' : ''}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">Practice totals, new users, and rankings follow the selected period. Registered users, content inventory, and path stages are lifetime totals. Daily and weekly charts show their labeled windows. Growth compares new registrations or sessions with the preceding equal-length period; no comparison is shown without a baseline.</p>
          {/* User Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <div className="p-2 bg-muted rounded-lg">
                  <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatNumber(analytics.users.total)}</p>
              <p className="text-sm text-muted-foreground mt-1">All registered users</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <div className="p-2 bg-muted rounded-lg">
                  <svg className="w-5 h-5 text-[var(--color-status-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatNumber(analytics.users.active)}</p>
              <p className="text-sm text-muted-foreground mt-1">Completed practice in this period</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">New Users</p>
                <div className="p-2 bg-muted rounded-lg">
                  <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatNumber(analytics.users.new)}</p>
              <div className="flex items-center mt-1">
                <p className="text-sm text-muted-foreground">Growth: </p>
                <p className={`text-sm font-semibold ml-1 ${(analytics.users.growth ?? 0) >= 0 ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-error)]'}`}>
                  {analytics.users.growth === null ? 'No comparison' : ((analytics.users.growth ?? 0) >= 0 ? '+' : '') + analytics.users.growth + '%'}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Practice participation</p>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{analytics.engagement.participationRate}%</p>
              <p className="text-sm text-muted-foreground mt-1">Registered users with completed practice</p>
            </div>
          </div>

          {/* Session Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <div className="p-2 bg-muted rounded-lg">
                  <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatNumber(analytics.sessions.total)}</p>
              <div className="flex items-center mt-1">
                <p className="text-sm text-muted-foreground">Growth: </p>
                <p className={`text-sm font-semibold ml-1 ${(analytics.sessions.growth ?? 0) >= 0 ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-error)]'}`}>
                  {analytics.sessions.growth === null ? 'No comparison' : ((analytics.sessions.growth ?? 0) >= 0 ? '+' : '') + analytics.sessions.growth + '%'}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <div className="p-2 bg-muted rounded-lg">
                  <svg className="w-5 h-5 text-[var(--color-status-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatNumber(analytics.sessions.completed)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {analytics.sessions.total > 0
                  ? Math.round((analytics.sessions.completed / analytics.sessions.total) * 100)
                  : 0}% completion rate
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Avg Session</p>
                <div className="p-2 bg-muted rounded-lg">
                  <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{analytics.sessions.average}</p>
              <p className="text-sm text-muted-foreground mt-1">minutes per completed session</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Minutes</p>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatMinutes(analytics.meditation.totalMinutes)}</p>
              <p className="text-sm text-muted-foreground mt-1">Completed practice in this period</p>
            </div>
          </div>

          {/* Engagement Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Active Users */}
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Daily Active Users (Last 7 Days)</h3>
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
                          className="w-full bg-[var(--primary)] rounded-t absolute bottom-0 transition-all"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="absolute bottom-2 left-0 right-0 text-center text-xs font-semibold text-foreground">
                          {count}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{dayName}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Active Users */}
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Active Users (Last 4 Weeks)</h3>
              <div className="h-64 flex items-end gap-2">
                {analytics.engagement.weeklyActive.map((count, index) => {
                  const maxCount = Math.max(...analytics.engagement.weeklyActive, 1);
                  const height = (count / maxCount) * 100;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '200px' }}>
                        <div
                          className="w-full bg-[var(--primary)] rounded-t absolute bottom-0 transition-all"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="absolute bottom-2 left-0 right-0 text-center text-xs font-semibold text-foreground">
                          {count}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">W{4 - index}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Path Progress Distribution */}
          {analytics.pathProgress && analytics.pathProgress.totalWithProgress > 0 && (
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Seven Purifications Path Distribution</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{analytics.pathProgress.totalWithProgress} users on the path</span>
                  <Button
                    onClick={loadUsersByStage}
                    disabled={loadingUsers}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {loadingUsers ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        {showUserDetails ? 'Refresh' : 'View User Details'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PATH_STAGES.map((stage) => {
                  const stageData = analytics.pathProgress!.byStage.find(s => s.stage === stage.order);
                  const count = stageData?.count || 0;
                  const percentage = stageData?.percentage || 0;

                  return (
                    <div key={stage.order} className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg p-4 border border-violet-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-violet-600">Stage {stage.order}</span>
                        <span className="text-xs font-bold text-violet-900">{count} users</span>
                      </div>
                      <p className="text-sm font-bold text-violet-900 mb-1">{stage.name}</p>
                      <p className="text-xs text-violet-700 mb-3">{stage.nameEn}</p>
                      <div className="relative h-2 bg-violet-200 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-violet-600 mt-1 text-right">{percentage.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* User Details by Stage */}
          {showUserDetails && usersByStage && (
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Users by Stage - Detailed View</h3>
                <Button
                  onClick={() => setShowUserDetails(false)}
                  size="sm"
                  variant="ghost"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              <div className="space-y-6">
                {PATH_STAGES.map((stage) => {
                  const users = usersByStage[stage.order] || [];
                  if (users.length === 0) return null;

                  return (
                    <div key={stage.order} className="border border-border rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-semibold">Stage {stage.order}: {stage.name}</h4>
                            <p className="text-violet-100 text-sm">{stage.nameEn}</p>
                          </div>
                          <span className="bg-card/20 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {users.length} {users.length === 1 ? 'user' : 'users'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-card">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Email
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-card divide-y divide-gray-200">
                            {users.map((user, index) => (
                              <tr key={user.id} className="hover:bg-muted transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-foreground">
                                    {user.displayName || 'No name'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Popular Meditation Types */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Popular Meditation Types</h3>
            <div className="space-y-4">
              {analytics.meditation.popularTypes.length > 0 ? (
                analytics.meditation.popularTypes.map((type, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-foreground">{type.type}</p>
                        <p className="text-sm text-muted-foreground">{type.count} sessions ({type.percentage}%)</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[var(--primary)] h-2 rounded-full transition-all"
                          style={{ width: `${type.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No meditation type data available</p>
              )}
            </div>
          </div>

          {/* Content Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Audio Files</p>
                <div className="p-2 bg-muted rounded-lg">
                  <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{analytics.content.audioFiles}</p>
              <p className="text-sm text-muted-foreground mt-1">Total audio files</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Dhamma Posts</p>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{analytics.content.dhammaPosts}</p>
              <p className="text-sm text-muted-foreground mt-1">All publication states</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Article reads</p>
                <div className="p-2 bg-muted rounded-lg">
                  <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatNumber(analytics.content.totalViews)}</p>
              <p className="text-sm text-muted-foreground mt-1">Recorded reads in this period</p>
            </div>
          </div>

          {/* Top 20 Users Section */}
          <div className="bg-card/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-8">
            <h3 className="text-xl font-semibold mb-6 text-foreground">Top 20 Meditators</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-4 text-muted-foreground font-medium">Rank</th>
                    <th className="p-4 text-muted-foreground font-medium">User</th>
                    <th className="p-4 text-muted-foreground font-medium text-center">Sessions</th>
                    <th className="p-4 text-muted-foreground font-medium text-center">Total Time</th>
                    <th className="p-4 text-muted-foreground font-medium">Top Meditations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics.topUsers && analytics.topUsers.length > 0 ? (
                    analytics.topUsers.map((item, index) => (
                      <tr key={item.user.id} className="hover:bg-muted transition-colors">
                        <td className="p-4 text-muted-foreground">#{index + 1}</td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-foreground mb-0.5">{item.user.displayName || 'Anonymous'}</div>
                            <div className="text-sm text-muted-foreground">{item.user.email}</div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {formatNumber(item.sessionCount)}
                          </span>
                        </td>
                        <td className="p-4 text-center text-muted-foreground">
                          {formatMinutes(item.totalMinutes)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {item.meditationTypes.map((type, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-foreground"
                              >
                                {type.type} <span className="ml-1 text-muted-foreground">({type.count})</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No top users data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
