'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { DhammaContentLibrary } from '@/components/dhamma/DhammaContentLibrary';

export default function DhammaPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'favorites'>('library');
  const { showToast } = useToast();

  const handleTabChange = (tab: 'library' | 'favorites') => {
    setActiveTab(tab);
    showToast({
      type: 'info',
      title: 'View Changed',
      message: `Switched to ${tab === 'library' ? 'Dhamma library' : 'favorites'} view.`,
      duration: 1500
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        {/* Header */}
        <header className="glass sticky top-0 z-50 border-b border-[var(--border)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center h-14">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.history.back()}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors"
                >
                  <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 199, 190, 0.1)' }}>
                    <svg className="w-5 h-5" style={{ color: 'var(--ring-stand)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h1 className="text-lg font-semibold text-[var(--foreground)]">
                    Dhamma Library
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

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="health-card text-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(0, 199, 190, 0.1)' }}>
              <svg className="w-8 h-8" style={{ color: 'var(--ring-stand)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Dhamma Library
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Discover the wisdom of the Buddha through teachings, meditation guides, and philosophical insights
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
          <div className="flex space-x-2 p-1 bg-[var(--muted)] rounded-lg w-fit mx-auto">
            <Button
              variant={activeTab === 'library' ? 'default' : 'ghost'}
              onClick={() => handleTabChange('library')}
              className="px-4 py-2"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Library
            </Button>
            <Button
              variant={activeTab === 'favorites' ? 'default' : 'ghost'}
              onClick={() => handleTabChange('favorites')}
              className="px-4 py-2"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favorites
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
          <div className="min-h-[600px]">
            {activeTab === 'library' ? (
              <DhammaContentLibrary />
            ) : (
              <div className="health-card text-center py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(88, 86, 214, 0.1)' }}>
                  <svg className="w-8 h-8 text-[var(--secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">No favorites yet</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Start reading Dhamma posts and bookmark your favorites for later study
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 health-card">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">
              Start Your Dhamma Journey
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Explore teachings on meditation, mindfulness, wisdom, and the path to enlightenment
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Browse All Posts</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Popular Topics</span>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
