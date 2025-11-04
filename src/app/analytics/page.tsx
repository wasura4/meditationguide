'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';

export default function AnalyticsPage() {
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
                  <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h1 className="text-lg font-semibold text-[var(--foreground)]">
                    Analytics
                  </h1>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted-foreground)]">
                  Track your progress
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <AnalyticsDashboard />
        </main>
      </div>
    </ProtectedRoute>
  );
}
