'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');

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
          <div className="w-full">
            <MeditationTimer
              defaultDuration={duration}
              meditationType={meditationType}
              meditationTypeName={meditationTypeName}
              eventId={eventId || undefined}
              onSessionComplete={handleSessionComplete}
            />
          </div>
        );

      case 'reflection':
        return (
          <div className="max-w-2xl mx-auto">
            <SessionReflectionForm
              session={completedSession!}
              onSave={handleReflectionSave}
              onSkip={handleReflectionSkip}
            />
          </div>
        );

      case 'complete':
        return (
          <div className="max-w-md mx-auto bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-3xl font-bold mb-2 text-foreground">
              තෙරුවන් සරණයි
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Your session is complete. Peace is within you.
            </p>

            {completedSession && (
              <div className="bg-background/50 rounded-2xl p-6 mb-8 text-left border border-white/5">
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                  Session Summary
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Type</span>
                    <span className="font-medium text-foreground text-base">
                      {completedSession.typeName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Duration</span>
                    <span className="font-medium text-foreground text-base">
                      {completedSession.duration}m
                    </span>
                  </div>
                  {completedSession.rating && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-xs mb-1">Rating</span>
                      <span className="font-medium text-yellow-500 text-base">
                        {'⭐'.repeat(completedSession.rating)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleNewSession}
                variant="default"
                size="lg"
                className="w-full h-12 rounded-xl text-base"
              >
                Start New Session
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleViewLogbook}
                  variant="outline"
                  className="w-full h-12 rounded-xl"
                >
                  Logbook
                </Button>
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="ghost"
                  className="w-full h-12 rounded-xl"
                >
                  Dashboard
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className={`min-h-screen transition-all duration-1000 ease-in-out ${mode === 'timer'
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black'
        : 'bg-gradient-to-br from-background via-primary/5 to-secondary/5 animate-gradient-x'
        }`}>

        {/* Dynamic Background Elements (Blobs) */}
        {mode !== 'timer' && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-blob" />
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
          </div>
        )}

        {/* Header & Stepper - Hide in Timer Mode */}
        <div className={`transition-all duration-700 ${mode === 'timer' ? 'opacity-0 -translate-y-10 pointer-events-none absolute' : 'opacity-100 translate-y-0 relative'}`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Stepper */}
            {mode !== 'complete' && (
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => (
                    <React.Fragment key={step.key}>
                      <div className="flex flex-col items-center z-10">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-500 ${mode === step.key
                            ? 'bg-primary text-primary-foreground shadow-lg scale-110 ring-4 ring-primary/20'
                            : steps.findIndex(s => s.key === mode) > index
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                            }`}
                        >
                          {steps.findIndex(s => s.key === mode) > index ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          ) : (
                            <span className="text-sm">{index + 1}</span>
                          )}
                        </div>
                        <span className={`mt-2 text-xs font-medium transition-colors duration-300 ${mode === step.key ? 'text-primary' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${steps.findIndex(s => s.key === mode) > index ? 'bg-primary' : 'bg-muted'
                          }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <main className={`relative z-10 max-w-5xl mx-auto px-4 sm:px-6 transition-all duration-1000 ${mode === 'timer' ? 'h-screen flex items-center justify-center -mt-20' : 'pt-6 pb-32'}`}>
          {renderContent()}
        </main>
      </div>
    </ProtectedRoute>
  );
}
