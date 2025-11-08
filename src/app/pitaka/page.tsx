"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BookMarked, ExternalLink, HelpCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PitakaPage() {
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Modern Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all lg:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <div className="w-11 h-11 bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BookMarked className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Tripitaka Library</h1>
                  <p className="text-xs text-muted-foreground">Buddhist Canon Collection</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHelp((v) => !v)}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Help</span>
                </button>
                <button
                  onClick={() => window.open("https://tipitaka.lk/", "_blank")}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Help Banner */}
        {showHelp && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 p-5 shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-1">About This Page</h3>
                  <p className="text-sm text-muted-foreground">
                    If the Tripitaka site does not appear below, the source server may disallow embedding via X-Frame-Options.
                    Please use the &ldquo;Open in New Tab&rdquo; button above to access the full library.
                  </p>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Iframe Content */}
        <main className="max-w-7xl mx-auto px-0">
          <div className="h-[calc(100vh-4rem)]">
            <iframe
              src="https://tipitaka.lk/"
              title="Tripitaka Library"
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
