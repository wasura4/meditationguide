'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MeditationSetup } from '@/components/meditation/MeditationSetup';
import { MeditationTimer } from '@/components/meditation/MeditationTimer';
import { SessionReflectionForm } from '@/components/meditation/SessionReflectionForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { MeditationSession } from '@/types';
import { MeditationService } from '@/lib/meditationService';

type MeditationMode = 'setup' | 'timer' | 'complete' | 'reflection';

export default function MeditatePage() {
  const [mode, setMode] = useState<MeditationMode>('setup');
  const [meditationType, setMeditationType] = useState('mindfulness');
  const [duration, setDuration] = useState(15);
  const [completedSession, setCompletedSession] = useState<MeditationSession | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  const handleStart = (type: string, sessionDuration: number) => {
    setMeditationType(type);
    setDuration(sessionDuration);
    setMode('timer');
    
    showToast({
      type: 'success',
      title: 'Session Started',
      message: `Beginning ${type} meditation for ${sessionDuration} minutes.`,
      duration: 3000
    });
  };

  const handleCancel = () => {
    setMode('setup');
    showToast({
      type: 'info',
      title: 'Session Cancelled',
      message: 'Returned to meditation setup.',
      duration: 2000
    });
  };

  const handleSessionComplete = (session: MeditationSession) => {
    setCompletedSession(session);
    setMode('reflection');
    
    showToast({
      type: 'success',
      title: 'Session Complete!',
      message: `Great job! You've completed ${session.duration} minutes of meditation.`,
      duration: 4000
    });
  };

  const handleReflectionSave = async (session: MeditationSession) => {
    try {
      // Update the session with reflection data
      await MeditationService.updateSession(session.id, {
        notes: session.notes,
        rating: session.rating,
        mood: session.mood,
        distractions: session.distractions,
        insights: session.insights,
      });
      
      setCompletedSession(session);
      setMode('complete');
      
      showToast({
        type: 'success',
        title: 'Reflection Saved',
        message: 'Your session notes have been saved successfully.',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to save reflection:', error);
      
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save reflection notes, but your session is recorded.',
        duration: 5000
      });
      
      // Still show completion screen
      setCompletedSession(session);
      setMode('complete');
    }
  };

  const handleReflectionSkip = () => {
    setMode('complete');
    showToast({
      type: 'info',
      title: 'Reflection Skipped',
      message: 'Session completed without reflection notes.',
      duration: 2000
    });
  };

  const handleNewSession = () => {
    setMode('setup');
    setCompletedSession(null);
    showToast({
      type: 'info',
      title: 'New Session',
      message: 'Ready to start a new meditation session.',
      duration: 2000
    });
  };

  const handleViewLogbook = () => {
    showToast({
      type: 'info',
      title: 'Viewing Logbook',
      message: 'Taking you to your meditation history.',
      duration: 2000
    });
    setTimeout(() => router.push('/logbook'), 500);
  };

  const renderContent = () => {
    switch (mode) {
      case 'setup':
        return (
          <MeditationSetup
            onStart={handleStart}
            onCancel={() => router.push('/dashboard')}
          />
        );
      
      case 'timer':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Button
                onClick={handleCancel}
                variant="ghost"
                className="mb-4"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Setup
              </Button>
            </div>
            <MeditationTimer
              defaultDuration={duration}
              meditationType={meditationType}
              onSessionComplete={handleSessionComplete}
            />
          </div>
        );
      
                   case 'reflection':
               return (
                 <SessionReflectionForm
                   session={completedSession!}
                   onSave={handleReflectionSave}
                   onSkip={handleReflectionSkip}
                 />
               );
             
             case 'complete':
               return (
                 <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                   <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                     <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                     Session Complete!
                   </h2>
                   <p className="text-gray-600 dark:text-gray-300 mb-6">
                     Great job! You&apos;ve completed your meditation session.
                   </p>
                   
                   {completedSession && (
                     <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                       <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                         Session Summary
                       </h3>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                         <div>
                           <span className="text-gray-600 dark:text-gray-300">Type:</span>
                           <span className="ml-2 font-medium text-gray-900 dark:text-white">
                             {completedSession.typeName}
                           </span>
                         </div>
                         <div>
                           <span className="text-gray-600 dark:text-gray-300">Duration:</span>
                           <span className="ml-2 font-medium text-gray-900 dark:text-white">
                             {completedSession.duration}m
                           </span>
                         </div>
                         <div>
                           <span className="text-gray-600 dark:text-gray-300">Started:</span>
                           <span className="ml-2 font-medium text-gray-900 dark:text-white">
                             {completedSession.startTime.toLocaleTimeString()}
                           </span>
                         </div>
                         <div>
                           <span className="text-gray-600 dark:text-gray-300">Completed:</span>
                           <span className="ml-2 font-medium text-gray-900 dark:text-white">
                             {completedSession.endTime?.toLocaleTimeString()}
                           </span>
                         </div>
                         {completedSession.rating && (
                           <div>
                             <span className="text-gray-600 dark:text-gray-300">Rating:</span>
                             <span className="ml-2 font-medium text-gray-900 dark:text-white">
                               {'⭐'.repeat(completedSession.rating)}
                             </span>
                           </div>
                         )}
                         {completedSession.mood && (
                           <div>
                             <span className="text-gray-600 dark:text-gray-300">Mood:</span>
                             <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                               {completedSession.mood}
                             </span>
                           </div>
                         )}
                       </div>
                       {completedSession.notes && (
                         <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                           <h4 className="font-medium text-gray-900 dark:text-white mb-2">Notes:</h4>
                           <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                             &quot;{completedSession.notes}&quot;
                           </p>
                         </div>
                       )}
                     </div>
                   )}
                   
                   <div className="space-y-3">
                     <Button
                       onClick={handleNewSession}
                       variant="meditation"
                       className="w-full"
                     >
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       Start New Session
                     </Button>
                     
                     <Button
                       onClick={handleViewLogbook}
                       variant="outline"
                       className="w-full"
                     >
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                       </svg>
                       View Logbook
                     </Button>
                     
                     <Button
                       onClick={() => router.push('/dashboard')}
                       variant="ghost"
                       className="w-full"
                     >
                       Back to Dashboard
                     </Button>
                   </div>
                 </div>
               );
      
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                                     <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                       {mode === 'setup' && 'Prepare Meditation'}
                       {mode === 'timer' && 'Meditation Session'}
                       {mode === 'reflection' && 'Session Reflection'}
                       {mode === 'complete' && 'Session Complete'}
                     </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="ghost"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>
      </div>
    </ProtectedRoute>
  );
}
