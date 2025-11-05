'use client';

import React from 'react';
import { MeditationSession } from '@/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface DateSessionsProps {
  date: Date;
  sessions: MeditationSession[];
  onDeleteSession: (sessionId: string) => void;
}

export const DateSessions: React.FC<DateSessionsProps> = ({
  date,
  sessions,
  onDeleteSession
}) => {
  if (sessions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No sessions on {format(date, 'MMMM dd, yyyy')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This was a rest day. Every day is a new opportunity to meditate!
          </p>
        </div>
      </div>
    );
  }

  // Calculate daily stats
  const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const abandonedSessions = sessions.filter(s => s.status === 'abandoned').length;

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      {/* Date Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(date, 'EEEE, MMMM dd, yyyy')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} • {totalMinutes} total minutes
          </p>
        </div>
        
        {/* Daily Stats */}
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {completedSessions}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {abandonedSessions}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Abandoned</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {totalMinutes}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Minutes</div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Session Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {session.typeName}
                    </h4>
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${session.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : session.status === 'abandoned' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }
                    `}>
                      {session.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {session.rating && (
                      <span className="text-yellow-500 text-sm">
                        {'⭐'.repeat(session.rating)}
                      </span>
                    )}
                    {session.mood && (
                      <span className="text-sm" title={session.mood}>
                        {getMoodEmoji(session.mood)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Session Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {session.duration} minutes
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Started:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {format(session.startTime, 'HH:mm')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {session.endTime ? format(session.endTime, 'HH:mm') : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Time:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {format(session.createdAt, 'HH:mm')}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {session.notes && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic line-clamp-3 break-words">
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
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  onClick={() => onDeleteSession(session.id)}
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
      </div>
    </div>
  );
};
