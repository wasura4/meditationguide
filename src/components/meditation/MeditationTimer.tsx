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
  onSessionComplete?: (session: MeditationSession) => void;
}

export const MeditationTimer: React.FC<MeditationTimerProps> = ({
  defaultDuration = TIMER_SETTINGS.defaultDuration,
  meditationType = 'mindfulness',
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

  // Generate session ID
  useEffect(() => {
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  // Handle session completion (for both completed and stopped sessions)
  const handleSessionEnd = useCallback(async (status: 'completed' | 'abandoned') => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsRunning(false);
    setIsPaused(false);
    
    // Create session data
    const sessionData: Omit<MeditationSession, 'id'> = {
      userId: user?.id || 'anonymous',
      typeId: meditationType,
      typeName: meditationType,
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
  }, [sessionId, user?.id, meditationType, startTime, elapsed, onSessionComplete]);

  // Complete session function (defined first to avoid dependency issues)
  const completeSession = useCallback(() => {
    handleSessionEnd('completed');
  }, [handleSessionEnd]);

  // Timer logic
  const startTimer = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      setIsPaused(false);
      setStartTime(new Date());
      startTimeRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        setElapsed(prev => {
          const newElapsed = prev + 1;
          if (newElapsed >= total) {
            // Timer completed
            completeSession();
            return total;
          }
          return newElapsed;
        });
      }, 1000);
    }
  }, [isRunning, total, completeSession]);

  const pauseTimer = useCallback(() => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      pauseTimeRef.current = Date.now();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isRunning, isPaused]);

  const resumeTimer = useCallback(() => {
    if (isRunning && isPaused) {
      setIsPaused(false);
      
      // Adjust for pause time
      const pauseDuration = Date.now() - pauseTimeRef.current;
      startTimeRef.current += pauseDuration;
      
      intervalRef.current = setInterval(() => {
        setElapsed(prev => {
          const newElapsed = prev + 1;
          if (newElapsed >= total) {
            completeSession();
            return total;
          }
          return newElapsed;
        });
      }, 1000);
    }
  }, [isRunning, isPaused, total, completeSession]);

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
  }, [isRunning, startTime, handleSessionEnd]);

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
              stroke="#0ea5e9"
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
            {meditationType.charAt(0).toUpperCase() + meditationType.slice(1)} Meditation
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
