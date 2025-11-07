'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { AudioLibrary } from '@/components/audio/AudioLibrary';
import { PlaylistManager } from '@/components/audio/PlaylistManager';

export default function KamatahanPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'library' | 'playlists'>('playlists');
  const { showToast } = useToast();

  const handleTabChange = (tab: 'library' | 'playlists') => {
    setActiveTab(tab);
    showToast({
      type: 'info',
      title: 'View Changed',
      message: `Switched to ${tab === 'library' ? 'audio library' : 'meditation guides'} view.`,
      duration: 1500
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-28">
        {/* Hero Header */}
        <div className="bg-gradient-to-b from-muted/50 to-background shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-center justify-between mb-6">
              <Button
                onClick={() => window.history.back()}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </Button>
            </div>

            <div className="text-center">
              {/* Icon */}
              <div className="inline-flex w-16 h-16 sm:w-20 sm:h-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                Kamatahan
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
                Guided meditations and dharma teachings to support your practice
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="mt-8 flex justify-center">
              <div className="inline-flex bg-muted/50 rounded-lg p-1 gap-1">
                <button
                  onClick={() => handleTabChange('playlists')}
                  className={`px-4 sm:px-6 py-2.5 rounded-md font-medium text-sm transition-all ${
                    activeTab === 'playlists'
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span className="hidden sm:inline">Meditation Guides</span>
                    <span className="sm:hidden">Guides</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('library')}
                  className={`px-4 sm:px-6 py-2.5 rounded-md font-medium text-sm transition-all ${
                    activeTab === 'library'
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <span className="hidden sm:inline">{t('dashboard.actions.audio_library')}</span>
                    <span className="sm:hidden">Library</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeTab === 'library' ? (
            <AudioLibrary />
          ) : (
            <PlaylistManager />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
