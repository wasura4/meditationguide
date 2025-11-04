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

// Activity Ring Component
const ActivityRing = ({ progress, color, size = 120, strokeWidth = 12 }: { progress: number; color: string; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--gray-200)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out ring-animate"
      />
    </svg>
  );
};

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
          dhammaPostsRead: 0,
          audioSessions: 0,
          averageSessionLength: userStats.averageSessionLength,
          weeklyGoal,
          weeklyGoalProgress,
          meditationTypes,
          recentSessions,
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[var(--background)]">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-[var(--muted-foreground)]">{t('common.loading')}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const streakProgress = Math.min((stats?.currentStreak || 0) / 30 * 100, 100);
  const sessionProgress = Math.min((stats?.totalSessions || 0) / 100 * 100, 100);
  const minutesProgress = Math.min((stats?.thisWeekMinutes || 0) / (stats?.weeklyGoal || 200) * 100, 100);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        {/* Header */}
        <header className="glass sticky top-0 z-50 border-b border-[var(--border)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h1 className="text-lg font-semibold text-[var(--foreground)]">Summary</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-[var(--muted-foreground)] hidden sm:inline">
                  {user?.displayName}
                </span>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Activity Rings */}
          <div className="health-card mb-8 fade-in">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl lg:text-2xl font-bold text-[var(--foreground)]">Activity</h2>
              <button className="text-sm font-medium text-[var(--primary)]">View All</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
              {/* Sessions Ring */}
              <div className="flex flex-col items-center py-4">
                <div className="relative mb-4">
                  <ActivityRing progress={sessionProgress} color="var(--ring-move)" size={140} strokeWidth={12} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-[var(--foreground)]">{stats?.totalSessions}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)] mt-3 tracking-wide">SESSIONS</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Goal: 100</p>
              </div>

              {/* Weekly Minutes Ring */}
              <div className="flex flex-col items-center py-4">
                <div className="relative mb-4">
                  <ActivityRing progress={minutesProgress} color="var(--ring-exercise)" size={140} strokeWidth={12} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-[var(--foreground)]">{stats?.thisWeekMinutes}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)] mt-3 tracking-wide">WEEKLY MIN</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Goal: {stats?.weeklyGoal}</p>
              </div>

              {/* Streak Ring */}
              <div className="flex flex-col items-center py-4">
                <div className="relative mb-4">
                  <ActivityRing progress={streakProgress} color="var(--ring-stand)" size={140} strokeWidth={12} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-[var(--foreground)]">{stats?.currentStreak}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)] mt-3 tracking-wide">DAY STREAK</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Goal: 30 days</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 fade-in fade-in-delay-1">
            {/* Total Minutes */}
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(250, 17, 79, 0.1)' }}>
                <svg className="w-5 h-5" style={{ color: 'var(--ring-move)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Total Minutes</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats?.totalMinutes}</p>
              </div>
            </div>

            {/* Average Session */}
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(146, 232, 42, 0.1)' }}>
                <svg className="w-5 h-5" style={{ color: 'var(--ring-exercise)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Avg Session</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats?.averageSessionLength || 0}</p>
              </div>
            </div>

            {/* Longest Streak */}
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(0, 199, 190, 0.1)' }}>
                <svg className="w-5 h-5" style={{ color: 'var(--ring-stand)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Best Streak</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats?.longestStreak}</p>
              </div>
            </div>

            {/* This Week */}
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(0, 122, 255, 0.1)' }}>
                <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">This Week</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats?.thisWeekMinutes} min</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8 fade-in fade-in-delay-2">
            <button
              onClick={() => router.push('/meditate')}
              className="health-card flex items-center justify-between py-5 px-5 hover:scale-[1.02]"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(250, 17, 79, 0.1)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--ring-move)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-semibold text-[var(--foreground)] text-base">Start Session</span>
              </div>
              <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push('/analytics')}
              className="health-card flex items-center justify-between py-5 px-5 hover:scale-[1.02]"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(146, 232, 42, 0.1)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--ring-exercise)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="font-semibold text-[var(--foreground)] text-base">View Analytics</span>
              </div>
              <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push('/logbook')}
              className="health-card flex items-center justify-between py-5 px-5 hover:scale-[1.02]"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 199, 190, 0.1)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--ring-stand)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="font-semibold text-[var(--foreground)] text-base">View Logbook</span>
              </div>
              <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Recent Sessions */}
          {stats?.recentSessions && stats.recentSessions.length > 0 && (
            <div className="health-card fade-in fade-in-delay-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-[var(--foreground)]">Recent Sessions</h2>
                <button className="text-sm font-medium text-[var(--primary)]">View All</button>
              </div>
              <div className="space-y-4">
                {stats.recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--muted)]">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 122, 255, 0.1)' }}>
                        <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-[var(--foreground)] text-base">{session.typeName}</p>
                        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                          {session.createdAt.toLocaleDateString()} • {session.duration} min
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-[var(--success)]">
                      {session.status === 'completed' ? '✓ Completed' : '⏸ Paused'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
