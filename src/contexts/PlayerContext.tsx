"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KamatahanAudio } from "@/types/admin";
import { recordAudioListen } from "@/lib/metricsService";
import { useAuth } from "@/contexts/AuthContext";

export interface PlayableGuide {
  id: string;
  name: string;
  audioFiles: KamatahanAudio[];
  thumbnailUrl?: string;
  authorName?: string;
}

interface PlayerState {
  guide: PlayableGuide | null;
  index: number;
  isPlaying: boolean;
  isLoading: boolean;
  error: boolean;
  expanded: boolean;
  repeat: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  start: (guide: PlayableGuide, startIndex?: number) => void;
  playAt: (index: number) => void;
  stop: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  setVol: (volume: number) => void;
  setSpeed: (speed: number) => void;
  setExpanded: (expanded: boolean) => void;
  setRepeat: (repeat: boolean) => void;
}

const Ctx = createContext<PlayerState | undefined>(undefined);
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [guide, setGuide] = useState<PlayableGuide | null>(null);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [repeat, setRepeatState] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const session = useRef<{ guide: PlayableGuide | null; index: number }>({
    guide: null,
    index: 0,
  });
  const wantsPlayback = useRef(false);
  const generation = useRef(0);
  const speedRef = useRef(1);
  const repeatRef = useRef(false);
  const userRef = useRef(user?.id);
  const listened = useRef(new Set<string>());

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !session.current.guide) return;
    const request = ++generation.current;
    wantsPlayback.current = true;
    setError(false);
    setIsPlaying(true);
    setIsLoading(audio.readyState < 3);
    // Keep the existing HTMLAudioElement/WebView playback path. Invoke play
    // directly from the user's gesture; never pause on visibility changes.
    audio.play().catch((reason: { name?: string }) => {
      if (request !== generation.current || !wantsPlayback.current) return;
      wantsPlayback.current = false;
      setIsPlaying(false);
      setIsLoading(false);
      setError(reason?.name !== "AbortError");
    });
  }, []);

  const loadTrack = useCallback(
    (nextGuide: PlayableGuide, nextIndex: number) => {
      const audio = audioRef.current;
      if (!audio || !nextGuide.audioFiles.length) return;
      const safeIndex = Number.isFinite(nextIndex)
        ? Math.max(
            0,
            Math.min(Math.trunc(nextIndex), nextGuide.audioFiles.length - 1),
          )
        : 0;
      const track = nextGuide.audioFiles[safeIndex];
      generation.current++;
      wantsPlayback.current = false;
      audio.pause();
      session.current = { guide: nextGuide, index: safeIndex };
      setGuide(nextGuide);
      setIndex(safeIndex);
      setCurrentTime(0);
      setDuration(0);
      setError(false);
      audio.removeAttribute("src");
      if (!track.fileUrl?.trim()) {
        audio.load();
        setError(true);
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }
      audio.src = track.fileUrl;
      audio.load();
      audio.playbackRate = speedRef.current;
      play();
    },
    [play],
  );

  const stop = useCallback(() => {
    generation.current++;
    wantsPlayback.current = false;
    session.current = { guide: null, index: 0 };
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setGuide(null);
    setIndex(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsLoading(false);
    setError(false);
    setExpanded(false);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    try {
      const saved = Number(localStorage.getItem("audio_playback_speed"));
      if (PLAYBACK_SPEEDS.includes(saved)) speedRef.current = saved;
    } catch {
      /* Playback remains available when storage is restricted. */
    }
    audio.playbackRate = speedRef.current;
    setPlaybackSpeed(speedRef.current);
    const onTime = () =>
      setCurrentTime(
        Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
      );
    const onMeta = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      audio.playbackRate = speedRef.current;
    };
    const onPlaying = () => {
      if (!session.current.guide || audio.paused) return;
      wantsPlayback.current = true;
      setIsPlaying(true);
      setIsLoading(false);
      setError(false);
      const track = session.current.guide.audioFiles[session.current.index];
      if (userRef.current && track && !listened.current.has(track.id)) {
        listened.current.add(track.id);
        void recordAudioListen(track.id, userRef.current);
      }
    };
    const onPause = () => {
      // A source change can queue a pause event after the next play request.
      if (!audio.paused || audio.ended) return;
      wantsPlayback.current = false;
      setIsPlaying(false);
      setIsLoading(false);
    };
    const onWaiting = () => {
      if (wantsPlayback.current) setIsLoading(true);
    };
    const onError = () => {
      if (!session.current.guide || !audio.error) return;
      wantsPlayback.current = false;
      setIsPlaying(false);
      setIsLoading(false);
      setError(true);
    };
    const onEnded = () => {
      const active = session.current;
      if (!active.guide || !audio.ended) return;
      if (active.index + 1 < active.guide.audioFiles.length) {
        loadTrack(active.guide, active.index + 1);
      } else if (repeatRef.current) {
        loadTrack(active.guide, 0);
      } else {
        wantsPlayback.current = false;
        setIsPlaying(false);
        setIsLoading(false);
        onTime();
      }
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);
    return () => {
      // Invalidate the latest pending play request, not the value at mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      wantsPlayback.current = false;
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [loadTrack]);

  useEffect(() => {
    if (userRef.current !== user?.id) {
      stop();
      listened.current.clear();
      userRef.current = user?.id;
    }
  }, [user?.id, stop]);

  const start = useCallback(
    (nextGuide: PlayableGuide, nextIndex = 0) => {
      const active = session.current;
      if (
        active.guide?.id === nextGuide.id &&
        active.index === nextIndex &&
        active.guide.audioFiles[nextIndex]?.fileUrl ===
          nextGuide.audioFiles[nextIndex]?.fileUrl &&
        !audioRef.current?.error
      ) {
        if (audioRef.current?.ended) audioRef.current.currentTime = 0;
        play();
      } else loadTrack(nextGuide, nextIndex);
    },
    [loadTrack, play],
  );
  const playAt = useCallback(
    (nextIndex: number) => {
      const active = session.current;
      if (
        active.guide &&
        nextIndex >= 0 &&
        nextIndex < active.guide.audioFiles.length
      )
        start(active.guide, nextIndex);
    },
    [start],
  );
  const toggle = useCallback(() => {
    const audio = audioRef.current;
    const active = session.current;
    if (!audio || !active.guide) return;
    if (wantsPlayback.current) {
      generation.current++;
      wantsPlayback.current = false;
      audio.pause();
      setIsPlaying(false);
      setIsLoading(false);
    } else if (audio.error || !audio.getAttribute("src"))
      loadTrack(active.guide, active.index);
    else {
      if (audio.ended) audio.currentTime = 0;
      play();
    }
  }, [loadTrack, play]);
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (
      !audio ||
      !Number.isFinite(time) ||
      !Number.isFinite(audio.duration) ||
      audio.duration <= 0
    )
      return;
    audio.currentTime = Math.max(0, Math.min(time, audio.duration));
    setCurrentTime(audio.currentTime);
  }, []);
  const skip = useCallback(
    (seconds: number) => seek((audioRef.current?.currentTime || 0) + seconds),
    [seek],
  );
  const next = useCallback(() => playAt(session.current.index + 1), [playAt]);
  const prev = useCallback(() => {
    if ((audioRef.current?.currentTime || 0) > 3 || session.current.index === 0)
      seek(0);
    else playAt(session.current.index - 1);
  }, [playAt, seek]);
  const setVol = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    const safe = Math.max(0, Math.min(1, value));
    if (audioRef.current) audioRef.current.volume = safe;
    setVolume(safe);
  }, []);
  const setSpeed = useCallback((speed: number) => {
    if (!PLAYBACK_SPEEDS.includes(speed)) return;
    speedRef.current = speed;
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
    try {
      localStorage.setItem("audio_playback_speed", String(speed));
    } catch {
      /* Optional preference. */
    }
  }, []);
  const setRepeat = useCallback((value: boolean) => {
    repeatRef.current = value;
    setRepeatState(value);
  }, []);
  const value = useMemo<PlayerState>(
    () => ({
      guide,
      index,
      isPlaying,
      isLoading,
      error,
      expanded,
      repeat,
      currentTime,
      duration,
      volume,
      isMuted: volume === 0,
      playbackSpeed,
      start,
      playAt,
      stop,
      toggle,
      next,
      prev,
      seek,
      skip,
      setVol,
      setSpeed,
      setExpanded,
      setRepeat,
    }),
    [
      guide,
      index,
      isPlaying,
      isLoading,
      error,
      expanded,
      repeat,
      currentTime,
      duration,
      volume,
      playbackSpeed,
      start,
      playAt,
      stop,
      toggle,
      next,
      prev,
      seek,
      skip,
      setVol,
      setSpeed,
      setRepeat,
    ],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer(): PlayerState {
  const context = useContext(Ctx);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
}
