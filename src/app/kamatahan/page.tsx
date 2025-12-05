'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { AudioLibrary } from '@/components/audio/AudioLibrary';
import { PlaylistManager } from '@/components/audio/PlaylistManager';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Headphones, Library, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function KamatahanPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'library' | 'playlists'>('playlists');
  const { showToast } = useToast();

  const handleTabChange = (tab: 'library' | 'playlists') => {
    setActiveTab(tab);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-30 animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] opacity-30" />
        </div>

        {/* Content */}
        <div className="relative z-10 pb-28">
          {/* Header */}
          <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-white/10 supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => window.history.back()}
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-lg font-semibold tracking-tight">Kamatahan</h1>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Meditation Sanctuary
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
                Explore guided meditations and deep Dhamma teachings to elevate your practice.
              </p>
            </motion.div>

            {/* Glassmorphic Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex p-1.5 rounded-2xl bg-muted/30 backdrop-blur-md border border-white/10 relative">
                {/* Animated Background Pill */}
                <motion.div
                  className="absolute inset-y-1.5 rounded-xl bg-background shadow-sm border border-white/5"
                  initial={false}
                  animate={{
                    x: activeTab === 'playlists' ? 0 : '100%',
                    width: '50%' // Assuming equal width tabs
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ left: 6, width: 'calc(50% - 6px)' }}
                />

                <button
                  onClick={() => handleTabChange('playlists')}
                  className={cn(
                    "relative z-10 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 min-w-[140px] justify-center",
                    activeTab === 'playlists' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Headphones className="w-4 h-4" />
                  <span>Guides</span>
                </button>
                <button
                  onClick={() => handleTabChange('library')}
                  className={cn(
                    "relative z-10 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 min-w-[140px] justify-center",
                    activeTab === 'library' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Library className="w-4 h-4" />
                  <span>Library</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'library' ? (
                  <div className="bg-card/30 backdrop-blur-md rounded-3xl border border-white/10 p-1 sm:p-6 shadow-xl shadow-black/5">
                    <AudioLibrary />
                  </div>
                ) : (
                  <div className="bg-card/30 backdrop-blur-md rounded-3xl border border-white/10 p-1 sm:p-6 shadow-xl shadow-black/5">
                    <PlaylistManager />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
