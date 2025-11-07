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
import { MeditationTypeService } from '@/lib/meditationTypeService';

type MeditationMode = 'setup' | 'timer' | 'complete' | 'reflection';

export default function MeditatePage() {
  const [mode, setMode] = useState<MeditationMode>('setup');
  const [meditationType, setMeditationType] = useState('mindfulness');
  const [meditationTypeName, setMeditationTypeName] = useState('Mindfulness');
  const [duration, setDuration] = useState(15);
  const [completedSession, setCompletedSession] = useState<MeditationSession | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  const steps: Array<{ key: MeditationMode; label: string }> = [
    { key: 'setup', label: 'Setup' },
    { key: 'timer', label: 'Meditate' },
    { key: 'reflection', label: 'Reflect' },
  ];

  const handleStart = async (type: string, sessionDuration: number) => {
    try {
      setMeditationType(type);
      setDuration(sessionDuration);

      // Get the meditation type name from Firebase
      const meditationTypeData = await MeditationTypeService.getTypeById(type);
      const typeName = meditationTypeData?.name || type.charAt(0).toUpperCase() + type.slice(1);
      setMeditationTypeName(typeName);

      setMode('timer');

      showToast({
        type: 'success',
        title: 'Session Started',
        message: `Beginning ${typeName} meditation for ${sessionDuration} minutes.`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error getting meditation type:', error);
      // Fallback to using the type ID as name
      setMeditationTypeName(type.charAt(0).toUpperCase() + type.slice(1));
      setMode('timer');

      showToast({
        type: 'success',
        title: 'Session Started',
        message: `Beginning meditation for ${sessionDuration} minutes.`,
        duration: 3000
      });
    }
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
              meditationTypeName={meditationTypeName}
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
                 <div className="max-w-md mx-auto bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center">
                   <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                     <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>

                   <h2 className="text-2xl font-bold mb-2">
                     Session Complete!
                   </h2>
                   <p className="text-muted-foreground mb-6">
                     Great job! You&apos;ve completed your meditation session.
                   </p>
                   
                   {completedSession && (
                     <div className="bg-muted/50 rounded-lg p-4 mb-6">
                       <h3 className="font-semibold mb-3">
                         Session Summary
                       </h3>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                         <div>
                           <span className="text-muted-foreground">Type:</span>
                           <span className="ml-2 font-medium">
                             {completedSession.typeName}
                           </span>
                         </div>
                         <div>
                           <span className="text-muted-foreground">Duration:</span>
                           <span className="ml-2 font-medium">
                             {completedSession.duration}m
                           </span>
                         </div>
                         <div>
                           <span className="text-muted-foreground">Started:</span>
                           <span className="ml-2 font-medium">
                             {completedSession.startTime.toLocaleTimeString()}
                           </span>
                         </div>
                         <div>
                           <span className="text-muted-foreground">Completed:</span>
                           <span className="ml-2 font-medium">
                             {completedSession.endTime?.toLocaleTimeString()}
                           </span>
                         </div>
                         {completedSession.rating && (
                           <div>
                             <span className="text-muted-foreground">Rating:</span>
                             <span className="ml-2 font-medium">
                               {'⭐'.repeat(completedSession.rating)}
                             </span>
                           </div>
                         )}
                         {completedSession.mood && (
                           <div>
                             <span className="text-muted-foreground">Mood:</span>
                             <span className="ml-2 font-medium capitalize">
                               {completedSession.mood}
                             </span>
                           </div>
                         )}
                       </div>
                       {completedSession.notes && (
                         <div className="mt-4 pt-4 border-t">
                           <h4 className="font-medium mb-2">Notes:</h4>
                           <p className="text-sm text-muted-foreground italic">
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
      <div className="min-h-screen bg-background pb-28">
        {/* Hero Header */}
        <div className="bg-gradient-to-b from-muted/50 to-background border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                {mode === 'setup' && '🧘 Prepare Your Meditation'}
                {mode === 'timer' && '🧘‍♂️ Meditation in Progress'}
                {mode === 'reflection' && '📝 Reflect on Your Session'}
                {mode === 'complete' && '✨ Session Complete'}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
                {mode === 'setup' && 'Choose your practice and set your intention for a mindful session'}
                {mode === 'timer' && 'Stay present and focused on your meditation practice'}
                {mode === 'reflection' && 'Take a moment to capture insights from your practice'}
                {mode === 'complete' && 'Well done! Your dedication to practice brings you closer to peace'}
              </p>
            </div>

            {/* Progress Stepper - Only show in setup, timer, and reflection modes */}
            {mode !== 'complete' && (
              <div className="mt-8 max-w-md mx-auto">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => (
                    <React.Fragment key={step.key}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                            mode === step.key
                              ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                              : steps.findIndex(s => s.key === mode) > index
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {steps.findIndex(s => s.key === mode) > index ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-sm sm:text-base">{index + 1}</span>
                          )}
                        </div>
                        <span className={`mt-2 text-xs sm:text-sm font-medium ${mode === step.key ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-all ${
                          steps.findIndex(s => s.key === mode) > index ? 'bg-primary' : 'bg-muted'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {renderContent()}
        </main>
      </div>
    </ProtectedRoute>
  );
}

