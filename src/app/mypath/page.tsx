'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserPathService } from '@/lib/userPathService';
import { PathProgress } from '@/types';
import { PATH_STAGES, calculateProgress, getNextStage } from '@/constants/path';
import { ArrowLeft, ArrowRight, Check, Lock, Sparkles, Star, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyPathPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [pathProgress, setPathProgress] = useState<PathProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const currentStageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPath = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const progress = await UserPathService.getUserPath(user.id);
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
  }, [user, showToast]);

  // Scroll to current stage on load
  useEffect(() => {
    if (!loading && pathProgress && currentStageRef.current) {
      setTimeout(() => {
        currentStageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [loading, pathProgress]);

  const handleMoveToNextStage = async () => {
    if (!user || !pathProgress) return;

    try {
      setUpdating(true);
      const newStage = await UserPathService.moveToNextStage(user.id);

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update progress';
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
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
      const newStage = await UserPathService.moveToPreviousStage(user.id);

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update progress';
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!pathProgress) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Unable to load path</h2>
          <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
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
      <div className="min-h-screen bg-background relative overflow-hidden pb-32">
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
          <div className="absolute top-40 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-sm supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-foreground truncate">My Path</h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 relative z-10">
          {/* Title Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-4"
            >
              <Map className="w-6 h-6" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight"
            >
              මගේ නිවන් මඟ
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground"
            >
              The Seven Purifications • Path to Liberation
            </motion.p>
          </div>

          {/* Overall Progress Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-12 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6 sm:p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Journey Progress
                  </h3>
                </div>
                <span className="text-2xl font-bold text-primary">{progress}%</span>
              </div>

              <div className="h-4 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-sm border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-purple-500 relative"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
              </div>

              <div className="flex justify-between mt-3 text-xs text-muted-foreground font-medium">
                <span>Stage {pathProgress.currentStage} of 8</span>
                <span>Updated {pathProgress.updatedAt.toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>

          {/* Timeline */}
          <div className="relative space-y-8 pl-8 sm:pl-0">
            {/* Vertical Line (Mobile: Left, Desktop: Center) */}
            <div className="absolute left-8 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent -translate-x-1/2 hidden sm:block" />
            <div className="absolute left-[2.25rem] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent -translate-x-1/2 sm:hidden" />

            {PATH_STAGES.map((stage, index) => {
              const isCompleted = stage.order < pathProgress.currentStage;
              const isCurrent = stage.order === pathProgress.currentStage;
              const isLocked = stage.order > pathProgress.currentStage;

              return (
                <motion.div
                  key={stage.order}
                  ref={isCurrent ? currentStageRef : null}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex items-center gap-8 ${index % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                    }`}
                >
                  {/* Timeline Node */}
                  <div className="absolute left-0 sm:left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isCurrent
                          ? 'bg-background border-primary shadow-[0_0_20px_rgba(var(--primary),0.5)] scale-110'
                          : isCompleted
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-background border-muted text-muted-foreground'
                        }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : isLocked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-bold text-primary">{stage.order}</span>
                      )}
                    </div>
                  </div>

                  {/* Spacer for Desktop Layout */}
                  <div className="hidden sm:block flex-1" />

                  {/* Card */}
                  <div className="flex-1 w-full sm:w-auto pl-12 sm:pl-0">
                    <div
                      className={`relative p-6 rounded-2xl border transition-all duration-300 group ${isCurrent
                          ? 'bg-primary/5 border-primary/50 shadow-lg shadow-primary/5'
                          : isCompleted
                            ? 'bg-white/5 border-white/10 hover:bg-white/10'
                            : 'bg-white/5 border-white/5 opacity-70'
                        }`}
                    >
                      {isCurrent && (
                        <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-lg">
                          Current Stage
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className={`text-lg font-bold ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                          {stage.name}
                        </h3>
                        {isCompleted && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      </div>

                      <p className="text-sm font-medium text-muted-foreground mb-3">{stage.nameEn}</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{stage.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Floating Action Bar */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-24 left-4 right-4 z-50 max-w-xl mx-auto"
          >
            <div className="bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
              <Button
                onClick={handleMoveToPreviousStage}
                variant="outline"
                disabled={!canGoBack || updating}
                className="flex-1 h-12 rounded-xl border-white/10 hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                onClick={handleMoveToNextStage}
                disabled={!canGoForward || updating}
                className="flex-[2] h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold text-base"
              >
                {updating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Complete Stage</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
