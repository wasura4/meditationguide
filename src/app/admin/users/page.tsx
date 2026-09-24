'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminService } from '@/lib/adminService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { MeditationSession } from '@/types';
import { PATH_STAGES } from '@/constants/path';

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
  const cursor = useRef<QueryDocumentSnapshot | undefined>(undefined);
  const selectedRequest = useRef(0);
  const canRead = hasPermission('users', 'read');
  const { showToast } = useToast();

  const pageSize = 20;

  useEffect(() => {
    if (!canRead) return;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        if (searchTerm.trim()) {
          const results = await AdminService.searchUsers(searchTerm.trim());
          if (cancelled) return;
          setUsers(results); setHasMore(false);
        } else {
          const result = await AdminService.getUsers(pageSize, currentPage > 1 ? cursor.current : undefined);
          if (cancelled) return;
          setUsers(previous => currentPage === 1 ? result.users : [...previous,...result.users]);
          cursor.current = result.lastDoc; setHasMore(result.users.length === pageSize);
        }
      } catch {
        if (!cancelled) showToast({type:'error',title:'Unable to load users',message:'Check your connection and try again.'});
      } finally { if (!cancelled) setLoading(false); }
    }, searchTerm.trim() ? 300 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [currentPage,searchTerm,canRead,showToast]);

  const loadUserSessions = async (userId: string) => {
    const request = ++selectedRequest.current;
    try {
      setLoadingSessions(true);
      setStats({totalSessions:0,totalMinutes:0,averageSession:0});
      const recent: MeditationSession[] = await AdminService.getUserSessions(userId, 50);
      if (request !== selectedRequest.current) return;
      const sessions = recent.filter(session => session.status === 'completed' && Number.isFinite(session.duration) && session.duration > 0);
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
      if (request !== selectedRequest.current) return;
      console.error('Error loading user sessions:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load user sessions',
        duration: 5000,
      });
    } finally {
      if (request === selectedRequest.current) setLoadingSessions(false);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    loadUserSessions(user.id);
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
            <p className="text-muted-foreground">You don&apos;t have permission to view users.</p>
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
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground mt-1">Manage and monitor all platform users</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-card rounded-xl p-4 shadow-lg border border-border">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="block w-full pl-10 pr-3 py-2 border border-input rounded-lg leading-5 bg-card text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Users List */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl shadow-lg border border-border">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">
                    Users ({users.length})
                  </h2>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b9e7a] mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading users...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleUserClick(user)}
                        className={`px-6 py-4 hover:bg-muted cursor-pointer transition-colors ${
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
                              <p className="text-sm font-medium text-foreground">
                                {user.displayName || 'No Name'}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {user.pathProgress && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800 border border-violet-200">
                                Stage {user.pathProgress.currentStage}/8
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Joined {formatDate(user.createdAt)}
                            </span>
                            {hasPermission('users', 'delete') && (
                              <Button
                                disabled title="Account suspension must be managed in Firebase Authentication until a trusted backend workflow is connected."
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
                  <div className="px-6 py-4 border-t border-border">
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
                <div className="bg-card rounded-xl shadow-lg border border-border">
                  <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">User Details</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#6b9e7a] rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white text-xl font-semibold">
                          {((selectedUser.displayName && selectedUser.displayName !== 'Anonymous User' ? selectedUser.displayName : (selectedUser.email || 'U'))).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {selectedUser.displayName && selectedUser.displayName !== 'Anonymous User' ? selectedUser.displayName : (selectedUser.email?.split('@')[0] || 'User')}
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">User ID</p>
                        <p className="text-sm font-mono text-foreground">{selectedUser.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Joined</p>
                        <p className="text-sm text-foreground">{formatDate(selectedUser.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Last Updated</p>
                        <p className="text-sm text-foreground">{formatDate(selectedUser.updatedAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Theme</p>
                        <p className="text-sm text-foreground capitalize">{selectedUser.preferences?.theme || 'light'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Language</p>
                        <p className="text-sm text-foreground uppercase">{selectedUser.preferences?.language || 'en'}</p>
                      </div>
                    </div>

                    {/* Path Progress Section */}
                    {selectedUser.pathProgress && (
                      <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Seven Purifications Path</h3>
                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg p-4 border border-violet-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-violet-600 font-medium">Current Stage</span>
                            <span className="text-xs text-violet-600 font-semibold">
                              {selectedUser.pathProgress.currentStage} of 8
                            </span>
                          </div>
                          <div className="mb-3">
                            <p className="text-sm font-bold text-violet-900">
                              {PATH_STAGES.find(s => s.order === selectedUser.pathProgress!.currentStage)?.name || '-'}
                            </p>
                            <p className="text-xs text-violet-700 mt-1">
                              {PATH_STAGES.find(s => s.order === selectedUser.pathProgress!.currentStage)?.nameEn || '-'}
                            </p>
                          </div>
                          <div className="h-2 bg-violet-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${((selectedUser.pathProgress.currentStage - 1) / 7) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-violet-600 mt-2">
                            Last updated: {formatDate(selectedUser.pathProgress.updatedAt)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Recent practice · latest 50 records</h3>
                      {loadingSessions ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6b9e7a] mx-auto"></div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-muted rounded p-3">
                            <p className="text-muted-foreground">Completed sessions</p>
                            <p className="text-lg font-semibold text-foreground">{stats.totalSessions}</p>
                          </div>
                          <div className="bg-muted rounded p-3">
                            <p className="text-muted-foreground">Completed minutes</p>
                            <p className="text-lg font-semibold text-foreground">{stats.totalMinutes}</p>
                          </div>
                          <div className="bg-muted rounded p-3">
                            <p className="text-muted-foreground">Avg. Session</p>
                            <p className="text-lg font-semibold text-foreground">{stats.averageSession} min</p>
                          </div>
                          <div className="bg-muted rounded p-3">
                            <p className="text-muted-foreground">Top Meditation</p>
                            <p className="text-sm font-semibold text-foreground">{stats.topMeditation?.typeName || '-'}</p>
                          </div>
                          <div className="bg-muted rounded p-3 col-span-2">
                            <p className="text-muted-foreground">Last Session</p>
                            <p className="text-sm font-semibold text-foreground">{stats.lastSessionAt ? formatDate(stats.lastSessionAt) : '-'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-xl shadow-lg border border-border p-6 text-center">
                  <p className="text-muted-foreground">Select a user to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}



