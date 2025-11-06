"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";

export default function PitakaPage() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-header shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="w-10 h-10 grad-brand rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a2 2 0 012-2h9a2 2 0 012 2v14l-4-2-4 2V5H6a2 2 0 00-2 2v12" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-foreground">Tripitaka Library</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => window.open("https://tipitaka.lk/", "_blank")}>Open in New Tab</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowHelp((v) => !v)}>Help</Button>
              </div>
            </div>
          </div>
        </header>

        {/* Note about embedding */}
        {showHelp && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
              If the Tripitaka site does not appear below, the source server may disallow embedding via X-Frame-Options. Use “Open in New Tab”.
            </div>
          </div>
        )}

        {/* Iframe */}
        <main className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0 py-0">
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

