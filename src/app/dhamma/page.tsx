'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { DhammaContentLibrary } from '@/components/dhamma/DhammaContentLibrary';
import { DhammaArticleList } from '@/components/dhamma/DhammaArticleList';
import { useLanguage } from '@/contexts/LanguageContext';
import { FavoritesLibrary } from '@/components/dhamma/FavoritesLibrary';

export default function DhammaPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'favorites'>('library');
  const { showToast } = useToast();
  const { t } = useLanguage();

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
      <div className="min-h-screen bg-background">
        <header className="bg-header shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="w-10 h-10 grad-brand rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 5.754 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.523 18.246 19 16.5 19c-1.746 0-3.332-.477-4.5-1.253" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-foreground">{t('dhamma.title')}</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={() => window.history.back()} className="px-3 py-2 text-sm rounded-md hover:bg-white/10 text-foreground">
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-background rounded-lg p-1 shadow-sm border border-border">
              <div className="flex space-x-1">
                <Button
                  variant={activeTab === 'library' ? 'default' : 'ghost'}
                  onClick={() => handleTabChange('library')}
                  className="px-6 py-2"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6c-1-.667-2-1-4-1S5 5.333 4 6v12c1-.667 2-1 4-1s3 .333 4 1m0-12c1-.667 2-1 4-1s3 .333 4 1v12c-1-.667-2-1-4-1s-3 .333-4 1m0-12v12" />
                  </svg>
                  {t('dhamma.posts')}
                </Button>
                <Button
                  variant={activeTab === 'favorites' ? 'default' : 'ghost'}
                  onClick={() => handleTabChange('favorites')}
                  className="px-6 py-2"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Favorites
                </Button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {activeTab === 'library' ? (
              <DhammaArticleList />
            ) : (
              <FavoritesLibrary />
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-12 text-center">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📖 Start Your Dhamma Journey
              </h3>
              <p className="text-gray-600 mb-6">
                Explore teachings on meditation, mindfulness, wisdom, and the path to enlightenment
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="outline" className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Browse All Posts</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>Popular Topics</span>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}






