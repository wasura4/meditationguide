'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DhammaArticleList } from '@/components/dhamma/DhammaArticleList';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookOpen, ArrowLeft, Sparkles } from 'lucide-react';

export default function DhammaPage() {
  const { t } = useLanguage();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Modern Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-11 h-11 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{t('dhamma.title')}</h1>
                  <p className="text-xs text-muted-foreground">Path to enlightenment</p>
                </div>
              </div>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 p-8 mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary">Wisdom Library</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Explore Dhamma Teachings
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                Discover profound teachings on meditation, mindfulness, and the path to liberation.
                Let wisdom guide your journey.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="min-h-[600px]">
            <DhammaArticleList />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
