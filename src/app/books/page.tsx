'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BooksLibraryPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Books Library</h1>
              <p className="text-sm text-muted-foreground">පිටක පොත් පුස්තකාලය</p>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Content */}
      <div className="flex-1 relative">
        <iframe
          src="https://pitaka.lk/books/"
          className="absolute inset-0 w-full h-full border-0"
          title="Books Library"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
