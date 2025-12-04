'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-32">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              My Analytics
            </h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <AnalyticsDashboard />
        </main>
      </div>
    </ProtectedRoute>
  );
}
