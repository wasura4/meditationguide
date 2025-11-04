'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { AudioLibrary } from '@/components/audio/AudioLibrary';
import { PlaylistManager } from '@/components/audio/PlaylistManager';

export default function KamatahanPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'playlists'>('library');
  const { showToast } = useToast();

  const handleTabChange = (tab: 'library' | 'playlists') => {
    setActiveTab(tab);
    showToast({
      type: 'info',
      title: 'View Changed',
      message: `Switched to ${tab === 'library' ? 'audio library' : 'playlists'} view.`,
      duration: 1500
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        {/* Header */}
        <header className="glass sticky top-0 z-50 border-b border-[var(--border)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors"
                >
                  <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(250, 17, 79, 0.1)' }}>
                    <svg className="w-5 h-5" style={{ color: 'var(--ring-move)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h1 className="text-lg font-semibold text-[var(--foreground)]">
                    Audio Library
                  </h1>
                </div>
              </div>
              <div className="flex items-center">
                <Button
                  onClick={() => window.history.back()}
                  variant="ghost"
                  size="sm"
                  className="text-sm text-[var(--primary)]"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex space-x-2 p-1 bg-[var(--muted)] rounded-lg w-fit">
            <button
              onClick={() => handleTabChange('library')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'library'
                  ? 'bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span>Library</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('playlists')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'playlists'
                  ? 'bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>Playlists</span>
              </div>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="min-h-[600px]">
            {activeTab === 'library' ? (
              <AudioLibrary />
            ) : (
              <PlaylistManager />
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-10 health-card">
            <h3 className="text-xl lg:text-2xl font-bold text-[var(--foreground)] mb-6">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              <button
                onClick={() => handleTabChange('library')}
                className="health-card-compact flex flex-col items-center justify-center py-6 px-5 hover:scale-[1.02]"
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(146, 232, 42, 0.1)' }}>
                  <svg className="w-7 h-7" style={{ color: 'var(--ring-exercise)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="text-base font-semibold text-[var(--foreground)]">Browse Audio</span>
              </button>

              <button
                onClick={() => handleTabChange('playlists')}
                className="health-card-compact flex flex-col items-center justify-center py-6 px-5 hover:scale-[1.02]"
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(88, 86, 214, 0.1)' }}>
                  <svg className="w-7 h-7 text-[var(--secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-base font-semibold text-[var(--foreground)]">Create Playlist</span>
              </button>

              <button
                onClick={() => window.location.href = '/meditate'}
                className="health-card-compact flex flex-col items-center justify-center py-6 px-5 hover:scale-[1.02]"
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(0, 199, 190, 0.1)' }}>
                  <svg className="w-7 h-7" style={{ color: 'var(--ring-stand)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-base font-semibold text-[var(--foreground)]">Start Meditating</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
