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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Meditation Calendar
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-[var(--primary)] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Today
          </button>
          
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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
            className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
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
                ${isCurrentMonthDate 
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-700' 
                  : 'text-gray-400 dark:text-gray-500'
                }
                ${isSelectedDate 
                  ? 'bg-muted dark:bg-blue-900/20 border-2 border-[var(--primary)]' 
                  : ''
                }
                ${isTodayDate && !isSelectedDate 
                  ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700' 
                  : ''
                }
              `}
            >
              {/* Date Number */}
              <div className={`
                text-sm font-medium mb-1
                ${isCurrentMonthDate 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-400 dark:text-gray-500'
                }
                ${isTodayDate ? 'text-[var(--primary)] dark:text-blue-400' : ''}
              `}>
                {format(day, 'd')}
              </div>

              {/* Session Indicators */}
              {hasSessionsToday && (
                <div className="space-y-1">
                  {/* Session Count */}
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}
                  </div>
                  
                  {/* Total Minutes */}
                  <div className="text-xs text-[var(--primary)] dark:text-green-400 font-medium">
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
                            ? 'bg-green-500' 
                            : session.status === 'abandoned' 
                            ? 'bg-[var(--color-status-error)]/100' 
                            : 'bg-yellow-500'
                          }
                        `}
                        title={`${session.typeName} - ${session.status}`}
                      />
                    ))}
                    {daySessions.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{daySessions.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!hasSessionsToday && isCurrentMonthDate && (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  No sessions
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[var(--color-status-error)]/100 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Abandoned</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Active/Paused</span>
          </div>
        </div>
      </div>
    </div>
  );
};

