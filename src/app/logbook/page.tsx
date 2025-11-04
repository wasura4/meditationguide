'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { MeditationService } from '@/lib/meditationService';
import { MeditationSession } from '@/types';
import { Button } from '@/components/ui/button';
import { DEFAULT_MEDITATION_TYPES } from '@/constants';
import { MeditationCalendar } from '@/components/logbook/MeditationCalendar';
import { DateSessions } from '@/components/logbook/DateSessions';
import { isSameDay } from 'date-fns';

export default function LogbookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const userSessions = await MeditationService.getUserSessions(user!.id, 1000);
      setSessions(userSessions);
      setError(null);
    } catch (err) {
      setError('Failed to load sessions');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load sessions on component mount
  useEffect(() => {
    if (user?.id) {
      loadSessions();
    }
  }, [user?.id, loadSessions]);

  // Auto-refresh sessions every 30 seconds to catch new sessions
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(() => {
        loadSessions();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user?.id, loadSessions]);

  // Refresh sessions when user returns to this tab
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        loadSessions();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id, loadSessions]);

  // Filter sessions based on current filters
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          session.typeName.toLowerCase().includes(query) ||
          session.notes?.toLowerCase().includes(query) ||
          session.distractions?.some(d => d.toLowerCase().includes(query)) ||
          session.insights?.some(i => i.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Type filter
      if (selectedType !== 'all' && session.typeId !== selectedType) {
        return false;
      }

      // Mood filter
      if (selectedMood !== 'all' && session.mood !== selectedMood) {
        return false;
      }

      // Rating filter
      if (selectedRating !== 'all') {
        const rating = parseInt(selectedRating);
        if (session.rating !== rating) {
          return false;
        }
      }

      // Date range filter
      if (dateRange !== 'all') {
        const sessionDate = new Date(session.createdAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (dateRange) {
          case 'today':
            const sessionDay = new Date(sessionDate);
            sessionDay.setHours(0, 0, 0, 0);
            if (sessionDay.getTime() !== today.getTime()) return false;
            break;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            if (sessionDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            if (sessionDate < monthAgo) return false;
            break;
          case 'custom':
            if (customStartDate && customEndDate) {
              const startDate = new Date(customStartDate);
              const endDate = new Date(customEndDate);
              endDate.setHours(23, 59, 59, 999);
              if (sessionDate < startDate || sessionDate > endDate) return false;
            }
            break;
        }
      }

      return true;
    });
  }, [sessions, searchQuery, selectedType, selectedMood, selectedRating, dateRange, customStartDate, customEndDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredSessions.length === 0) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        averageRating: 0,
        averageDuration: 0,
        moodDistribution: {},
        typeDistribution: {},
      };
    }

    const totalSessions = filteredSessions.length;
    const totalMinutes = filteredSessions.reduce((sum, session) => sum + session.duration, 0);
    const averageRating = filteredSessions
      .filter(s => s.rating)
      .reduce((sum, session) => sum + (session.rating || 0), 0) / 
      filteredSessions.filter(s => s.rating).length || 0;
    const averageDuration = totalMinutes / totalSessions;

    // Mood distribution
    const moodDistribution: Record<string, number> = {};
    filteredSessions.forEach(session => {
      if (session.mood) {
        moodDistribution[session.mood] = (moodDistribution[session.mood] || 0) + 1;
      }
    });

    // Type distribution
    const typeDistribution: Record<string, number> = {};
    filteredSessions.forEach(session => {
      typeDistribution[session.typeId] = (typeDistribution[session.typeId] || 0) + 1;
    });

    return {
      totalSessions,
      totalMinutes,
      averageRating: Math.round(averageRating * 10) / 10,
      averageDuration: Math.round(averageDuration),
      moodDistribution,
      typeDistribution,
    };
  }, [filteredSessions]);

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      try {
        await MeditationService.deleteSession(sessionId);
        setSessions(sessions.filter(s => s.id !== sessionId));
      } catch (err) {
        console.error('Error deleting session:', err);
        alert('Failed to delete session');
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedMood('all');
    setSelectedRating('all');
    setDateRange('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedMood, selectedRating, dateRange, customStartDate, customEndDate]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of sessions list
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: Record<string, string> = {
      excellent: '🌟',
      good: '😊',
      neutral: '😐',
      challenging: '😰',
      difficult: '😓',
    };
    return moodEmojis[mood] || '😐';
  };

  // Get sessions for a specific date
  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.createdAt);
      return isSameDay(sessionDate, date);
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-[#f0f7f4] via-[#f5f3f0] to-[#f0f9f4] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b9e7a] mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your meditation history...</p>
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
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Meditation Logbook
                </h1>
              </div>
                                 <div className="flex items-center space-x-4">
                     {/* View Mode Toggle */}
                     <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                       <button
                         onClick={() => {
                           setViewMode('list');
                           setSelectedDate(null);
                         }}
                         className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                           viewMode === 'list'
                             ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                             : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                         }`}
                       >
                         <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                         </svg>
                         List
                       </button>
                       <button
                         onClick={() => {
                           setViewMode('calendar');
                           setSelectedDate(null);
                         }}
                         className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                           viewMode === 'calendar'
                             ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                             : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                         }`}
                       >
                         <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                         </svg>
                         Calendar
                       </button>
                     </div>

                     <Button
                       onClick={() => loadSessions()}
                       variant="outline"
                       size="sm"
                       className="mr-2"
                     >
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                       </svg>
                       Refresh
                     </Button>
                     <Button
                       onClick={() => router.push('/meditate')}
                       variant="meditation"
                       size="sm"
                     >
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       New Session
                     </Button>
                     <Button
                       onClick={() => router.push('/analytics')}
                       variant="outline"
                       size="sm"
                     >
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                       </svg>
                       Analytics
                     </Button>
                     <Button
                       onClick={() => router.push('/dashboard')}
                       variant="ghost"
                       size="sm"
                     >
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                       </svg>
                       Dashboard
                     </Button>
                   </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-[#f0f7f4] dark:bg-[#2d4a3a]/20 rounded-lg">
                  <svg className="w-6 h-6 text-[#6b9e7a] dark:text-[#7fb88c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-[#f0f9f4] dark:bg-[#2d4a35]/20 rounded-lg">
                  <svg className="w-6 h-6 text-[#7fb88c] dark:text-[#7fb88c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Minutes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMinutes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-[#fff8f0] dark:bg-[#5c4532]/20 rounded-lg">
                  <svg className="w-6 h-6 text-[#d4a574] dark:text-[#d4a574]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageRating}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-[#f5f3f0] dark:bg-[#3d2f28]/20 rounded-lg">
                  <svg className="w-6 h-6 text-[#a68b7a] dark:text-[#a68b7a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageDuration}m</p>
                </div>
              </div>
            </div>
                     </div>

           {/* Calendar View */}
           {viewMode === 'calendar' && (
             <div className="mb-8">
               <MeditationCalendar
                 sessions={sessions}
                 selectedDate={selectedDate}
                 onDateSelect={setSelectedDate}
                 onMonthChange={(date) => {
                   // You could add logic here to load sessions for the new month if needed
                   console.log('Month changed to:', date);
                 }}
               />
             </div>
           )}

           {/* Selected Date Sessions */}
           {viewMode === 'calendar' && selectedDate && (
             <div className="mb-8">
               <DateSessions
                 date={selectedDate}
                 sessions={getSessionsForDate(selectedDate)}
                 onDeleteSession={handleDeleteSession}
               />
             </div>
           )}

                      {/* Filters - Only show in list view */}
           {viewMode === 'list' && (
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
                />
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meditation Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  {DEFAULT_MEDITATION_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Mood Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mood
                </label>
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
                >
                  <option value="all">All Moods</option>
                  <option value="excellent">Excellent 🌟</option>
                  <option value="good">Good 😊</option>
                  <option value="neutral">Neutral 😐</option>
                  <option value="challenging">Challenging 😰</option>
                  <option value="difficult">Difficult 😓</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating
                </label>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
                  <option value="4">4 Stars ⭐⭐⭐⭐</option>
                  <option value="3">3 Stars ⭐⭐⭐</option>
                  <option value="2">2 Stars ⭐⭐</option>
                  <option value="1">1 Star ⭐</option>
                </select>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <select
                  value={dateRange}
                                     onChange={(e) => setDateRange(e.target.value as 'all' | 'today' | 'week' | 'month' | 'custom')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {dateRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[#6b9e7a] focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div className="flex items-end">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredSessions.length)} of {filteredSessions.length} sessions
              {filteredSessions.length !== sessions.length && ` (${sessions.length} total)`}
            </div>
          </div>
           )}

          {/* Sessions List - Only show in list view */}
          {viewMode === 'list' && (
            <div className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {filteredSessions.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {sessions.length === 0 ? 'No sessions yet' : 'No sessions match your filters'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {sessions.length === 0 
                    ? 'Start your meditation journey by completing your first session!'
                    : 'Try adjusting your filters or clear them to see all sessions.'
                  }
                </p>
                {sessions.length === 0 && (
                  <Button
                    onClick={() => router.push('/meditate')}
                    variant="meditation"
                  >
                    Start Meditating
                  </Button>
                )}
              </div>
            ) : (
              <>
                {paginatedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                  >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {session.typeName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {formatDate(session.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {session.rating && (
                            <span className="text-yellow-500 text-sm">
                              {'⭐'.repeat(session.rating)}
                            </span>
                          )}
                          {session.mood && (
                            <span className="text-sm">
                              {getMoodEmoji(session.mood)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {session.duration} minutes
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Started:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {session.startTime.toLocaleTimeString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {session.endTime?.toLocaleTimeString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                            {session.status}
                          </span>
                        </div>
                      </div>

                      {/* Notes */}
                      {session.notes && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                            &quot;{session.notes}&quot;
                          </p>
                        </div>
                      )}

                      {/* Tags and Insights */}
                      <div className="flex flex-wrap gap-2">
                        {session.distractions && session.distractions.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Distractions:</span>
                            {session.distractions.map((distraction, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full"
                              >
                                {distraction}
                              </span>
                            ))}
                          </div>
                        )}
                        {session.insights && session.insights.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Insights:</span>
                            {session.insights.map((insight, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full"
                              >
                                💡 {insight}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 mt-4 lg:mt-0 lg:ml-4">
                      <Button
                        onClick={() => handleDeleteSession(session.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Previous Button */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
                      >
                        Previous
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          // Show first page, last page, current page, and pages around current
                          let pageNumber;
                          if (totalPages <= 7) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 4) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 3) {
                            pageNumber = totalPages - 6 + i;
                          } else {
                            pageNumber = currentPage - 3 + i;
                          }

                          if (pageNumber < 1 || pageNumber > totalPages) return null;

                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                currentPage === pageNumber
                                  ? 'bg-[var(--primary)] text-white'
                                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
                      >
                        Next
                      </button>
                    </div>

                    {/* Jump to Page */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Go to:</span>
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= totalPages) {
                            handlePageChange(page);
                          }
                        }}
                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
           )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
