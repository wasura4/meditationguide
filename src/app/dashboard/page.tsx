'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { MeditationService } from '@/lib/meditationService';
import { MeditationSession } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  thisWeekMinutes: number;
  lastWeekMinutes: number;
  favoriteMeditationType: string;
  dhammaPostsRead: number;
  audioSessions: number;
  averageSessionLength: number;
  weeklyGoal: number;
  weeklyGoalProgress: number;
  meditationTypes: Array<{
    typeId: string;
    typeName: string;
    sessions: number;
    minutes: number;
  }>;
  recentSessions: MeditationSession[];
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const userStats = await MeditationService.getUserStats(user.id);
        
        // Calculate weekly stats manually
        const allSessions = await MeditationService.getUserSessions(user.id, 1000);
        const now = new Date();
        const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);
        const thisWeekEnd = new Date(thisWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastWeekEnd = new Date(thisWeekStart.getTime() - 24 * 60 * 60 * 1000);

        const thisWeekSessions = allSessions.filter(session => 
          session.createdAt >= thisWeekStart && session.createdAt <= thisWeekEnd
        );
        const lastWeekSessions = allSessions.filter(session => 
          session.createdAt >= lastWeekStart && session.createdAt <= lastWeekEnd
        );

        const thisWeekMinutes = thisWeekSessions.reduce((sum, session) => sum + session.duration, 0);
        const lastWeekMinutes = lastWeekSessions.reduce((sum, session) => sum + session.duration, 0);
        const weeklyGoal = 200;
        const weeklyGoalProgress = Math.min((thisWeekMinutes / weeklyGoal) * 100, 100);

        // Calculate meditation types breakdown
        const typeCounts: Record<string, { sessions: number; minutes: number; name: string }> = {};
        allSessions.forEach(session => {
          if (!typeCounts[session.typeId]) {
            typeCounts[session.typeId] = { sessions: 0, minutes: 0, name: session.typeName };
          }
          typeCounts[session.typeId].sessions += 1;
          typeCounts[session.typeId].minutes += session.duration;
        });

        const meditationTypes = Object.entries(typeCounts).map(([typeId, data]) => ({
          typeId,
          typeName: data.name,
          sessions: data.sessions,
          minutes: data.minutes,
        }));

        // Get recent sessions (last 5)
        const recentSessions = allSessions
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5);

        setStats({
          totalSessions: userStats.totalSessions,
          totalMinutes: userStats.totalMinutes,
          currentStreak: userStats.currentStreak,
          longestStreak: userStats.longestStreak,
          thisWeekMinutes,
          lastWeekMinutes,
          favoriteMeditationType: userStats.favoriteType || 'None yet',
          dhammaPostsRead: 0, // TODO: Implement user reading tracking
          audioSessions: 0, // TODO: Implement audio session tracking
          averageSessionLength: userStats.averageSessionLength,
          weeklyGoal,
          weeklyGoalProgress,
          meditationTypes,
          recentSessions,
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Fallback to empty stats if there's an error
        setStats({
          totalSessions: 0,
          totalMinutes: 0,
          currentStreak: 0,
          longestStreak: 0,
          thisWeekMinutes: 0,
          lastWeekMinutes: 0,
          favoriteMeditationType: 'None yet',
          dhammaPostsRead: 0,
          audioSessions: 0,
          averageSessionLength: 0,
          weeklyGoal: 200,
          weeklyGoalProgress: 0,
          meditationTypes: [],
          recentSessions: [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getMotivationalMessage = () => {
    if (!stats) return t('dashboard.motivation.ready_begin');
    
    if (stats.currentStreak >= 7) {
      return t('dashboard.motivation.strong_habit');
    } else if (stats.currentStreak >= 3) {
      return t('dashboard.motivation.good_progress');
    } else if (stats.currentStreak >= 1) {
      return t('dashboard.motivation.good_start');
    } else {
      return t('dashboard.motivation.ready_begin');
    }
  };

  const getProgressPercentage = () => {
    if (!stats) return 0;
    return stats.weeklyGoalProgress;
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 21) return "";
    if (streak >= 14) return "";
    if (streak >= 7) return "";
    if (streak >= 3) return "";
    return "";
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-16 py-3 sm:py-0">
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {t('dashboard.title')}
                </h1>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {t('common.welcome')}, {user?.displayName}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {t('auth.sign_out')}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Welcome & Motivation Section */}
          <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
              <div className="flex flex-col lg:flex-row items-start justify-between">
                <div className="flex-1 mb-6 lg:mb-0">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                    {t('dashboard.welcome', { name: user?.displayName || 'User' })} 
                  </h2>
                  <p className="text-lg sm:text-xl text-purple-100 mb-4 sm:mb-6">
                    {getMotivationalMessage()}
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl sm:text-2xl">{getStreakEmoji(stats?.currentStreak || 0)}</span>
                      <span className="text-base sm:text-lg font-semibold">
                        {stats?.currentStreak || 0} day streak
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl sm:text-2xl"></span>
                      <span className="text-base sm:text-lg font-semibold">
                        {stats?.totalMinutes || 0} total minutes
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center lg:text-right">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Total Sessions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.stats.total_sessions')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalSessions}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Current Streak */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.stats.current_streak')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats?.currentStreak}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('dashboard.stats.days')}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">{getStreakEmoji(stats?.currentStreak || 0)}</span>
                </div>
              </div>
            </div>

            {/* This Week */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.stats.this_week')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats?.thisWeekMinutes}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('dashboard.stats.minutes')}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Longest Streak */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Longest Streak</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.longestStreak}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">days</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Average Session Length */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Session</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.averageSessionLength || 0}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">minutes</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Progress & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Weekly Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Weekly Goal ({stats?.weeklyGoal || 200} min)</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stats?.thisWeekMinutes || 0}/{stats?.weeklyGoal || 200} min
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {stats?.thisWeekMinutes || 0} min this week
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {stats?.lastWeekMinutes || 0} min last week
                  </span>
                </div>
              </div>
            </div>

            {/* Learning Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Learning Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 5.754 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Dhamma Posts</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats?.dhammaPostsRead || 0}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Audio Sessions</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats?.audioSessions || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Start Meditating */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Start Meditating */}
            <div className="lg:col-span-2 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 shadow-sm border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Ready to Meditate? 
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Your favorite meditation type is <strong>{stats?.favoriteMeditationType}</strong>. 
                    Start a session now and continue building your practice.
                  </p>
                  <Button
                    onClick={() => router.push('/meditate')}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    size="lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Meditating
                  </Button>
                </div>
                <div className="hidden lg:block">
                  <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/logbook')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253" />
                  </svg>
                  View Logbook
                </Button>
                
                <Button
                  onClick={() => router.push('/kamatahan')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  Audio Library
                </Button>
                
                <Button
                  onClick={() => router.push('/dhamma')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Dhamma Library
                </Button>
                
                <Button
                  onClick={() => router.push('/analytics')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Analytics
                </Button>
                
                <Button
                  onClick={() => router.push('/settings')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Meditation Types Breakdown */}
          {stats?.meditationTypes && stats.meditationTypes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Meditation Types Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.meditationTypes.map((type) => (
                  <div key={type.typeId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">{type.typeName}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{type.sessions} sessions</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{type.minutes} min</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          {stats?.recentSessions && stats.recentSessions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Sessions</h3>
              <div className="space-y-3">
                {stats.recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{session.typeName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {session.createdAt.toLocaleDateString()} • {session.duration} min
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {session.status === 'completed' ? '✅' : '⏸️'} {session.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guest Upgrade Notice */}
          {user?.isAnonymous && (
            <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                    Upgrade Your Account
                  </h3>
                  <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    You are currently using a guest account. Upgrade to a full account to save your progress, 
                    track your meditation sessions, and access all features.
                  </p>
                  <div className="mt-4">
                    <Button
                      onClick={() => router.push('/auth?mode=register')}
                      variant="outline"
                      size="sm"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/30"
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
