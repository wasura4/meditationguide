'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { MeditationService } from '@/lib/meditationService';
import { MeditationSession } from '@/types';

import { DEFAULT_MEDITATION_TYPES } from '@/constants';
import { MeditationCalendar } from '@/components/logbook/MeditationCalendar';
import { DateSessions } from '@/components/logbook/DateSessions';
import { isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar as CalendarIcon, List as ListIcon, Trash2, Clock, Activity, Star, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

export default function LogbookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [loading, setLoading] = useState(true);


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
    } catch (err) {
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

  // Removed auto-refresh and focus refresh to avoid jumps on mobile.

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedMood, selectedRating, dateRange, customStartDate, customEndDate]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

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
      good: '🙂',
      neutral: '😐',
      challenging: '😰',
      difficult: '😫',
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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-32">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/5 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Logbook
              </h1>
            </div>

            <div className="flex bg-muted/50 p-1 rounded-full">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ListIcon size={18} />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-full transition-all ${viewMode === 'calendar' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <CalendarIcon size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
          {/* Stats Row */}
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="min-w-[140px] bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 snap-start"
            >
              <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <Activity size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Total</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalSessions}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="min-w-[140px] bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-4 snap-start"
            >
              <div className="flex items-center gap-2 text-blue-500 mb-2">
                <Clock size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Time</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalMinutes}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="min-w-[140px] bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl p-4 snap-start"
            >
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <Star size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Rating</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.averageRating}</p>
              <p className="text-xs text-muted-foreground">Average</p>
            </motion.div>
          </div>

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <MeditationCalendar
                sessions={sessions}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
              {selectedDate && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Sessions on {formatDate(selectedDate)}
                  </h3>
                  <DateSessions
                    date={selectedDate}
                    sessions={getSessionsForDate(selectedDate)}
                    onDeleteSession={handleDeleteSession}
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 snap-start ${selectedType === 'all'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                >
                  All Types
                </button>
                {DEFAULT_MEDITATION_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 snap-start ${selectedType === type.id
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/30 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Session List */}
              <div className="space-y-3">
                <AnimatePresence mode='popLayout'>
                  {paginatedSessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-background/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 hover:bg-white/5 transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{session.typeName}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <CalendarIcon size={12} />
                            {formatDate(session.createdAt)}
                            <span className="w-1 h-1 bg-muted-foreground/30 rounded-full mx-1" />
                            <Clock size={12} />
                            {session.duration} min
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.rating && (
                            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg text-xs font-medium">
                              <Star size={12} fill="currentColor" />
                              {session.rating}
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-2 text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {session.notes && (
                        <p className="text-sm text-muted-foreground italic mb-3 line-clamp-2">
                          &quot;{session.notes}&quot;
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {session.mood && (
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                            {getMoodEmoji(session.mood)} {session.mood}
                          </span>
                        )}
                        {session.insights?.map((insight, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-medium">
                            💡 {insight}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredSessions.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ListIcon className="text-muted-foreground" size={24} />
                    </div>
                    <p className="text-muted-foreground">No sessions found</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded-full hover:bg-white/5 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm font-medium text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-full hover:bg-white/5 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
