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
    <div className="fixed bottom-16 lg:bottom-0 inset-x-0 z-50 bg-gradient-to-t from-background via-background/98 to-background/95 backdrop-blur-xl border-t shadow-[0_-8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4)] pb-[max(0px,env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {/* Enhanced Progress Bar with Hover Preview - Layout A */}
        <div
          ref={progressBarRef}
          className="relative h-2 bg-muted/50 rounded-full overflow-hidden mb-3 sm:mb-4 group cursor-pointer"
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
        >
          <div
            className="absolute h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 transition-all duration-300 ease-out rounded-full shadow-sm"
            style={{ width: `${progress}%` }}
          />
          {/* Hover indicator */}
          {hoverTime !== null && (
            <div
              className="absolute top-0 w-0.5 h-full bg-foreground/30"
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
              className="absolute -top-9 bg-popover border px-2 py-1 rounded text-xs font-mono shadow-lg pointer-events-none z-20"
              style={{ left: `${(hoverTime / (p.duration || 1)) * 100}%`, transform: 'translateX(-50%)' }}
            >
              {format(hoverTime)}
            </div>
          )}
          {/* Hover effect */}
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Album Art with progress ring */}
            <div className="relative flex-shrink-0 group">
              <div className="rounded-2xl p-[2px]" style={ringStyle}>
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-[14px] overflow-hidden shadow-lg bg-gradient-to-br from-primary via-purple-500 to-indigo-600">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xl sm:text-2xl drop-shadow-md">
                      {(track?.title || 'M').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Track Details */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold truncate text-foreground mb-0.5">
                {track?.title || 'Untitled'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                <span className="truncate">{p.guide.name}</span>
                <span>•</span>
                <span>{p.index + 1}/{p.guide.audioFiles.length}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline font-mono">{format(p.currentTime)} / {format(p.duration)}</span>
              </div>
            </div>
          </div>

          {/* Enhanced Controls - Layout A */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Skip -30s Button - Hidden on mobile */}
            <button
              onClick={() => p.skip(-30)}
              className="hidden lg:flex w-9 h-9 rounded-full hover:bg-muted/80 active:bg-muted transition-all duration-200 items-center justify-center group"
              title="Skip backward 30 seconds"
              aria-label="Skip backward 30 seconds"
            >
              <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            {/* Skip -10s Button */}
            <button
              onClick={() => p.skip(-10)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-muted/80 active:bg-muted transition-all duration-200 flex items-center justify-center group"
              title="Skip backward 10 seconds"
              aria-label="Skip backward 10 seconds"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4z" />
              </svg>
            </button>

            {/* Previous Button */}
            <button
              onClick={p.prev}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-muted/80 active:bg-muted transition-all duration-200 flex items-center justify-center group"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={p.toggle}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group relative overflow-hidden"
              aria-label={p.isPlaying ? 'Pause' : 'Play'}
            >
              {/* Ripple effect */}
              <div className="absolute inset-0 bg-white/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
              {p.isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Next Button */}
            <button
              onClick={p.next}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-muted/80 active:bg-muted transition-all duration-200 flex items-center justify-center group"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            {/* Skip +10s Button */}
            <button
              onClick={() => p.skip(10)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-muted/80 active:bg-muted transition-all duration-200 flex items-center justify-center group"
              title="Skip forward 10 seconds"
              aria-label="Skip forward 10 seconds"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            {/* Skip +30s Button - Hidden on mobile */}
            <button
              onClick={() => p.skip(30)}
              className="hidden lg:flex w-9 h-9 rounded-full hover:bg-muted/80 active:bg-muted transition-all duration-200 items-center justify-center group"
              title="Skip forward 30 seconds"
              aria-label="Skip forward 30 seconds"
            >
              <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            {/* Playback Speed - Desktop */}
            <div className="hidden md:block relative ml-1">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="w-12 h-9 rounded-full hover:bg-muted/80 transition-all duration-200 flex items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground"
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
                  <div className="absolute bottom-full right-0 mb-2 bg-popover/95 backdrop-blur-xl border rounded-lg shadow-2xl py-1 min-w-[80px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {PLAYBACK_SPEEDS.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          p.setSpeed(speed);
                          setShowSpeedMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-sm hover:bg-accent/50 text-left transition-colors ${
                          speed === p.playbackSpeed ? 'bg-accent font-semibold text-primary' : 'text-foreground'
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
            <div className="hidden lg:flex items-center gap-2 relative ml-1">
              <button
                onClick={() => p.setVol(p.volume === 0 ? 1 : 0)}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="w-9 h-9 rounded-full hover:bg-muted/80 transition-all duration-200 flex items-center justify-center group"
                aria-label={p.volume === 0 ? 'Unmute' : 'Mute'}
              >
                {p.volume === 0 || p.isMuted ? (
                  <VolumeX className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <Volume2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </button>

              {/* Volume Slider */}
              {showVolumeSlider && (
                <div
                  className="absolute bottom-full right-0 mb-3 bg-card/95 backdrop-blur-xl border rounded-xl shadow-2xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {Math.round(p.volume * 100)}%
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={p.volume}
                      onChange={(e) => p.setVol(parseFloat(e.target.value))}
                      className="h-24 w-2 accent-primary cursor-pointer"
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
              className="w-9 h-9 rounded-full hover:bg-red-500/10 active:bg-red-500/20 transition-all duration-200 flex items-center justify-center group ml-1"
              aria-label="Close player"
            >
              <X className="w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
