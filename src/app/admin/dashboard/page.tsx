'use client';

import React, { useState, useEffect } from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { AdminStats } from '@/types/admin';
import { useToast } from '@/components/ui/toast';
import { AdminService } from '@/lib/adminService';

export default function AdminDashboardPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Load real stats from Firebase
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const realStats = await AdminService.getAdminStats();
        setStats(realStats);

        // Show welcome toast
        showToast({
          type: 'success',
          title: 'Dashboard Loaded',
          message: `Welcome back, ${adminUser?.displayName}! Here's your admin overview.`,
          duration: 3000
        });
      } catch (error) {
        console.error('Error loading admin stats:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load dashboard statistics',
          duration: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [adminUser?.displayName, showToast]);

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout currentPage="/admin/dashboard">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ring)] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/dashboard">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="grad-brand rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome back, {adminUser?.displayName}! 🙏
                </h1>
                <p className="text-[color:rgba(255,255,255,0.8)] mt-2">
                  Here&apos;s what&apos;s happening with Nirvanaya today
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[color:rgba(255,255,255,0.8)]">Role</p>
                <p className="text-lg font-semibold capitalize">
                  {adminUser?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-muted rounded-lg">
                  <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-muted rounded-lg">
                  <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalSessions.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-muted rounded-lg">
                  <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Audio Files</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalAudioFiles}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Dhamma Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalDhammaPosts}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Listening Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828 0" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Audio Listens</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalAudioListens.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Audio Listening Minutes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalAudioListeningMinutes.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-semibold text-gray-900">{stats?.activeUsersToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Users</span>
                  <span className="font-semibold text-gray-900">{stats?.newUsersThisWeek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Minutes</span>
                  <span className="font-semibold text-gray-900">{stats?.totalMeditationMinutes.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {hasPermission('audio', 'create') && (
                  <Button 
                    className="w-full justify-start" 
                    variant="outline" 
                    onClick={() => {
                      showToast({
                        type: 'info',
                        title: 'Navigating to Audio Upload',
                        message: 'Taking you to the audio management section.',
                        duration: 2000
                      });
                      setTimeout(() => window.location.href = '/admin/audio', 500);
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload Audio File
                  </Button>
                )}
                {hasPermission('dhamma', 'create') && (
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => {
                      showToast({
                        type: 'info',
                        title: 'Navigating to Dhamma Management',
                        message: 'Taking you to create a new Dhamma post.',
                        duration: 2000
                      });
                      setTimeout(() => window.location.href = '/admin/dhamma', 500);
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Dhamma Post
                  </Button>
                )}
                {hasPermission('users', 'read') && (
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => {
                      showToast({
                        type: 'info',
                        title: 'User Management',
                        message: 'User management features coming soon!',
                        duration: 3000
                      });
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Users
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Database</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-[var(--color-status-success)]">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Storage</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-[var(--color-status-success)]">
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">API</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-[var(--color-status-success)]">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-[var(--primary)] rounded-full mr-3"></div>
                  <span className="text-gray-600">New user registered</span>
                </div>
                <span className="text-sm text-gray-500">2 minutes ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-[var(--primary)] rounded-full mr-3"></div>
                  <span className="text-gray-600">Audio file uploaded</span>
                </div>
                <span className="text-sm text-gray-500">15 minutes ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-[var(--primary)] rounded-full mr-3"></div>
                  <span className="text-gray-600">Dhamma post published</span>
                </div>
                <span className="text-sm text-gray-500">1 hour ago</span>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}


