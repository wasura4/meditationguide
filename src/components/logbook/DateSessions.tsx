"use client";

import React, { useState } from 'react';
import { MeditationSession } from '@/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface DateSessionsProps {
  date: Date;
  sessions: MeditationSession[];
  onDeleteSession: (sessionId: string) => void;
}

export const DateSessions: React.FC<DateSessionsProps> = ({ date, sessions, onDeleteSession }) => {
  const [openSession, setOpenSession] = useState<MeditationSession | null>(null);
  if (sessions.length === 0) {
    return (
      <div className="bg-background rounded-xl p-6 shadow-lg border border-border">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">ðŸ“…</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No sessions on {format(date, 'MMMM dd, yyyy')}</h3>
          <p className="text-muted-foreground">This was a rest day. Every day is a new opportunity to meditate!</p>
        </div>
      </div>
    );
  }

  const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const abandonedSessions = sessions.filter(s => s.status === 'abandoned').length;

  const getMoodEmoji = (mood: string) => ({ excellent: 'ðŸŒŸ', good: 'ðŸ™‚', neutral: 'ðŸ˜', challenging: 'ðŸ˜°', difficult: 'ðŸ˜“' }[mood] || 'ðŸ˜');

  return (
    <div className="bg-background rounded-xl p-6 shadow-lg border border-border">
      {/* Date Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{format(date, 'EEEE, MMMM dd, yyyy')}</h3>
          <p className="text-sm text-muted-foreground">{sessions.length} session{sessions.length !== 1 ? 's' : ''} â€¢ {totalMinutes} total minutes</p>
        </div>

        {/* Daily Stats */}
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--primary)]">{completedSessions}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{abandonedSessions}</div>
            <div className="text-xs text-muted-foreground">Abandoned</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--primary)]">{totalMinutes}</div>
            <div className="text-xs text-muted-foreground">Minutes</div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
  <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="border border-border rounded-lg p-4 hover:bg-muted/60 transition-colors cursor-pointer"
            onClick={() => setOpenSession(session)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Session Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-foreground">{session.typeName}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.status === 'completed'
                        ? 'bg-muted text-foreground'
                        : session.status === 'abandoned'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {session.status}
                    </span>
  </div>

      {openSession && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6" onClick={() => setOpenSession(null)}>
          <div className="w-full sm:max-w-lg bg-background text-foreground rounded-t-2xl sm:rounded-2xl shadow-xl border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{format(openSession.startTime, 'PPpp')}</div>
                <div className="text-lg font-semibold">{openSession.typeName}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOpenSession(null)}>Close</Button>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-sm"><span className="text-muted-foreground">Duration:</span><span className="ml-2 font-medium">{openSession.duration} minutes</span></div>
              <div className="text-sm"><span className="text-muted-foreground">Started:</span><span className="ml-2 font-medium">{format(openSession.startTime, 'PPpp')}</span></div>
              {openSession.endTime && (<div className="text-sm"><span className="text-muted-foreground">Completed:</span><span className="ml-2 font-medium">{format(openSession.endTime, 'PPpp')}</span></div>)}
              {openSession.rating && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Rating:</span>
                  <span className="ml-2">{openSession.rating}/5</span>
                </div>
              )}
              {openSession.mood && (<div className="text-sm"><span className="text-muted-foreground">Mood:</span><span className="ml-2 capitalize">{openSession.mood}</span></div>)}
              {openSession.notes && (
                <div className="pt-3 border-t border-border">
                  <div className="text-sm text-muted-foreground mb-1">Notes</div>
                  <p className="text-[15px] leading-relaxed break-words">{openSession.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

                  <div className="flex items-center space-x-2" />
                </div>

                {/* Session Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                  <div><span className="text-muted-foreground">Duration:</span><span className="ml-2 font-medium text-foreground">{session.duration} minutes</span></div>
                  <div><span className="text-muted-foreground">Started:</span><span className="ml-2 font-medium text-foreground">{format(session.startTime, 'HH:mm')}</span></div>
                  <div><span className="text-muted-foreground">Completed:</span><span className="ml-2 font-medium text-foreground">{session.endTime ? format(session.endTime, 'HH:mm') : 'N/A'}</span></div>
                  <div><span className="text-muted-foreground">Time:</span><span className="ml-2 font-medium text-foreground">{format(session.createdAt, 'HH:mm')}</span></div>
                </div>

                {/* Notes */}
                {session.notes && (
                  <div className="mb-3">
                    <p className="text-sm text-foreground/80 italic line-clamp-3 break-words">&quot;{session.notes}&quot;</p>
                  </div>
                )}

                {/* Tags and Insights */}
                <div className="flex flex-wrap gap-2">
                  {session.distractions && session.distractions.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-muted-foreground">Distractions:</span>
                      {session.distractions.map((d, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">{d}</span>
                      ))}
                    </div>
                  )}
                  {session.insights && session.insights.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-muted-foreground">Insights:</span>
                      {session.insights.map((ins, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-muted text-foreground rounded-full">{ins}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                <Button onClick={() => onDeleteSession(session.id)} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-100/40">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

