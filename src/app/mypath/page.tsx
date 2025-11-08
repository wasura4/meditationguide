'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserPathService } from '@/lib/userPathService';
import { PathProgress } from '@/types';
import { PATH_STAGES, calculateProgress, getNextStage, getPreviousStage } from '@/constants/path';
import { ArrowLeft, ArrowRight, Check, Lock } from 'lucide-react';

export default function MyPathPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [pathProgress, setPathProgress] = useState<PathProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadPath = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const progress = await UserPathService.getUserPath(user.uid);
        setPathProgress(progress);
      } catch (error) {
        console.error('Error loading path:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load your path progress',
          duration: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    loadPath();
  }, [user]);

  const handleMoveToNextStage = async () => {
    if (!user || !pathProgress) return;

    try {
      setUpdating(true);
      const newStage = await UserPathService.moveToNextStage(user.uid);

      setPathProgress({
        ...pathProgress,
        currentStage: newStage,
        updatedAt: new Date()
      });

      const stageName = PATH_STAGES.find(s => s.order === newStage)?.name || '';

      showToast({
        type: 'success',
        title: 'Progress Updated!',
        message: `You've advanced to ${stageName}`,
        duration: 4000
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update progress',
        duration: 5000
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleMoveToPreviousStage = async () => {
    if (!user || !pathProgress) return;

    try {
      setUpdating(true);
      const newStage = await UserPathService.moveToPreviousStage(user.uid);

      setPathProgress({
        ...pathProgress,
        currentStage: newStage,
        updatedAt: new Date()
      });

      showToast({
        type: 'info',
        title: 'Progress Updated',
        message: `Moved back to stage ${newStage}`,
        duration: 3000
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update progress',
        duration: 5000
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background pb-28">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Loading Your Path...</h2>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!pathProgress) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background pb-28">
          <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Unable to load path</h2>
            <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const progress = calculateProgress(pathProgress.currentStage);
  const nextStage = getNextStage(pathProgress.currentStage);
  const canGoBack = pathProgress.currentStage > 1;
  const canGoForward = pathProgress.currentStage < 8;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-28">
        {/* Header */}
        <div className="bg-gradient-to-b from-muted/50 to-background border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
            </div>

            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">My Path to Liberation</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                සත්ත විශුද්ධිය - The Seven Purifications
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Overall Progress</span>
                <span className="text-sm font-semibold text-primary">{progress}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Stage {pathProgress.currentStage} of 8</span>
                <span>Last updated: {pathProgress.updatedAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Path Visualization */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-4">
            {PATH_STAGES.map((stage, index) => {
              const isCompleted = stage.order < pathProgress.currentStage;
              const isCurrent = stage.order === pathProgress.currentStage;
              const isLocked = stage.order > pathProgress.currentStage;

              return (
                <div
                  key={stage.order}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                    isCurrent
                      ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                      : isCompleted
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  {/* Connector Line */}
                  {index < PATH_STAGES.length - 1 && (
                    <div
                      className={`absolute left-10 top-full w-0.5 h-4 ${
                        isCompleted || isCurrent ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}

                  <div className="flex items-start gap-4">
                    {/* Stage Icon */}
                    <div
                      className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                        isCurrent
                          ? 'bg-primary text-primary-foreground shadow-lg'
                          : isCompleted
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-8 h-8" />
                      ) : isLocked ? (
                        <Lock className="w-6 h-6" />
                      ) : (
                        stage.order
                      )}
                    </div>

                    {/* Stage Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className={`text-xl font-bold mb-1 ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                            {stage.name}
                          </h3>
                          <p className="text-sm text-muted-foreground font-medium mb-2">{stage.nameEn}</p>
                          <p className="text-sm text-foreground/80">{stage.description}</p>
                        </div>

                        {isCurrent && (
                          <div className="flex-shrink-0">
                            <div className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full">
                              <span className="text-xs font-semibold text-primary">Current</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 bg-card rounded-2xl p-6 border">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Update Your Progress</h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleMoveToPreviousStage}
                variant="outline"
                disabled={!canGoBack || updating}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Move Back
              </Button>

              <Button
                onClick={handleMoveToNextStage}
                variant="default"
                disabled={!canGoForward || updating}
                className="flex-1"
              >
                {updating ? (
                  'Updating...'
                ) : (
                  <>
                    Advance to Next Stage
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {nextStage && canGoForward && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Next Stage:</p>
                <p className="text-sm font-semibold text-foreground">{nextStage.name} - {nextStage.nameEn}</p>
              </div>
            )}

            {!canGoForward && (
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg text-center">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  🙏 Congratulations! You have reached Nibbana - The ultimate liberation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
