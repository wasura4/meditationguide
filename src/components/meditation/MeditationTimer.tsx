'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { TIMER_SETTINGS } from '@/constants';
import { MeditationSession } from '@/types';
import { MeditationService } from '@/lib/meditationService';
import { playBellSound } from '@/lib/audioUtils';
import { useNativeBridge } from '@/hooks/useNativeBridge';

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
  const nativeBridge = useNativeBridge();
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
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Generate session ID
  useEffect(() => {
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  // Wake Lock functions to keep screen awake during meditation
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        const wakeLock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = wakeLock;
        console.log('Wake Lock activated - screen will stay awake during meditation');

        // Listen for wake lock release
        wakeLock.addEventListener('release', () => {
          console.log('Wake Lock released');
        });
      }
    } catch (error) {
      console.error('Failed to acquire wake lock:', error);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake Lock manually released');
      }
    } catch (error) {
      console.error('Failed to release wake lock:', error);
    }
  }, []);

  // Clear timer state from localStorage
  const clearTimerState = useCallback(() => {
    localStorage.removeItem('meditation_timer_state');
  }, []);

  // Handle session completion (for both completed and stopped sessions)
  const handleSessionEnd = useCallback(async (status: 'completed' | 'abandoned') => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Release wake lock when session ends
    await releaseWakeLock();

    setIsRunning(false);
    setIsPaused(false);

    // Clear timer state from localStorage
    clearTimerState();

    // Create session data
    const typeName = meditationTypeName || meditationType;
    const endedAt = new Date();
    const startedAt = startTime ?? (startTimeRef.current ? new Date(startTimeRef.current) : new Date());
    // Use elapsed seconds from timer state as the accurate duration
    // This already includes background time calculated during restoration
    const durationMinutes = Math.max(1, Math.round(elapsed / 60));

    const sessionData: Omit<MeditationSession, 'id'> = {
      userId: user?.id || 'anonymous',
      typeId: meditationType,
      typeName: typeName,
      startTime: startedAt,
      endTime: endedAt,
      duration: durationMinutes, // in minutes
      status,
      tags: [meditationType],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      // Save session to Firestore and get the generated ID
      const savedSessionId = await MeditationService.saveSession(sessionData);
      console.log(`Session ${status} successfully:`, savedSessionId);
      
      // Create the complete session object with the generated ID
      const session: MeditationSession = {
        ...sessionData,
        id: savedSessionId,
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
  }, [sessionId, user?.id, meditationType, meditationTypeName, startTime, elapsed, onSessionComplete, releaseWakeLock]);

  // Complete session function
  const completeSession = useCallback(() => {
    // Play bell sound when timer completes (web fallback)
    playBellSound();

    // Notify native app (Android/iOS) about meditation completion
    // Native apps will handle their own notification and sound
    nativeBridge.notifyMeditationComplete({
      durationMinutes: Math.round(total / 60),
      typeName: meditationTypeName || 'Meditation',
      typeId: meditationType,
    });

    handleSessionEnd('completed');
  }, [handleSessionEnd, nativeBridge, total, meditationTypeName, meditationType]);

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
              setElapsed((_prev) => {
                const updated = Math.min(newElapsed, state.total);
                lastUpdateRef.current = currentTime;

                // Save state periodically
                saveTimerState(updated, state.total, true, false, new Date(state.startTime), state.sessionId);

                if (updated >= state.total) {
                  completeSession();
                  return state.total;
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
  const saveTimerState = useCallback((
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
  }, []);

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

  // Timer logic
  const startTimer = useCallback(async () => {
    if (!isRunning) {
      const now = Date.now();

      // Request wake lock to keep screen awake
      await requestWakeLock();

      // Notify native app (Android/iOS) about meditation start
      nativeBridge.notifyMeditationStart({
        durationMinutes: Math.round(total / 60),
        typeName: meditationTypeName || 'Meditation',
        typeId: meditationType,
      });

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
  }, [isRunning, total, completeSession, startTime, sessionId, saveTimerState, requestWakeLock, nativeBridge, meditationTypeName, meditationType]);

  const pauseTimer = useCallback(async () => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      pauseTimeRef.current = Date.now();

      // Notify native app (Android/iOS) about meditation pause
      const remainingSeconds = total - elapsed;
      nativeBridge.notifyMeditationPause(elapsed, remainingSeconds);

      // Release wake lock when paused
      await releaseWakeLock();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Save paused state
      if (startTime) {
        saveTimerState(elapsed, total, true, true, startTime, sessionId);
      }
    }
  }, [isRunning, isPaused, elapsed, total, startTime, sessionId, saveTimerState, releaseWakeLock, nativeBridge]);

  const resumeTimer = useCallback(async () => {
    if (isRunning && isPaused) {
      const now = Date.now();

      // Notify native app (Android/iOS) about meditation resume
      const remainingSeconds = total - elapsed;
      nativeBridge.notifyMeditationResume(remainingSeconds);

      // Reacquire wake lock when resuming
      await requestWakeLock();

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
  }, [isRunning, isPaused, total, completeSession, startTime, sessionId, saveTimerState, requestWakeLock, nativeBridge, elapsed]);

  const stopTimer = useCallback(async () => {
    if (isRunning && startTime) {
      // Notify native app (Android/iOS) about meditation stop
      nativeBridge.notifyMeditationStop(elapsed);

      // Handle stopped session
      handleSessionEnd('abandoned');
    } else {
      // Release wake lock even if session wasn't running
      await releaseWakeLock();
      setIsRunning(false);
      setIsPaused(false);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Clear timer state
    clearTimerState();
  }, [isRunning, startTime, handleSessionEnd, clearTimerState, releaseWakeLock, nativeBridge, elapsed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Release wake lock on unmount
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

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
    <div className="max-w-md mx-auto bg-card rounded-2xl shadow-xl p-8">
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
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="text-[var(--primary)] transition-all duration-1000 ease-out"
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
        {isRunning && !isPaused && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-primary/80 dark:text-primary/70 mt-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Screen will stay awake</span>
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
                  total === minutes * 60 ? 'bg-muted text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''
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


