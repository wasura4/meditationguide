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

  const ringStyle = {
    background: `conic-gradient(var(--primary) ${Math.max(0, Math.min(100, progress))}%, transparent 0)`,
  } as React.CSSProperties;

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
    <div className="fixed bottom-16 lg:bottom-0 inset-x-0 z-50 bg-gradient-to-t from-background via-background/98 to-background/95 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_32px_rgba(0,0,0,0.3)] pb-[max(0px,env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5">
        {/* Enhanced Progress Bar with Hover Preview */}
        <div
          ref={progressBarRef}
          className="relative h-1.5 bg-muted/40 rounded-full overflow-hidden mb-3 group cursor-pointer"
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
        >
          <div
            className="absolute h-full bg-gradient-to-r from-primary to-primary/90 transition-all duration-200 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
          {/* Hover indicator */}
          {hoverTime !== null && (
            <div
              className="absolute top-0 w-0.5 h-full bg-foreground/40"
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
          {/* Hover time tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 bg-popover/95 backdrop-blur-sm border border-border px-2 py-1 rounded-md text-xs font-mono shadow-xl pointer-events-none z-20"
              style={{ left: `${(hoverTime / (p.duration || 1)) * 100}%`, transform: 'translateX(-50%)' }}
            >
              {format(hoverTime)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Track Info */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            {/* Album Art with progress ring */}
            <div className="relative flex-shrink-0">
              <div className="rounded-xl p-[2px]" style={ringStyle}>
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-[10px] overflow-hidden shadow-md bg-gradient-to-br from-primary via-purple-500 to-indigo-600">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-lg sm:text-xl drop-shadow-md">
                      {(track?.title || 'M').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Track Details */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold truncate text-foreground leading-tight mb-1">
                {track?.title || 'Untitled'}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/90">
                <span className="truncate max-w-[120px] sm:max-w-none">{p.guide.name}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="font-mono text-[11px]">{format(p.currentTime)}</span>
                <span className="text-muted-foreground/50">/</span>
                <span className="font-mono text-[11px]">{format(p.duration)}</span>
              </div>
            </div>
          </div>

          {/* Enhanced Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Skip -30s Button - Hidden on mobile */}
            <button
              onClick={() => p.skip(-30)}
              className="hidden lg:flex w-8 h-8 rounded-lg hover:bg-accent/50 active:bg-accent transition-all duration-150 items-center justify-center group"
              title="Skip backward 30 seconds"
              aria-label="Skip backward 30 seconds"
            >
              <svg className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            {/* Skip -10s Button */}
            <button
              onClick={() => p.skip(-10)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-accent/50 active:bg-accent transition-all duration-150 flex items-center justify-center group"
              title="Skip backward 10 seconds"
              aria-label="Skip backward 10 seconds"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4z" />
              </svg>
            </button>

            {/* Previous Button */}
            <button
              onClick={p.prev}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-accent/50 active:bg-accent transition-all duration-150 flex items-center justify-center group"
              aria-label="Previous track"
            >
              <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={p.toggle}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center relative"
              aria-label={p.isPlaying ? 'Pause' : 'Play'}
            >
              {p.isPlaying ? (
                <Pause className="w-5 h-5 sm:w-5.5 sm:h-5.5" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5 sm:w-5.5 sm:h-5.5 ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Next Button */}
            <button
              onClick={p.next}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-accent/50 active:bg-accent transition-all duration-150 flex items-center justify-center group"
              aria-label="Next track"
            >
              <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            {/* Skip +10s Button */}
            <button
              onClick={() => p.skip(10)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-accent/50 active:bg-accent transition-all duration-150 flex items-center justify-center group"
              title="Skip forward 10 seconds"
              aria-label="Skip forward 10 seconds"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            {/* Skip +30s Button - Hidden on mobile */}
            <button
              onClick={() => p.skip(30)}
              className="hidden lg:flex w-8 h-8 rounded-lg hover:bg-accent/50 active:bg-accent transition-all duration-150 items-center justify-center group"
              title="Skip forward 30 seconds"
              aria-label="Skip forward 30 seconds"
            >
              <svg className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            {/* Playback Speed - Desktop */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="w-10 h-8 rounded-lg hover:bg-accent/50 transition-all duration-150 flex items-center justify-center text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                aria-label="Playback speed"
              >
                {p.playbackSpeed}x
              </button>
              {showSpeedMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSpeedMenu(false)}
                  />
                  {/* Speed menu - positioned ABOVE the player */}
                  <div className="absolute bottom-full right-0 mb-2 bg-popover/98 backdrop-blur-xl border border-border/60 rounded-lg shadow-xl py-1 min-w-[72px] z-50 animate-in fade-in slide-in-from-bottom-1 duration-150">
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

            {/* Volume Control - Desktop */}
            <div className="hidden lg:flex items-center relative">
              <button
                onClick={() => p.setVol(p.volume === 0 ? 1 : 0)}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="w-8 h-8 rounded-lg hover:bg-accent/50 transition-all duration-150 flex items-center justify-center group"
                aria-label={p.volume === 0 ? 'Unmute' : 'Mute'}
              >
                {p.volume === 0 || p.isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </button>

              {/* Volume Slider */}
              {showVolumeSlider && (
                <div
                  className="absolute bottom-full right-0 mb-2 bg-popover/98 backdrop-blur-xl border border-border/60 rounded-lg shadow-xl p-2.5 animate-in fade-in slide-in-from-bottom-1 duration-150"
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

            {/* Close Button */}
            <button
              onClick={p.stop}
              className="w-8 h-8 rounded-lg hover:bg-red-500/10 active:bg-red-500/15 transition-all duration-150 flex items-center justify-center group"
              aria-label="Close player"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
