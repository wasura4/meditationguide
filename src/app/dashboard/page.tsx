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
              <p className="text-[17px] text-[var(--muted-foreground)]">{t('common.loading')}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        {/* Header */}
        <header className="glass sticky top-0 z-50">
          <div className="max-w-[1120px] mx-auto px-6">
            <div className="flex justify-between items-center h-[52px]">
              <h1 className="text-[21px] font-semibold text-[var(--foreground)]">
                {t('dashboard.title')}
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-[14px] text-[var(--muted-foreground)] hidden sm:inline">
                  {t('common.welcome')}, {user?.displayName}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                >
                  {t('auth.sign_out')}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1120px] mx-auto px-6 py-8">
          {/* Welcome Section */}
          <div className="card-elevated p-8 mb-8 fade-in">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-[32px] font-semibold text-[var(--foreground)] mb-2 tracking-tight">
                  {t('dashboard.welcome', { name: user?.displayName || 'User' })}
                </h2>
                <p className="text-[21px] text-[var(--muted-foreground)] mb-6">
                  You&apos;re on a {stats?.currentStreak || 0} day streak
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => router.push('/meditate')}
                    className="btn-apple btn-primary text-[17px] px-6"
                  >
                    Start Meditating
                  </button>
                  <button
                    onClick={() => router.push('/logbook')}
                    className="btn-apple btn-secondary text-[17px] px-6"
                  >
                    View Logbook
                  </button>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-24 h-24 bg-[var(--primary)] bg-opacity-10 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 fade-in fade-in-delay-1">
            <div className="card-elevated p-6">
              <p className="text-[13px] font-medium text-[var(--muted-foreground)] mb-1">{t('dashboard.stats.total_sessions')}</p>
              <p className="text-[40px] font-semibold text-[var(--foreground)] leading-tight">{stats?.totalSessions}</p>
            </div>

            <div className="card-elevated p-6">
              <p className="text-[13px] font-medium text-[var(--muted-foreground)] mb-1">{t('dashboard.stats.current_streak')}</p>
              <p className="text-[40px] font-semibold text-[var(--foreground)] leading-tight">{stats?.currentStreak}</p>
              <p className="text-[13px] text-[var(--muted-foreground)]">{t('dashboard.stats.days')}</p>
            </div>

            <div className="card-elevated p-6">
              <p className="text-[13px] font-medium text-[var(--muted-foreground)] mb-1">{t('dashboard.stats.this_week')}</p>
              <p className="text-[40px] font-semibold text-[var(--foreground)] leading-tight">{stats?.thisWeekMinutes}</p>
              <p className="text-[13px] text-[var(--muted-foreground)]">{t('dashboard.stats.minutes')}</p>
            </div>

            <div className="card-elevated p-6">
              <p className="text-[13px] font-medium text-[var(--muted-foreground)] mb-1">Avg. Session</p>
              <p className="text-[40px] font-semibold text-[var(--foreground)] leading-tight">{stats?.averageSessionLength || 0}</p>
              <p className="text-[13px] text-[var(--muted-foreground)]">minutes</p>
            </div>
          </div>

          {/* Progress & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 fade-in fade-in-delay-2">
            {/* Weekly Progress */}
            <div className="card-elevated p-8">
              <h3 className="text-[21px] font-semibold text-[var(--foreground)] mb-6">Weekly Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-[var(--muted-foreground)]">Weekly Goal ({stats?.weeklyGoal || 200} min)</span>
                  <span className="text-[14px] font-medium text-[var(--foreground)]">
                    {stats?.thisWeekMinutes || 0}/{stats?.weeklyGoal || 200}
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-500 rounded-full"
                    style={{ width: `${stats?.weeklyGoalProgress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card-elevated p-8">
              <h3 className="text-[21px] font-semibold text-[var(--foreground)] mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/analytics')}
                  className="btn-apple btn-secondary w-full text-[14px] justify-start"
                >
                  View Analytics
                </button>
                <button
                  onClick={() => router.push('/kamatahan')}
                  className="btn-apple btn-secondary w-full text-[14px] justify-start"
                >
                  Audio Library
                </button>
                <button
                  onClick={() => router.push('/dhamma')}
                  className="btn-apple btn-secondary w-full text-[14px] justify-start"
                >
                  Dhamma Library
                </button>
                <button
                  onClick={() => router.push('/settings')}
                  className="btn-apple btn-secondary w-full text-[14px] justify-start"
                >
                  Settings
                </button>
              </div>
            </div>
          </div>

          {/* Meditation Types Breakdown */}
          {stats?.meditationTypes && stats.meditationTypes.length > 0 && (
            <div className="card-elevated p-8 mb-8 fade-in fade-in-delay-3">
              <h3 className="text-[21px] font-semibold text-[var(--foreground)] mb-6">Meditation Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.meditationTypes.map((type) => (
                  <div key={type.typeId} className="bg-[var(--muted)] rounded-[var(--radius)] p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--foreground)] text-[15px]">{type.typeName}</span>
                      <span className="text-[13px] text-[var(--muted-foreground)]">{type.sessions} sessions</span>
                    </div>
                    <div className="text-[32px] font-semibold text-[var(--primary)] leading-tight">{type.minutes} min</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          {stats?.recentSessions && stats.recentSessions.length > 0 && (
            <div className="card-elevated p-8 fade-in fade-in-delay-4">
              <h3 className="text-[21px] font-semibold text-[var(--foreground)] mb-6">Recent Sessions</h3>
              <div className="space-y-3">
                {stats.recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-[var(--muted)] rounded-[var(--radius)]">
                    <div>
                      <div className="font-medium text-[var(--foreground)] text-[15px]">{session.typeName}</div>
                      <div className="text-[13px] text-[var(--muted-foreground)]">
                        {session.createdAt.toLocaleDateString()} • {session.duration} min
                      </div>
                    </div>
                    <div className="text-[13px] font-medium text-[var(--foreground)]">
                      {session.status === 'completed' ? '✓' : '⏸'} {session.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guest Upgrade Notice */}
          {user?.isAnonymous && (
            <div className="mt-8 bg-[var(--warning)] bg-opacity-10 border border-[var(--warning)] border-opacity-30 rounded-[var(--radius)] p-6">
              <h3 className="text-[17px] font-semibold text-[var(--foreground)] mb-2">
                Upgrade Your Account
              </h3>
              <p className="text-[14px] text-[var(--muted-foreground)] mb-4">
                Save your progress permanently by upgrading to a full account.
              </p>
              <button
                onClick={() => router.push('/auth?mode=register')}
                className="btn-apple btn-primary text-[14px] px-5"
              >
                Upgrade Now
              </button>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
