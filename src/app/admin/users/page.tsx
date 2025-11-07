'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminService } from '@/lib/adminService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { MeditationSession } from '@/types';

export default function AdminUsersPage() {
  const { hasPermission } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [stats, setStats] = useState<{
    totalSessions: number;
    totalMinutes: number;
    averageSession: number;
    topMeditation?: { typeId: string; typeName: string; count: number; minutes: number };
    lastSessionAt?: Date;
  }>({ totalSessions: 0, totalMinutes: 0, averageSession: 0 });
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | undefined>(undefined);
  const { showToast } = useToast();

  const pageSize = 20;

  // Load users for the current page. Important: do NOT include `lastDoc` in deps
  // to avoid recreating the callback when pagination cursor updates (which
  // can cause useEffect loops). We read the latest `lastDoc` from state.
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await AdminService.getUsers(pageSize, currentPage > 1 ? lastDoc : undefined);
      if (currentPage === 1) {
        setUsers(result.users);
      } else {
        setUsers(prev => [...prev, ...result.users]);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.users.length === pageSize);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load users',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [pageSize, currentPage, showToast]);

  const searchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const results = await AdminService.searchUsers(searchTerm);
      setUsers(results);
      setHasMore(false);
    } catch (error) {
      console.error('Error searching users:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to search users',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showToast]);

  useEffect(() => {
    if (!hasPermission('users', 'read')) return;
    // When searching, skip paged loading; search effect handles it.
    if (searchTerm.trim().length > 0) return;
    // Intentionally not including `loadUsers` to avoid loops when its identity
    // changes due to state updates inside it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, hasPermission, searchTerm]);

  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length > 0) {
      searchUsers();
    } else {
      // Reset to page 1 and let the other effect load
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const loadUserSessions = async (userId: string) => {
    try {
      setLoadingSessions(true);
      const sessions: MeditationSession[] = await AdminService.getUserSessions(userId, 50);
            // Compute quick stats for the right panel
      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const averageSession = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
      type ByType = Record<string, { typeId: string; typeName: string; count: number; minutes: number }>;
      const byType: ByType = {};
      sessions.forEach((s) => {
        const key = s.typeId || s.typeName || 'unknown';
        if (!byType[key]) byType[key] = { typeId: s.typeId || key, typeName: s.typeName || 'Unknown', count: 0, minutes: 0 } ;
        byType[key].count += 1;
        byType[key].minutes += s.duration || 0;
      });
      const topMeditation = Object.values(byType).sort((a, b) => b.count - a.count || b.minutes - a.minutes)[0] ;
      const lastSessionAt = sessions.length ? sessions.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt : undefined;
      setStats({ totalSessions, totalMinutes, averageSession, topMeditation, lastSessionAt });
    } catch (error) {
      console.error('Error loading user sessions:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load user sessions',
        duration: 5000,
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    loadUserSessions(user.id);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user? This action cannot be undone.')) {
      return;
    }

    try {
      await AdminService.deleteUser(userId);
      showToast({
        type: 'success',
        title: 'Success',
        message: 'User deactivated successfully',
        duration: 3000,
      });
      setUsers(users.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to deactivate user',
        duration: 5000,
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!hasPermission('users', 'read')) {
    return (
      <AdminProtectedRoute>
        <AdminLayout currentPage="/admin/users">
          <div className="text-center py-12">
            <p className="text-gray-600">You don&apos;t have permission to view users.</p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/users">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage and monitor all platform users</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Users List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Users ({users.length})
                  </h2>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b9e7a] mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading users...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleUserClick(user)}
                        className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedUser?.id === user.id ? 'bg-[#f0f7f4]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-[#6b9e7a] rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">
                                {user.displayName || 'No Name'}
                              </p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              Joined {formatDate(user.createdAt)}
                            </span>
                            {hasPermission('users', 'delete') && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUser(user.id);
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-[var(--color-status-error)]/10"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!searchTerm && hasMore && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <Button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      variant="outline"
                      className="w-full"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* User Details */}
            <div className="lg:col-span-1">
              {selectedUser ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">User Details</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#6b9e7a] rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white text-xl font-semibold">
                          {((selectedUser.displayName && selectedUser.displayName !== 'Anonymous User' ? selectedUser.displayName : (selectedUser.email || 'U'))).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedUser.displayName && selectedUser.displayName !== 'Anonymous User' ? selectedUser.displayName : (selectedUser.email?.split('@')[0] || 'User')}
                      </p>
                      <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">User ID</p>
                        <p className="text-sm font-mono text-gray-900">{selectedUser.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Joined</p>
                        <p className="text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Last Updated</p>
                        <p className="text-sm text-gray-900">{formatDate(selectedUser.updatedAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Theme</p>
                        <p className="text-sm text-gray-900 capitalize">{selectedUser.preferences?.theme || 'light'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Language</p>
                        <p className="text-sm text-gray-900 uppercase">{selectedUser.preferences?.language || 'en'}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Stats</h3>
                      {loadingSessions ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6b9e7a] mx-auto"></div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-gray-500">Total Sessions</p>
                            <p className="text-lg font-semibold text-gray-900">{stats.totalSessions}</p>
                          </div>
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-gray-500">Total Minutes</p>
                            <p className="text-lg font-semibold text-gray-900">{stats.totalMinutes}</p>
                          </div>
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-gray-500">Avg. Session</p>
                            <p className="text-lg font-semibold text-gray-900">{stats.averageSession} min</p>
                          </div>
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-gray-500">Top Meditation</p>
                            <p className="text-sm font-semibold text-gray-900">{stats.topMeditation?.typeName || '-'}</p>
                          </div>
                          <div className="bg-gray-50 rounded p-3 col-span-2">
                            <p className="text-gray-500">Last Session</p>
                            <p className="text-sm font-semibold text-gray-900">{stats.lastSessionAt ? formatDate(stats.lastSessionAt) : '-'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">Select a user to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}



