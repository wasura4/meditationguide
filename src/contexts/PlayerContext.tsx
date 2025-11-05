'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { KamatahanAudio } from '@/types/admin';
import { recordAudioListen } from '@/lib/metricsService';

export interface PlayableGuide {
  id: string;
  name: string;
  audioFiles: KamatahanAudio[];
}

interface PlayerState {
  guide: PlayableGuide | null;
  index: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  start: (guide: PlayableGuide, startIndex?: number) => void;
  stop: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVol: (v: number) => void;
}

const Ctx = createContext<PlayerState | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guide, setGuide] = useState<PlayableGuide | null>(null);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listened = useRef<Set<string>>(new Set());

  // Lazy create audio element once
  useEffect(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = 'metadata';
      audioRef.current = a;
    }
  }, []);

  // Wire events
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onEnded = () => {
      if (!guide) return;
      const next = (index + 1) % guide.audioFiles.length;
      setIndex(next);
      if (isPlaying) setTimeout(() => a.play().catch(() => setIsPlaying(false)), 50);
    };
    const onPlay = () => {
      const tr = guide?.audioFiles[index];
      if (tr?.id && !listened.current.has(tr.id)) {
        listened.current.add(tr.id);
        recordAudioListen(tr.id, undefined);
      }
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnded);
    a.addEventListener('play', onPlay);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('play', onPlay);
    };
  }, [guide, index, isPlaying]);

  // Update source when guide/index changes
  useEffect(() => {
    if (!guide || !audioRef.current) return;
    const tr = guide.audioFiles[index];
    if (!tr) return;
    audioRef.current.src = tr.fileUrl;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
  }, [guide, index, isPlaying]);

  const start = useCallback((g: PlayableGuide, startIndex = 0) => {
    setGuide(g);
    setIndex(Math.max(0, Math.min(startIndex, g.audioFiles.length - 1)));
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setGuide(null);
    setIndex(0);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const toggle = useCallback(() => {
    if (!audioRef.current || !guide) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [guide, isPlaying]);

  const next = useCallback(() => {
    if (!guide) return;
    setIndex((i) => (i + 1) % guide.audioFiles.length);
    setCurrentTime(0);
  }, [guide]);

  const prev = useCallback(() => {
    if (!guide) return;
    setIndex((i) => (i === 0 ? guide.audioFiles.length - 1 : i - 1));
    setCurrentTime(0);
  }, [guide]);

  const seek = useCallback((t: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  }, []);

  const setVol = useCallback((v: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = v;
    setVolume(v);
    setIsMuted(v === 0);
  }, []);

  const value = useMemo<PlayerState>(() => ({
    guide,
    index,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    start,
    stop,
    toggle,
    next,
    prev,
    seek,
    setVol,
  }), [guide, index, isPlaying, currentTime, duration, volume, isMuted, start, stop, toggle, next, prev, seek, setVol]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function usePlayer(): PlayerState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

