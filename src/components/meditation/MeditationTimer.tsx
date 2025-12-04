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
  eventId?: string;
  onSessionComplete?: (session: MeditationSession) => void;
  onSessionUpdate?: (typeId: string, typeName: string) => void;
}

export const MeditationTimer: React.FC<MeditationTimerProps> = ({
  defaultDuration = TIMER_SETTINGS.defaultDuration,
  meditationType = 'mindfulness',
  meditationTypeName,
  eventId,
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
    // Calculate duration using elapsed time (preferred) as it accurately tracks timer state
    // Fall back to wall clock time if elapsed is not available or seems incorrect
    const minutesFromElapsed = Math.round(elapsed / 60);
    const minutesFromClock = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);
    // Use elapsed time if it's reasonable, otherwise use wall clock time
    // This handles cases where timer state might be corrupted or not updated
    const durationMinutes = Math.max(1, minutesFromElapsed > 0 ? minutesFromElapsed : minutesFromClock);

    const sessionData: Omit<MeditationSession, 'id'> = {
      userId: user?.id || 'anonymous',
      typeId: meditationType,
      typeName: typeName,
      startTime: startedAt,
      endTime: endedAt,
      duration: durationMinutes, // in minutes
      status,
      tags: [meditationType],
      ...(eventId && { eventId }), // Only include eventId if it exists
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
    <div className="flex flex-col items-center justify-between w-full max-w-md mx-auto h-[75vh] py-8 animate-in fade-in zoom-in duration-500">

      {/* Top Section: Session Info */}
      <div className="text-center space-y-2 pt-4">
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {meditationTypeName || (meditationType.charAt(0).toUpperCase() + meditationType.slice(1))}
        </h2>
        <p className="text-primary font-medium uppercase tracking-wider text-sm">
          {isPaused ? 'Session Paused' : isRunning ? 'Focus' : 'Ready to Start'}
        </p>
      </div>

      {/* Middle Section: Timer */}
      <div className="relative flex items-center justify-center">
        <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
          {/* Progress SVG */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-white/10"
            />
            {/* Progress */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="text-primary transition-all duration-500 ease-linear drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-7xl md:text-8xl font-bold tracking-tighter tabular-nums text-white select-none">
              {formatTime(remaining)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Controls */}
      <div className="flex items-center justify-center gap-8 pb-8">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground shadow-xl hover:scale-105 transition-all active:scale-95"
          >
            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </button>
        ) : (
          <>
            {/* Stop Button */}
            <button
              onClick={stopTimer}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-red-500/20 hover:text-red-500 transition-all active:scale-95"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
            </button>

            {/* Play/Pause Button */}
            {isPaused ? (
              <button
                onClick={resumeTimer}
                className="flex items-center justify-center w-24 h-24 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 transition-all active:scale-95"
              >
                <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="flex items-center justify-center w-24 h-24 rounded-full bg-white text-black shadow-xl hover:scale-105 transition-all active:scale-95"
              >
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Screen Awake Indicator */}
      {isRunning && !isPaused && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/30 font-medium uppercase tracking-widest">
          Screen Awake
        </div>
      )}
    </div>
  );
};
