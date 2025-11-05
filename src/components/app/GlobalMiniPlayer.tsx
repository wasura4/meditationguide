'use client';

import React from 'react';
import { usePlayer } from '@/contexts/PlayerContext';

export function GlobalMiniPlayer() {
  const p = usePlayer();
  if (!p.guide) return null;
  const track = p.guide.audioFiles[p.index];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md px-3 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.15)]">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-semibold">
              {(track?.title || '•').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{track?.title || 'Untitled'}</div>
              <div className="text-xs text-muted-foreground truncate">{p.guide.name} • Track {p.index + 1} of {p.guide.audioFiles.length}</div>
            </div>
          </div>
          <button className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground" onClick={p.stop}>✕</button>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button className="w-9 h-9 rounded border border-border" onClick={p.prev} aria-label="Previous">
            <svg className="w-4 h-4 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button className="w-10 h-10 rounded-full bg-primary text-primary-foreground" onClick={p.toggle} aria-label="Toggle">
            {p.isPlaying ? (
              <svg className="w-5 h-5 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" /></svg>
            ) : (
              <svg className="w-5 h-5 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" /></svg>
            )}
          </button>
          <button className="w-9 h-9 rounded border border-border" onClick={p.next} aria-label="Next">
            <svg className="w-4 h-4 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] text-muted-foreground w-8 text-right font-mono">{format(p.currentTime)}</span>
          <input type="range" min={0} max={p.duration || 0} value={p.currentTime} onChange={(e) => p.seek(parseFloat(e.target.value))} className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer" />
          <span className="text-[10px] text-muted-foreground w-8 font-mono">{format(p.duration)}</span>
        </div>
      </div>
    </div>
  );
}

function format(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

