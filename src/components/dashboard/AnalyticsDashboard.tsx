'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MeditationService } from '@/lib/meditationService';
import { MeditationTypeService } from '@/lib/meditationTypeService';
import { MeditationSession, MeditationType } from '@/types';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Activity, Clock, Calendar, Trophy, TrendingUp, BarChart2, PieChart as PieChartIcon } from 'lucide-react';

interface AnalyticsData {
  totalSessions: number;
  totalMinutes: number;
  averageSessionLength: number;
  favoriteType: string;
  currentStreak: number;
  longestStreak: number;
  weeklyMinutes: number;
  monthlyMinutes: number;
}

interface ChartData {
  date: string;
  minutes: number;
  sessions: number;
}

interface TypeDistribution {
  type: string;
  sessions: number;
  minutes: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [meditationTypes, setMeditationTypes] = useState<MeditationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Load sessions and meditation types
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Load sessions and meditation types in parallel
        const [userSessions, types] = await Promise.all([
          MeditationService.getUserSessions(user.id, 1000),
          MeditationTypeService.getAllTypes()
        ]);

        setSessions(userSessions);
        setMeditationTypes(types);
        setError(null);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Filter sessions based on time range
  const filteredSessions = useMemo(() => {
    if (sessions.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      default:
        startDate = new Date(0); // All time
    }

    return sessions.filter(session => session.createdAt >= startDate);
  }, [sessions, timeRange]);

  // Calculate analytics data based on FILTERED sessions
  const analyticsData = useMemo((): AnalyticsData => {
    if (filteredSessions.length === 0) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        averageSessionLength: 0,
        favoriteType: 'None',
        currentStreak: 0,
        longestStreak: 0,
        weeklyMinutes: 0,
        monthlyMinutes: 0,
      };
    }

    const totalSessions = filteredSessions.length;
    const totalMinutes = filteredSessions.reduce((sum, session) => sum + (Number(session.duration) || 0), 0);
    const averageSessionLength = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    // Calculate favorite type
    const typeCounts: Record<string, number> = {};
    filteredSessions.forEach(session => {
      typeCounts[session.typeId] = (typeCounts[session.typeId] || 0) + 1;
    });

