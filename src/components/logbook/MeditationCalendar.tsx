'use client';

import React, { useState, useMemo } from 'react';
import { MeditationSession } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

interface MeditationCalendarProps {
  sessions: MeditationSession[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
}

export const MeditationCalendar: React.FC<MeditationCalendarProps> = ({
  sessions,
  selectedDate,
  onDateSelect,
  onMonthChange
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group sessions by date for quick lookup
  const sessionsByDate = useMemo(() => {
    const grouped: Record<string, MeditationSession[]> = {};
    sessions.forEach(session => {
      const dateKey = format(session.createdAt, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    return grouped;
  }, [sessions]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Navigation functions
  const goToPreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onMonthChange?.(today);
  };

  // Get sessions for a specific date
  const getSessionsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return sessionsByDate[dateKey] || [];
  };

  // Get total minutes for a date
  const getTotalMinutesForDate = (date: Date) => {
    const daySessions = getSessionsForDate(date);
    return daySessions.reduce((sum, session) => sum + session.duration, 0);
  };

  // Check if date has sessions
  const hasSessions = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return !!sessionsByDate[dateKey];
  };

  // Check if date is today
  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return isSameMonth(date, currentMonth);
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    return selectedDate && isSameDay(date, selectedDate);
  };

  return (
    <div className="bg-background/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full" />
          Calendar
        </h3>
        <div className="flex items-center gap-1 bg-background/50 rounded-full p-1 border border-white/5">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToToday}
            className="px-4 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-full transition-colors"
          >
            Today
          </button>

          <button
            onClick={goToNextMonth}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Month/Year Display */}
      <div className="text-center mb-8">
        <h4 className="text-2xl font-bold text-foreground tracking-tight">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          const daySessions = getSessionsForDate(day);
          const hasSessionsToday = hasSessions(day);
          const isTodayDate = isToday(day);
          const isCurrentMonthDate = isCurrentMonth(day);
          const isSelectedDate = isSelected(day);

          return (
            <button
              key={index}
              onClick={() => onDateSelect(day)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all duration-300
                ${!isCurrentMonthDate ? 'opacity-30' : 'opacity-100'}
                ${isSelectedDate
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105 z-10'
                  : 'hover:bg-white/5'
                }
                ${isTodayDate && !isSelectedDate
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : ''
                }
              `}
            >
              <span className={`text-sm font-medium ${isSelectedDate ? 'text-primary-foreground' : 'text-foreground'}`}>
                {format(day, 'd')}
              </span>

              {/* Dot Indicators */}
              <div className="flex gap-0.5 mt-1 h-1.5">
                {daySessions.slice(0, 3).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 rounded-full ${isSelectedDate ? 'bg-white/70' : 'bg-primary'}`}
                  />
                ))}
                {daySessions.length > 3 && (
                  <div className={`w-1 h-1 rounded-full ${isSelectedDate ? 'bg-white/70' : 'bg-primary'}`} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

