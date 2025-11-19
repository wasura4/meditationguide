'use client';

import React, { useState, useRef, useCallback } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function GlobalMiniPlayer() {
  const p = usePlayer();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Handle progress bar hover for preview - MUST be before early return
  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * p.duration;
    setHoverTime(time);
  }, [p.duration]);

  const handleProgressLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  if (!p.guide) return null;

  const track = p.guide.audioFiles[p.index];
  const progress = (p.currentTime / (p.duration || 1)) * 100;

  const verticalSliderStyle = {
    writingMode: 'bt-lr',
    WebkitAppearance: 'slider-vertical',
    appearance: 'slider-vertical',
  } as unknown as React.CSSProperties;

  const format = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed bottom-16 lg:bottom-0 inset-x-0 z-50 bg-gradient-to-t from-background via-background/98 to-background/95 backdrop-blur-xl border-t border-border/40 shadow-[0_-2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_24px_rgba(0,0,0,0.25)] pb-[max(0px,env(safe-area-inset-bottom))]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        {/* Track Title & Guide Name */}
        <div className="text-center mb-3">
          <h3 className="text-base sm:text-lg font-bold text-foreground mb-0.5 truncate px-4">
            {track?.title || 'Untitled'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground/80">
            {p.guide.name} • Track {p.index + 1}/{p.guide.audioFiles.length}
          </p>
        </div>

        {/* Progress Bar with Time & Speed */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-xs font-mono text-muted-foreground">{format(p.currentTime)}</span>

            {/* Playback Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-0.5 rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                aria-label="Playback speed"
              >
                {p.playbackSpeed}x
              </button>
              {showSpeedMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSpeedMenu(false)}
                  />
                  <div className="absolute bottom-full right-0 mb-1 bg-popover backdrop-blur-xl border border-border rounded-lg shadow-xl py-1 min-w-[72px] z-50 animate-in fade-in duration-100">
                    {PLAYBACK_SPEEDS.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          p.setSpeed(speed);
                          setShowSpeedMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-xs hover:bg-accent/60 text-left transition-colors ${
                          speed === p.playbackSpeed ? 'bg-accent/80 font-semibold text-primary' : 'text-foreground'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span className="text-xs font-mono text-muted-foreground">{format(p.duration)}</span>
          </div>

          {/* Progress Bar */}
          <div
            ref={progressBarRef}
            className="relative h-2 bg-muted/50 rounded-full overflow-hidden group cursor-pointer"
            onMouseMove={handleProgressHover}
            onMouseLeave={handleProgressLeave}
          >
            <div
              className="absolute h-full bg-primary transition-all duration-150 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
            {hoverTime !== null && (
              <div
                className="absolute top-0 w-0.5 h-full bg-foreground/50"
                style={{ left: `${(hoverTime / (p.duration || 1)) * 100}%` }}
              />
            )}
            <input
              type="range"
              min={0}
              max={p.duration || 0}
              value={p.currentTime}
              onChange={(e) => p.seek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              aria-label="Seek"
            />
            {hoverTime !== null && (
              <div
                className="absolute -top-7 bg-popover/95 backdrop-blur-sm border border-border px-2 py-0.5 rounded text-xs font-mono shadow-lg pointer-events-none z-20"
                style={{ left: `${(hoverTime / (p.duration || 1)) * 100}%`, transform: 'translateX(-50%)' }}
              >
                {format(hoverTime)}
              </div>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {/* Skip -30s - Desktop only */}
          <button
            onClick={() => p.skip(-30)}
            className="hidden sm:flex w-9 h-9 rounded-lg hover:bg-accent/50 active:bg-accent transition-all items-center justify-center group"
            title="Skip backward 30 seconds"
            aria-label="Skip backward 30 seconds"
          >
            <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>

          {/* Skip -10s */}
          <button
            onClick={() => p.skip(-10)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg hover:bg-accent/50 active:bg-accent transition-all flex items-center justify-center group"
            title="Skip backward 10 seconds"
            aria-label="Skip backward 10 seconds"
          >
            <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>

          {/* Previous */}
          <button
            onClick={p.prev}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg hover:bg-accent/50 active:bg-accent transition-all flex items-center justify-center group"
            aria-label="Previous track"
          >
            <SkipBack className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={p.toggle}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
            aria-label={p.isPlaying ? 'Pause' : 'Play'}
          >
            {p.isPlaying ? (
              <Pause className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5" fill="currentColor" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={p.next}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg hover:bg-accent/50 active:bg-accent transition-all flex items-center justify-center group"
            aria-label="Next track"
          >
            <SkipForward className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          {/* Skip +10s */}
          <button
            onClick={() => p.skip(10)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg hover:bg-accent/50 active:bg-accent transition-all flex items-center justify-center group"
            title="Skip forward 10 seconds"
            aria-label="Skip forward 10 seconds"
          >
            <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </button>

          {/* Skip +30s - Desktop only */}
          <button
            onClick={() => p.skip(30)}
            className="hidden sm:flex w-9 h-9 rounded-lg hover:bg-accent/50 active:bg-accent transition-all items-center justify-center group"
            title="Skip forward 30 seconds"
            aria-label="Skip forward 30 seconds"
          >
            <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </button>

          {/* Volume - Desktop only */}
          <div className="hidden lg:flex items-center relative">
            <button
              onClick={() => p.setVol(p.volume === 0 ? 1 : 0)}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="w-9 h-9 rounded-lg hover:bg-accent/50 transition-all flex items-center justify-center group"
              aria-label={p.volume === 0 ? 'Unmute' : 'Mute'}
            >
              {p.volume === 0 || p.isMuted ? (
                <VolumeX className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <Volume2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </button>
            {showVolumeSlider && (
              <div
                className="absolute bottom-full right-0 mb-2 bg-popover/98 backdrop-blur-xl border border-border/60 rounded-lg shadow-xl p-2.5 animate-in fade-in duration-100"
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="text-[10px] font-medium text-muted-foreground">
                    {Math.round(p.volume * 100)}%
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={p.volume}
                    onChange={(e) => p.setVol(parseFloat(e.target.value))}
                    className="h-20 w-1.5 accent-primary cursor-pointer"
                    style={verticalSliderStyle}
                    aria-label="Volume"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Close */}
          <button
            onClick={p.stop}
            className="w-9 h-9 rounded-lg hover:bg-red-500/10 active:bg-red-500/15 transition-all flex items-center justify-center group"
            aria-label="Close player"
          >
            <X className="w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
