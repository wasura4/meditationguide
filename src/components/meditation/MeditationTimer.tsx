'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { TIMER_SETTINGS } from '@/constants';
import { MeditationSession } from '@/types';
import { MeditationService } from '@/lib/meditationService';

interface MeditationTimerProps {
  defaultDuration?: number;
  meditationType?: string;
  meditationTypeName?: string;
  onSessionComplete?: (session: MeditationSession) => void;
  onSessionUpdate?: (typeId: string, typeName: string) => void;
}

export const MeditationTimer: React.FC<MeditationTimerProps> = ({
  defaultDuration = TIMER_SETTINGS.defaultDuration,
  meditationType = 'mindfulness',
  meditationTypeName,
  onSessionComplete
}) => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(defaultDuration * 60); // Convert to seconds
  const [startTime, setStartTime] = useState<Date | null>(null);

  const [sessionId, setSessionId] = useState<string>('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const backgroundTimeRef = useRef<number>(0);

  // Generate session ID
  useEffect(() => {
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedTimerState = localStorage.getItem('meditation_timer_state');
    if (savedTimerState) {
      try {
        const state = JSON.parse(savedTimerState);
        const now = Date.now();

        // Check if the saved session is from today and not completed
        const sessionDate = new Date(state.startTime);
        const today = new Date();
        const isToday = sessionDate.toDateString() === today.toDateString();

        if (isToday && state.isRunning && !state.isCompleted) {
          // Calculate elapsed time including background time
          const backgroundElapsed = Math.floor((now - state.lastUpdate) / 1000);
          const totalElapsed = state.elapsed + backgroundElapsed;

          setIsRunning(state.isRunning);
          setIsPaused(state.isPaused);
          setElapsed(totalElapsed);
          setTotal(state.total);
          setStartTime(new Date(state.startTime));
          setSessionId(state.sessionId);

          // Resume timer if it was running
          if (state.isRunning && !state.isPaused) {
            startTimeRef.current = now - (totalElapsed * 1000);
            lastUpdateRef.current = now;

            intervalRef.current = setInterval(() => {
              const currentTime = Date.now();
              const newElapsed = Math.floor((currentTime - startTimeRef.current) / 1000);
              setElapsed(prev => {
                const updated = Math.min(newElapsed, total);
                lastUpdateRef.current = currentTime;

                // Save state periodically
                saveTimerState(updated, total, true, false, new Date(state.startTime), state.sessionId);

                if (updated >= total) {
                  completeSession();
                  return total;
                }
                return updated;
              });
            }, 1000);
          }
        } else {
          // Clear old state
          localStorage.removeItem('meditation_timer_state');
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
        localStorage.removeItem('meditation_timer_state');
      }
    }
  }, []);

  // Save timer state to localStorage
  const saveTimerState = (
    elapsedTime: number,
    totalTime: number,
    running: boolean,
    paused: boolean,
    sessionStartTime: Date,
    sessionIdValue: string
  ) => {
    const state = {
      elapsed: elapsedTime,
      total: totalTime,
      isRunning: running,
      isPaused: paused,
      startTime: sessionStartTime.toISOString(),
      sessionId: sessionIdValue,
      lastUpdate: Date.now(),
      isCompleted: false
    };
    localStorage.setItem('meditation_timer_state', JSON.stringify(state));
  };

  // Clear timer state from localStorage
  const clearTimerState = () => {
    localStorage.removeItem('meditation_timer_state');
  };

  // Handle visibility change (tab switching, screen off)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, save current state
        if (isRunning && startTime) {
          saveTimerState(elapsed, total, isRunning, isPaused, startTime, sessionId);
        }
      } else {
        // Page is visible again
        const savedState = localStorage.getItem('meditation_timer_state');
        if (savedState && isRunning && startTime) {
          try {
            const state = JSON.parse(savedState);
            const now = Date.now();
            const timeDiff = Math.floor((now - state.lastUpdate) / 1000);

            if (timeDiff > 0 && !isPaused) {
              // Update elapsed time with background time
              const newElapsed = Math.min(elapsed + timeDiff, total);
              setElapsed(newElapsed);

              // Adjust start time reference
              startTimeRef.current = now - (newElapsed * 1000);

              // Check if timer should complete
              if (newElapsed >= total) {
                completeSession();
              }
            }
          } catch (error) {
            console.error('Error updating timer from background:', error);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, isPaused, elapsed, total, startTime, sessionId, completeSession]);

  // Periodic state saving
  useEffect(() => {
    if (isRunning && startTime) {
      const saveInterval = setInterval(() => {
        saveTimerState(elapsed, total, isRunning, isPaused, startTime, sessionId);
      }, 10000); // Save every 10 seconds

      return () => clearInterval(saveInterval);
    }
  }, [isRunning, isPaused, elapsed, total, startTime, sessionId]);

  // Handle session completion (for both completed and stopped sessions)
  const handleSessionEnd = useCallback(async (status: 'completed' | 'abandoned') => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsRunning(false);
    setIsPaused(false);

    // Clear timer state from localStorage
    clearTimerState();

    // Create session data
    const typeName = meditationTypeName || meditationType;
    const sessionData: Omit<MeditationSession, 'id'> = {
      userId: user?.id || 'anonymous',
      typeId: meditationType,
      typeName: typeName,
      startTime: startTime || new Date(),
      endTime: new Date(),
      duration: Math.max(1, Math.ceil(elapsed / 60)), // Convert to minutes, minimum 1 minute
      status,
      tags: [meditationType],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      // Save session to Firestore and get the generated ID
      const sessionId = await MeditationService.saveSession(sessionData);
      console.log(`Session ${status} successfully:`, sessionId);
      
      // Create the complete session object with the generated ID
      const session: MeditationSession = {
        ...sessionData,
        id: sessionId,
      };
      
      // Call completion callback
      if (onSessionComplete) {
        onSessionComplete(session);
      }
    } catch (error) {
      console.error(`Failed to save ${status} session:`, error);
      // Still call completion callback even if save fails, but with temporary ID
      const session: MeditationSession = {
        ...sessionData,
        id: sessionId,
      };
      if (onSessionComplete) {
        onSessionComplete(session);
      }
    }
  }, [sessionId, user?.id, meditationType, meditationTypeName, startTime, elapsed, onSessionComplete, clearTimerState]);

  // Complete session function (defined first to avoid dependency issues)
  const completeSession = useCallback(() => {
    handleSessionEnd('completed');
  }, [handleSessionEnd]);

  // Timer logic
  const startTimer = useCallback(() => {
    if (!isRunning) {
      const now = Date.now();
      setIsRunning(true);
      setIsPaused(false);
      setStartTime(new Date());
      startTimeRef.current = now;
      lastUpdateRef.current = now;

      intervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const newElapsed = Math.floor((currentTime - startTimeRef.current) / 1000);

        setElapsed((_prev) => {
          const updated = Math.min(newElapsed, total);
          lastUpdateRef.current = currentTime;

          // Save state
          if (startTime) {
            saveTimerState(updated, total, true, false, startTime, sessionId);
          }

          if (updated >= total) {
            // Timer completed
            completeSession();
            return total;
          }
          return updated;
        });
      }, 1000);
    }
  }, [isRunning, total, completeSession, startTime, sessionId, saveTimerState]);

  const pauseTimer = useCallback(() => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      pauseTimeRef.current = Date.now();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Save paused state
      if (startTime) {
        saveTimerState(elapsed, total, true, true, startTime, sessionId);
      }
    }
  }, [isRunning, isPaused, elapsed, total, startTime, sessionId, saveTimerState]);

  const resumeTimer = useCallback(() => {
    if (isRunning && isPaused) {
      const now = Date.now();
      setIsPaused(false);

      // Adjust for pause time
      const pauseDuration = now - pauseTimeRef.current;
      startTimeRef.current += pauseDuration;
      lastUpdateRef.current = now;

      intervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const newElapsed = Math.floor((currentTime - startTimeRef.current) / 1000);

        setElapsed((_prev) => {
          const updated = Math.min(newElapsed, total);
          lastUpdateRef.current = currentTime;

          // Save state
          if (startTime) {
            saveTimerState(updated, total, true, false, startTime, sessionId);
          }

          if (updated >= total) {
            completeSession();
            return total;
          }
          return updated;
        });
      }, 1000);
    }
  }, [isRunning, isPaused, total, completeSession, startTime, sessionId, saveTimerState]);

  const stopTimer = useCallback(() => {
    if (isRunning && startTime) {
      // Handle stopped session
      handleSessionEnd('abandoned');
    } else {
      setIsRunning(false);
      setIsPaused(false);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Clear timer state
    clearTimerState();
  }, [isRunning, startTime, handleSessionEnd, clearTimerState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = (elapsed / total) * 100;

  // Calculate remaining time
  const remaining = total - elapsed;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      {/* Timer Display */}
      <div className="text-center mb-8">
        <div className="relative w-64 h-64 mx-auto mb-6">
          {/* Progress Circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
              className="dark:stroke-gray-600"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#6b9e7a"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {formatTime(remaining)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {isPaused ? 'Paused' : isRunning ? 'Meditating' : 'Ready'}
              </div>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {meditationTypeName || (meditationType.charAt(0).toUpperCase() + meditationType.slice(1))} Meditation
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Session {sessionId.slice(-6)}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4 mb-6">
        {!isRunning ? (
          <Button
            onClick={startTimer}
            variant="meditation"
            size="lg"
            className="px-8 py-3"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button
                onClick={resumeTimer}
                variant="meditation"
                size="lg"
                className="px-8 py-3"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resume
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                variant="outline"
                size="lg"
                className="px-8 py-3"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pause
              </Button>
            )}
            
            <Button
              onClick={stopTimer}
              variant="outline"
              size="lg"
              className="px-8 py-3"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Stop
            </Button>
          </>
        )}
      </div>

      {/* Progress Info */}
      <div className="text-center space-y-2">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Progress: {Math.round(progress)}%
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Elapsed: {formatTime(elapsed)} / Total: {formatTime(total)}
        </div>
        {startTime && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Started: {startTime.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Quick Duration Buttons */}
      {!isRunning && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
            Quick Start
          </h4>
          <div className="flex justify-center space-x-2">
            {[5, 10, 15, 20, 30].map((minutes) => (
              <Button
                key={minutes}
                onClick={() => setTotal(minutes * 60)}
                variant="ghost"
                size="sm"
                className={`px-3 py-1 text-xs ${
                  total === minutes * 60 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''
                }`}
              >
                {minutes}m
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