    let favoriteType = 'None';
    if (Object.keys(typeCounts).length > 0) {
      const favoriteTypeId = Object.entries(typeCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      const favoriteTypeData = meditationTypes.find(t => t.id === favoriteTypeId);
      favoriteType = favoriteTypeData?.name || favoriteTypeId.charAt(0).toUpperCase() + favoriteTypeId.slice(1);
    }

    // Calculate streaks (Streaks should probably be based on ALL sessions to be accurate, but let's follow the filter for consistency or calculate separately)
    // Actually, streaks are usually "current" status, so they should be based on ALL history to be meaningful.
    // However, if the user wants to see stats for a period, maybe they want to see streaks WITHIN that period?
    // Standard practice: Current Streak is global. Longest Streak is usually global too.
    // Let's keep streaks based on ALL sessions for accuracy, but update other stats based on filter.

    const sortedAllSessions = sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const session of sortedAllSessions) {
      const sessionDate = new Date(session.createdAt);
      sessionDate.setHours(0, 0, 0, 0);

      if (lastDate === null) {
        lastDate = sessionDate;
        tempStreak = 1;
        currentStreak = 1;
      } else {
        const diffTime = Math.abs(lastDate.getTime() - sessionDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
          if (tempStreak === 2) {
            currentStreak = tempStreak;
          } else if (tempStreak > currentStreak) {
            currentStreak = tempStreak;
          }
        } else if (diffDays > 1) {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
        }
      }
      lastDate = sessionDate;
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    // Weekly and Monthly minutes (These are fixed periods, independent of the filter, usually shown as "recent progress")
    // Let's keep these based on ALL sessions as they are labeled "Weekly Progress" and "Monthly Progress" explicitly.
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const monthAgo = subDays(now, 30);

    const weeklyMinutes = sessions
      .filter(session => session.createdAt >= weekAgo)
      .reduce((sum, session) => sum + (Number(session.duration) || 0), 0);

    const monthlyMinutes = sessions
      .filter(session => session.createdAt >= monthAgo)
      .reduce((sum, session) => sum + (Number(session.duration) || 0), 0);

    return {
      totalSessions,
      totalMinutes,
      averageSessionLength,
      favoriteType,
      currentStreak,
      longestStreak,
      weeklyMinutes,
      monthlyMinutes,
    };
  }, [sessions, filteredSessions, meditationTypes]);

  // Generate chart data for selected time range
  const chartData = useMemo((): ChartData[] => {
    if (sessions.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      default:
        // For 'all', we need a start date. Let's find the earliest session or default to 30 days if empty
        if (sessions.length > 0) {
          const earliest = sessions.reduce((min, s) => s.createdAt < min ? s.createdAt : min, sessions[0].createdAt);
          startDate = startOfDay(earliest);
        } else {
          startDate = subDays(now, 30);
        }
    }

    const days = eachDayOfInterval({ start: startDate, end: now });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const daySessions = filteredSessions.filter(session =>
        session.createdAt >= dayStart && session.createdAt <= dayEnd
      );

      const minutes = daySessions.reduce((sum, session) => sum + (Number(session.duration) || 0), 0);

      return {
        date: format(day, 'MMM dd'),
        minutes,
        sessions: daySessions.length,
      };
    });
  }, [sessions, filteredSessions, timeRange]);

  // Generate meditation type distribution based on FILTERED sessions
  const typeDistribution = useMemo((): TypeDistribution[] => {
    if (filteredSessions.length === 0) return [];

    const typeStats: Record<string, { sessions: number; minutes: number }> = {};

    filteredSessions.forEach(session => {
      if (!typeStats[session.typeId]) {
        typeStats[session.typeId] = { sessions: 0, minutes: 0 };
      }
      typeStats[session.typeId].sessions++;
      typeStats[session.typeId].minutes += (Number(session.duration) || 0);
    });

    return Object.entries(typeStats)
      .map(([typeId, stats]) => {
        // Find the meditation type name, fallback to capitalized ID
        const meditationType = meditationTypes.find(t => t.id === typeId);
        const typeName = meditationType?.name || typeId.charAt(0).toUpperCase() + typeId.slice(1);

        return {
          type: typeName,
          ...stats,
        };
      })
      .sort((a, b) => b.sessions - a.sessions);
  }, [filteredSessions, meditationTypes]);

  // Chart colors
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-6">🧘‍♀️</div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          No meditation sessions yet
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Start your meditation journey to see beautiful analytics and insights about your practice!
        </p>
        <Button variant="default" size="lg" className="rounded-full px-8">
          Start Meditating
        </Button>
      </div>
    );
  }

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Time Range Filter */}
      <div className="flex justify-center">
        <div className="bg-muted/50 p-1 rounded-full inline-flex">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${timeRange === range
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {range === '7d' ? '7 Days' :
                range === '30d' ? '30 Days' :
                  range === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Activity size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Total Sessions</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{analyticsData.totalSessions}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {timeRange === 'all' ? 'Lifetime sessions' : `Last ${timeRange}`}
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <Clock size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Total Minutes</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{analyticsData.totalMinutes}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {timeRange === 'all' ? 'Time spent meditating' : `Last ${timeRange}`}
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-purple-500 mb-2">
              <TrendingUp size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Avg Duration</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{analyticsData.averageSessionLength}m</p>
            <p className="text-sm text-muted-foreground mt-1">Per session</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <Trophy size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{analyticsData.currentStreak} days</p>
            <p className="text-sm text-muted-foreground mt-1">Keep it up!</p>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Minutes Chart */}
        <motion.div variants={itemVariants} className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <BarChart2 size={20} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Daily Minutes</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(20, 20, 20, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#10b981' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMinutes)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Meditation Type Distribution */}
        <motion.div variants={itemVariants} className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <PieChartIcon size={20} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Type Distribution</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="sessions"
                  stroke="none"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(20, 20, 20, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {typeDistribution.slice(0, 4).map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs text-muted-foreground">{entry.type}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Additional Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl text-center">
          <p className="text-sm text-muted-foreground mb-2">Weekly Progress</p>
          <div className="text-4xl font-bold text-primary mb-1">{analyticsData.weeklyMinutes}</div>
          <p className="text-xs text-muted-foreground">minutes this week</p>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl text-center">
          <p className="text-sm text-muted-foreground mb-2">Monthly Progress</p>
          <div className="text-4xl font-bold text-emerald-500 mb-1">{analyticsData.monthlyMinutes}</div>
          <p className="text-xs text-muted-foreground">minutes this month</p>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl text-center">
          <p className="text-sm text-muted-foreground mb-2">Longest Streak</p>
          <div className="text-4xl font-bold text-amber-500 mb-1">{analyticsData.longestStreak}</div>
          <p className="text-xs text-muted-foreground">consecutive days</p>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
            <Calendar size={20} />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          {sessions.slice(0, 5).map((session, index) => (
            <div key={session.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/5">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
                  }`}>
                  {session.status === 'completed' ? <Activity size={18} /> : <Clock size={18} />}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {session.typeName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(session.createdAt, 'MMM dd, yyyy • h:mm a')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-foreground">{session.duration}m</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
