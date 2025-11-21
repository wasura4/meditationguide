'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { MeditationService } from '@/lib/meditationService';
import { MeditationSession } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { DhammaService } from '@/lib/dhammaService';
import { getUserAudioSessionCount, getUserDhammaReadsCount } from '@/lib/metricsService';
import { DhammaPost } from '@/types/admin';
import { DhammaPostCard } from '@/components/dhamma';

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
  const [recommended, setRecommended] = useState<DhammaPost[]>([]);

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

        try {
          const posts = await DhammaService.getPublishedPosts();
          setRecommended(posts.slice(0, 2));
        } catch {}

        // Learning progress (per-user)
        const [audioSessions, dhammaReads] = await Promise.all([
          getUserAudioSessionCount(user.id),
          getUserDhammaReadsCount(user.id),
        ]);

        // Resolve favorite meditation type name from id
        const favoriteTypeId = userStats.favoriteType;
        const favoriteTypeName = meditationTypes.find(t => t.typeId === favoriteTypeId)?.typeName || 'None yet';

        setStats({
          totalSessions: userStats.totalSessions,
          totalMinutes: userStats.totalMinutes,
          currentStreak: userStats.currentStreak,
          longestStreak: userStats.longestStreak,
          thisWeekMinutes,
          lastWeekMinutes,
          favoriteMeditationType: favoriteTypeName,
          dhammaPostsRead: dhammaReads,
          audioSessions,
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

  const StreakIcon = () => (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-amber-100">
      <Flame className="w-5 h-5 text-amber-600" />
    </span>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Simplified Header */}
        <header className="bg-background/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t('dashboard.title')}</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">{t('common.welcome')}, {user?.displayName}</p>
                </div>
              </div>
              <button
                aria-label="Settings"
                onClick={() => router.push('/settings')}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <SettingsIcon size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Hero Welcome Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 rounded-3xl p-8 sm:p-10 text-primary-foreground shadow-2xl">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/10 rounded-full -ml-24 -mb-24"></div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="inline-flex items-center gap-2 bg-primary-foreground/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                    <Flame className="w-4 h-4" />
                    <span>{stats?.currentStreak || 0} day streak</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                    {t('dashboard.welcome', { name: user?.displayName || 'User' })}
                  </h2>
                  <p className="text-lg sm:text-xl opacity-90 max-w-2xl">
                    {getMotivationalMessage()}
                  </p>
                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats?.totalMinutes || 0}</div>
                        <div className="text-sm opacity-80">total minutes</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
                        <div className="text-sm opacity-80">sessions</div>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/meditate')}
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 font-semibold px-8"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Meditating
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Grid - Modern Cards with Visual Hierarchy */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Sessions */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold mb-1">{stats?.totalSessions}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.stats.total_sessions')}</p>
              </div>
            </div>

            {/* Current Streak */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-orange-500/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-500/10 dark:bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold mb-1">{stats?.currentStreak}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.stats.current_streak')}</p>
              </div>
            </div>

            {/* This Week */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-green-500/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/10 dark:bg-green-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold mb-1">{stats?.thisWeekMinutes}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.stats.this_week')}</p>
              </div>
            </div>

            {/* Longest Streak */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-purple-500/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold mb-1">{stats?.longestStreak}</p>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
              </div>
            </div>

            {/* Average Session */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-indigo-500/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold mb-1">{stats?.averageSessionLength || 0}m</p>
                <p className="text-sm text-muted-foreground">Avg. Session</p>
              </div>
            </div>
          </div>

          {/* Progress & Learning - 2 Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Progress */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Weekly Progress</h3>
                <span className="text-sm font-medium text-primary bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full">{Math.round(getProgressPercentage())}%</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Goal: {stats?.weeklyGoal || 200} min</span>
                    <span className="font-medium">{stats?.thisWeekMinutes || 0}/{stats?.weeklyGoal || 200}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary via-primary to-primary/80 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-muted/50 rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">This Week</div>
                    <div className="text-xl font-bold">{stats?.thisWeekMinutes || 0}m</div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">Last Week</div>
                    <div className="text-xl font-bold">{stats?.lastWeekMinutes || 0}m</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Progress */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
              <h3 className="text-lg font-semibold mb-4">Learning Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/10 dark:hover:bg-blue-500/15 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 5.754 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253" />
                      </svg>
                    </div>
                    <span className="font-medium">Dhamma Posts</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.dhammaPostsRead || 0}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-500/5 dark:bg-purple-500/10 rounded-xl border border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/10 dark:hover:bg-purple-500/15 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <span className="font-medium">Audio Sessions</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats?.audioSessions || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Modern Grid */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.actions.quick_actions')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <button
                onClick={() => router.push('/logbook')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:shadow-md hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-10 bg-primary/10 group-hover:bg-primary/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 5.754 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-center">Logbook</span>
              </button>

              <button
                onClick={() => router.push('/kamatahan')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background border border-border hover:border-purple-500/50 hover:shadow-md hover:bg-purple-500/5 transition-all group"
              >
                <div className="w-10 h-10 bg-purple-500/10 group-hover:bg-purple-500/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-center">Audio</span>
              </button>

              <button
                onClick={() => router.push('/dhamma')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:shadow-md hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-500/10 group-hover:bg-blue-500/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-center">Dhamma</span>
              </button>

              <button
                onClick={() => router.push('/analytics')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:shadow-md hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-10 bg-green-500/10 group-hover:bg-green-500/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-center">Analytics</span>
              </button>

              <button
                onClick={() => router.push('/pitaka')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:shadow-md hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-10 bg-amber-500/10 group-hover:bg-amber-500/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a2 2 0 012-2h9a2 2 0 012 2v14l-4-2-4 2V5H6a2 2 0 00-2 2v12" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-center">Tripitaka</span>
              </button>

              <button
                onClick={() => router.push('/mypath')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:shadow-md hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-10 bg-violet-500/10 group-hover:bg-violet-500/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-center">My Path</span>
              </button>

              <button
                onClick={() => router.push('/meditation-questions')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:shadow-md hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-10 bg-orange-500/10 group-hover:bg-orange-500/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-center">Questions</span>
              </button>

              <button
                onClick={() => router.push('/books')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:shadow-md hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-10 bg-rose-500/10 group-hover:bg-rose-500/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-center">Books Library</span>
              </button>
            </div>
          </div>

          {/* Meditation Types Breakdown */}
          {stats?.meditationTypes && stats.meditationTypes.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4">Meditation Types Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.meditationTypes.map((type) => (
                  <div key={type.typeId} className="bg-muted/30 dark:bg-muted/50 border border-border rounded-xl p-4 hover:bg-muted/50 dark:hover:bg-muted/70 hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{type.typeName}</span>
                      <span className="text-xs text-muted-foreground px-2 py-1 bg-background border border-border rounded-full">{type.sessions}</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">{type.minutes} min</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Articles */}
          {recommended.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recommended For You</h3>
                <Button onClick={() => router.push('/dhamma')} variant="ghost" size="sm">
                  View All →
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommended.map((post) => (
                  <DhammaPostCard key={post.id} post={post} onClick={() => router.push(`/dhamma/${post.id}`)} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          {stats?.recentSessions && stats.recentSessions.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
              <div className="space-y-2">
                {stats.recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-muted/20 dark:bg-muted/40 hover:bg-muted/40 dark:hover:bg-muted/60 border border-border hover:border-primary/30 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">{session.typeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {session.createdAt.toLocaleDateString()} • {session.duration} min
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 bg-background rounded-full">
                        {session.status === 'completed' ? '✓' : '○'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guest Upgrade Notice */}
          {user?.isAnonymous && (
            <div className="mt-8 bg-accent/50 border rounded-xl p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium">
                    Upgrade Your Account
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You are currently using a guest account. Upgrade to a full account to save your progress,
                    track your meditation sessions, and access all features.
                  </p>
                  <div className="mt-4">
                    <Button
                      onClick={() => router.push('/auth?mode=register')}
                      variant="outline"
                      size="sm"
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
        {/* Bottom padding for safe area */}
        <div className="pb-24" />
      </div>
    </ProtectedRoute>
  );
}




