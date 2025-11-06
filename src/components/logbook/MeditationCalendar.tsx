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
    <div className="bg-background rounded-xl p-6 shadow-lg border border-border">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Meditation Calendar
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium"
          >
            Today
          </button>
          
          <button
            onClick={goToNextMonth}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Month/Year Display */}
      <div className="text-center mb-6">
        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          const daySessions = getSessionsForDate(day);
          const totalMinutes = getTotalMinutesForDate(day);
          const hasSessionsToday = hasSessions(day);
          const isTodayDate = isToday(day);
          const isCurrentMonthDate = isCurrentMonth(day);
          const isSelectedDate = isSelected(day);

          return (
            <button
              key={index}
              onClick={() => onDateSelect(day)}
              className={`
                relative p-2 h-20 text-left rounded-lg transition-all
                ${isCurrentMonthDate ? 'hover:bg-muted' : 'text-muted-foreground'}
                ${isSelectedDate 
                  ? 'bg-muted border-2 border-[var(--primary)]' 
                  : ''
                }
                ${isTodayDate && !isSelectedDate 
                  ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30' 
                  : ''
                }
              `}
            >
              {/* Date Number */}
              <div className={`
                text-sm font-medium mb-1
                ${isCurrentMonthDate ? 'text-foreground' : 'text-muted-foreground'}
                ${isTodayDate ? 'text-[var(--primary)]' : ''}
              `}>
                {format(day, 'd')}
              </div>

              {/* Session Indicators */}
              {hasSessionsToday && (
                <div className="space-y-1">
                  {/* Session Count */}
                  <div className="text-xs text-muted-foreground">
                    {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}
                  </div>
                  
                  {/* Total Minutes */}
                  <div className="text-xs text-[var(--primary)] font-medium">
                    {totalMinutes}m
                  </div>
                  
                  {/* Session Type Indicators */}
                  <div className="flex flex-wrap gap-1">
                    {daySessions.slice(0, 3).map((session, sessionIndex) => (
                      <div
                        key={sessionIndex}
                        className={`
                          w-2 h-2 rounded-full
                          ${session.status === 'completed' 
                            ? 'bg-[var(--primary)]' 
                            : session.status === 'abandoned' 
                            ? 'bg-[var(--color-status-error)]/100' 
                            : 'bg-yellow-500'
                          }
                        `}
                        title={`${session.typeName} - ${session.status}`}
                      />
                    ))}
                    {daySessions.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{daySessions.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!hasSessionsToday && isCurrentMonthDate && (
                <div className="text-xs text-muted-foreground mt-2">
                  No sessions
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[var(--primary)] rounded-full"></div>
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[var(--color-status-error)]/100 rounded-full"></div>
            <span className="text-muted-foreground">Abandoned</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-muted-foreground">Active/Paused</span>
          </div>
        </div>
      </div>
    </div>
  );
};

