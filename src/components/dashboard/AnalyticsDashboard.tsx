'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MeditationService } from '@/lib/meditationService';
import { MeditationTypeService } from '@/lib/meditationTypeService';
import { MeditationSession, MeditationType } from '@/types';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Button } from '@/components/ui/button';

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

  // Calculate analytics data
  const analyticsData = useMemo((): AnalyticsData => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        averageSessionLength: 0,
        favoriteType: '',
        currentStreak: 0,
        longestStreak: 0,
        weeklyMinutes: 0,
        monthlyMinutes: 0,
      };
    }

    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
    const averageSessionLength = Math.round(totalMinutes / totalSessions);

    // Calculate favorite type
    const typeCounts: Record<string, number> = {};
    sessions.forEach(session => {
      typeCounts[session.typeId] = (typeCounts[session.typeId] || 0) + 1;
    });
    const favoriteTypeId = Object.entries(typeCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const favoriteTypeData = meditationTypes.find(t => t.id === favoriteTypeId);
    const favoriteType = favoriteTypeData?.name || favoriteTypeId.charAt(0).toUpperCase() + favoriteTypeId.slice(1);

    // Calculate streaks
    const sortedSessions = sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const session of sortedSessions) {
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

    // Calculate weekly and monthly minutes
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const monthAgo = subDays(now, 30);

    const weeklyMinutes = sessions
      .filter(session => session.createdAt >= weekAgo)
      .reduce((sum, session) => sum + session.duration, 0);

    const monthlyMinutes = sessions
      .filter(session => session.createdAt >= monthAgo)
      .reduce((sum, session) => sum + session.duration, 0);

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
  }, [sessions]);

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
        startDate = new Date(0); // All time
    }

    const filteredSessions = sessions.filter(session => session.createdAt >= startDate);
    const days = eachDayOfInterval({ start: startDate, end: now });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const daySessions = filteredSessions.filter(session => 
        session.createdAt >= dayStart && session.createdAt <= dayEnd
      );
      
      const minutes = daySessions.reduce((sum, session) => sum + session.duration, 0);
      
      return {
        date: format(day, 'MMM dd'),
        minutes,
        sessions: daySessions.length,
      };
    });
  }, [sessions, timeRange]);

  // Generate meditation type distribution
  const typeDistribution = useMemo((): TypeDistribution[] => {
    if (sessions.length === 0) return [];

    const typeStats: Record<string, { sessions: number; minutes: number }> = {};

    sessions.forEach(session => {
      if (!typeStats[session.typeId]) {
        typeStats[session.typeId] = { sessions: 0, minutes: 0 };
      }
      typeStats[session.typeId].sessions++;
      typeStats[session.typeId].minutes += session.duration;
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
  }, [sessions, meditationTypes]);

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🧘‍♀️</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No meditation sessions yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Start your meditation journey to see beautiful analytics and insights!
        </p>
        <Button variant="meditation" size="lg">
          Start Meditating
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Meditation Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your progress and discover insights about your practice
        </p>
      </div>

      {/* Time Range Filter */}
      <div className="flex justify-center space-x-2">
        {(['7d', '30d', '90d', 'all'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === '7d' ? '7 Days' : 
             range === '30d' ? '30 Days' : 
             range === '90d' ? '90 Days' : 'All Time'}
          </Button>
        ))}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Minutes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.totalMinutes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.averageSessionLength}m</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.currentStreak} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Minutes Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Daily Meditation Minutes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="#6b9e7a"
                strokeWidth={3}
                dot={{ fill: '#6b9e7a', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#6b9e7a', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Meditation Type Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Meditation Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, sessions }) => `${type} (${sessions})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="sessions"
              >
                {typeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Progress</h4>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {analyticsData.weeklyMinutes}
            </div>
            <p className="text-gray-600 dark:text-gray-400">minutes this week</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Progress</h4>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {analyticsData.monthlyMinutes}
            </div>
            <p className="text-gray-600 dark:text-gray-400">minutes this month</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Longest Streak</h4>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {analyticsData.longestStreak}
            </div>
            <p className="text-gray-600 dark:text-gray-400">consecutive days</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {session.typeName} Meditation
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(session.createdAt, 'MMM dd, yyyy')} • {session.duration} minutes
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {session.status === 'completed' ? '✅' : '⏹️'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {session.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
