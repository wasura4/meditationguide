'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Settings as SettingsIcon,
  Activity,
  Clock,
  Calendar,
  BookOpen,
  Headphones,
  TrendingUp,
  ArrowRight,
  Play,
  HelpCircle,
  Library
} from 'lucide-react';
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
import { EventBanner } from '@/components/events/EventBanner';
import { motion } from 'framer-motion';

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

        const thisWeekMinutes = thisWeekSessions.reduce((sum, session) => sum + (Number(session.duration) || 0), 0);
        const lastWeekMinutes = lastWeekSessions.reduce((sum, session) => sum + (Number(session.duration) || 0), 0);
        const weeklyGoal = 200;
        const weeklyGoalProgress = Math.min((thisWeekMinutes / weeklyGoal) * 100, 100);

        // Calculate meditation types breakdown
        const typeCounts: Record<string, { sessions: number; minutes: number; name: string }> = {};
        allSessions.forEach(session => {
          if (!typeCounts[session.typeId]) {
            typeCounts[session.typeId] = { sessions: 0, minutes: 0, name: session.typeName };
          }
          typeCounts[session.typeId].sessions += 1;
          typeCounts[session.typeId].minutes += (Number(session.duration) || 0);
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
        } catch { }

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-32">
        {/* Full-screen background gradient */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('dashboard.title')}
            </h1>
            <button
              onClick={() => router.push('/settings')}
              className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/5 transition-colors"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Hero Section */}
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 sm:p-10 text-primary-foreground shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl -ml-24 -mb-24" />

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="space-y-4 max-w-2xl">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span>{stats?.currentStreak || 0} Day Streak</span>
                  </div>

                  <h2 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
                    තෙරුවන් සරණයි, <br />
                    <span className="opacity-90">{user?.displayName || 'Meditator'}</span>
                  </h2>

                  <p className="text-lg sm:text-xl opacity-90 leading-relaxed">
                    {getMotivationalMessage()}
                  </p>
                </div>

                <Button
                  onClick={() => router.push('/meditate')}
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 h-14 px-8 rounded-2xl text-lg font-semibold group"
                >
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Start Meditating
                </Button>
              </div>
            </motion.div>

            {/* Event Banner */}
            <motion.div variants={itemVariants}>
              <EventBanner />
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <h3 className="text-lg font-semibold mb-4 px-1">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {[
                  { label: 'Logbook', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/logbook' },
                  { label: 'Audio', icon: Headphones, color: 'text-purple-500', bg: 'bg-purple-500/10', path: '/kamatahan' },
                  { label: 'Dhamma', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '/dhamma' },
                  { label: 'Analytics', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10', path: '/analytics' },
                  { label: 'Tripitaka', icon: BookOpen, color: 'text-rose-500', bg: 'bg-rose-500/10', path: '/pitaka' },
                  { label: 'My Path', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/10', path: '/mypath' },
                  { label: 'Questions', icon: HelpCircle, color: 'text-cyan-500', bg: 'bg-cyan-500/10', path: '/meditation-questions' },
                  { label: 'Books', icon: Library, color: 'text-orange-500', bg: 'bg-orange-500/10', path: '/books' },
                ].map((action, index) => (
                  <button
                    key={index}
                    onClick={() => router.push(action.path)}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-background/40 backdrop-blur-md border border-white/10 hover:bg-white/5 hover:border-primary/20 transition-all group"
                  >
                    <div className={`w-12 h-12 ${action.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                      <action.icon className={`w-6 h-6 ${action.color}`} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Key Metrics Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <Activity size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-blue-500 mb-2">
                    <Activity size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Sessions</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats?.totalSessions || 0}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <Clock size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-emerald-500 mb-2">
                    <Clock size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Minutes</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats?.totalMinutes || 0}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <Flame size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-amber-500 mb-2">
                    <Flame size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats?.currentStreak || 0} days</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-purple-500 mb-2">
                    <TrendingUp size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Weekly Goal</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{Math.round(stats?.weeklyGoalProgress || 0)}%</p>
                </div>
              </div>
            </motion.div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Sessions */}
              <motion.div variants={itemVariants} className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Recent Sessions</h3>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/logbook')} className="text-muted-foreground hover:text-foreground">
                    View All <ArrowRight className="ml-1 w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  {stats?.recentSessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No sessions yet. Start meditating!
                    </div>
                  ) : (
                    stats?.recentSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/5 group cursor-pointer" onClick={() => router.push('/logbook')}>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                            {session.status === 'completed' ? <Activity size={18} /> : <Clock size={18} />}
                          </div>
                          <div>
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors">{session.typeName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.createdAt).toLocaleDateString()} • {session.duration} min
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${session.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Recommended Dhamma */}
              <motion.div variants={itemVariants} className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Recommended For You</h3>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/dhamma')} className="text-muted-foreground hover:text-foreground">
                    View Library <ArrowRight className="ml-1 w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  {recommended.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No recommendations available at the moment.
                    </div>
                  ) : (
                    recommended.map((post) => (
                      <DhammaPostCard key={post.id} post={post} onClick={() => router.push(`/dhamma/${post.id}`)} />
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
