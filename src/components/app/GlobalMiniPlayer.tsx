'use client';

import React, { useState, useEffect } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, X, ChevronDown
} from 'lucide-react';

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function GlobalMiniPlayer() {
  const p = usePlayer();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Close player when track ends or stopped
  useEffect(() => {
    if (!p.guide) setIsExpanded(false);
  }, [p.guide]);

  if (!p.guide) return null;

  const track = p.guide.audioFiles[p.index];
  const progress = (p.currentTime / (p.duration || 1)) * 100;

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { y: number }; velocity: { y: number } }) => {
    // Lower threshold for easier dismissal (was 100)
    // Also check velocity to allow "flick" to dismiss
    if (info.offset.y > 50 || info.velocity.y > 200) {
      setIsExpanded(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isExpanded ? (
        // FULL SCREEN PLAYER
        <motion.div
          key="fullscreen"
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.1 }}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-3xl flex flex-col safe-area-inset-bottom"
        >
          {/* Drag Handle */}
          <div className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing" onClick={() => setIsExpanded(false)}>
            <div className="w-16 h-1.5 bg-muted/50 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-6 pt-12">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-8 h-8 text-foreground" />
            </button>
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
              Now Playing
            </span>
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-3 py-1 rounded-full border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors"
            >
              {p.playbackSpeed}x
            </button>
          </div>

          {/* Speed Menu Overlay */}
          {showSpeedMenu && (
            <div className="absolute top-20 right-6 z-50 bg-popover/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 w-24">
              {PLAYBACK_SPEEDS.map(speed => (
                <button
                  key={speed}
                  onClick={() => { p.setSpeed(speed); setShowSpeedMenu(false); }}
                  className={`px-3 py-2 rounded-xl text-sm transition-colors ${p.playbackSpeed === speed ? 'bg-primary text-primary-foreground' : 'hover:bg-white/10'
                    }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-12">
            {/* Album Art Placeholder */}
            <motion.div
              className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] mb-12 flex items-center justify-center relative overflow-hidden"
              animate={{ scale: p.isPlaying ? 1 : 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
              <div className="w-32 h-32 rounded-full bg-primary/10 animate-pulse" />
            </motion.div>

            {/* Track Info */}
            <div className="text-center mb-8 w-full">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 truncate">
                {track?.title || 'Untitled'}
              </h2>
              <p className="text-lg text-muted-foreground">
                {p.guide.name}
              </p>
            </div>


            {/* Progress Bar */}
            <div className="w-full mb-12">
              <div className="relative py-2">
                {/* Background Track */}
                <div
                  className="relative h-1 bg-white/10 rounded-full"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    p.seek(percent * (p.duration || 1));
                  }}
                >
                  {/* Progress Fill */}
                  <motion.div
                    className="absolute h-full bg-primary rounded-full"
                    style={{ width: `${progress}%` }}
                    layoutId="progressBar"
                  />
                </div>

                {/* Draggable Thumb */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg cursor-grab active:cursor-grabbing"
                  style={{ left: `calc(${progress}% - 10px)` }}
                  drag="x"
                  dragConstraints={{ left: -10, right: window.innerWidth - 10 }}
                  dragElastic={0}
                  dragMomentum={false}
                  onDrag={(event, info) => {
                    const parent = (event.target as HTMLElement).parentElement;
                    if (parent) {
                      const rect = parent.getBoundingClientRect();
                      const newProgress = Math.min(Math.max((info.point.x - rect.left) / rect.width, 0), 1);
                      p.seek(newProgress * (p.duration || 1));
                    }
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-2 h-2 bg-primary rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </motion.div>
              </div>

              {/* Time Labels */}
              <div className="flex justify-between mt-2 text-xs font-medium text-muted-foreground">
                <span>{formatTime(p.currentTime)}</span>
                <span>{formatTime(p.duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between w-full max-w-xs">
              <button onClick={() => p.skip(-10)} className="p-3 rounded-full hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
                <SkipBack className="w-8 h-8" />
              </button>

              <button
                onClick={p.toggle}
                className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                {p.isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-1" />
                )}
              </button>

              <button onClick={() => p.skip(10)} className="p-3 rounded-full hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
                <SkipForward className="w-8 h-8" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        // MINI PLAYER
        <motion.div
          key="mini"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-[90px] inset-x-4 z-40 lg:bottom-4 lg:right-4 lg:left-auto lg:w-96"
        >
          <div
            onClick={() => setIsExpanded(true)}
            className="bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl flex items-center gap-4 cursor-pointer hover:bg-background/90 transition-colors"
          >
            {/* Mini Art */}
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <div className={`w-2 h-2 rounded-full bg-primary ${p.isPlaying ? 'animate-ping' : ''}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{track?.title || 'Untitled'}</h4>
              <p className="text-xs text-muted-foreground truncate">{p.guide.name}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <button
                onClick={p.toggle}
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
              >
                {p.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>
              <button
                onClick={p.stop}
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress Bar Background */}
            <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                style={{ width: `${progress}%` }}
                layoutId="progressBar"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
