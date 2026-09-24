"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  ChevronDown,
  Headphones,
} from "lucide-react";

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const formatTime = (seconds: number) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(safe / 60)}:${Math.floor(safe % 60)
    .toString()
    .padStart(2, "0")}`;
};

export function GlobalMiniPlayer() {
  const p = usePlayer();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expanded && p.guide) {
      dialog.showModal();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
        dialog.close();
      };
    }
  }, [expanded, p.guide]);

  useEffect(() => {
    if (!p.guide) setExpanded(false);
  }, [p.guide]);

  if (!p.guide) return null;
  const track = p.guide.audioFiles[p.index];
  const duration = Number.isFinite(p.duration) ? Math.max(0, p.duration) : 0;
  const currentTime = Number.isFinite(p.currentTime)
    ? Math.max(0, Math.min(p.currentTime, duration))
    : 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <section
        aria-label={t("interface.now_playing")}
        className="app-mini-player"
      >
        <div className="relative flex items-center gap-1 overflow-hidden rounded-2xl border border-border bg-background/95 p-2 shadow-lg backdrop-blur-xl">
          <button
            type="button"
            aria-label={`${t("interface.expand_player")}: ${track?.title || p.guide.name}`}
            onClick={() => setExpanded(true)}
            className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl px-2 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <Headphones size={21} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {track?.title || p.guide.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {p.guide.name}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={p.toggle}
            aria-label={
              p.isPlaying ? t("interface.pause") : t("interface.play")
            }
            className="app-icon-button shrink-0"
          >
            {p.isPlaying ? (
              <Pause size={19} fill="currentColor" aria-hidden="true" />
            ) : (
              <Play size={19} fill="currentColor" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={p.stop}
            aria-label={t("interface.stop")}
            className="app-icon-button shrink-0"
          >
            <X size={18} aria-hidden="true" />
          </button>
          <div
            className="pointer-events-none absolute inset-x-3 bottom-0 h-0.5 bg-muted"
            aria-hidden="true"
          >
            <div
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>
      <dialog
        ref={dialogRef}
        onClose={() => setExpanded(false)}
        aria-labelledby="player-title"
        className="app-player-dialog"
      >
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-6 sm:px-8">
          <header className="flex shrink-0 items-center justify-between gap-3 py-4">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label={t("interface.collapse_player")}
              className="app-icon-button"
            >
              <ChevronDown size={24} aria-hidden="true" />
            </button>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("interface.now_playing")}
            </p>
            <button
              type="button"
              onClick={p.stop}
              aria-label={t("interface.stop")}
              className="app-icon-button"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center py-6">
            <div className="mb-7 flex aspect-square w-[min(52vw,240px)] items-center justify-center rounded-[28px] border border-primary/20 bg-primary/10">
              <Headphones
                size={72}
                strokeWidth={1}
                className="text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <h2
              id="player-title"
              className="w-full text-center text-xl font-semibold leading-relaxed"
            >
              {track?.title || p.guide.name}
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {p.guide.name}
            </p>
            <div className="mt-6 w-full">
              <label htmlFor="player-position" className="sr-only">
                {t("interface.seek")}
              </label>
              <input
                id="player-position"
                type="range"
                min="0"
                max={duration || 1}
                step="1"
                value={currentTime}
                disabled={!duration}
                onChange={(event) => p.seek(Number(event.target.value))}
                aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
                className="min-h-11 w-full accent-primary"
              />
              <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <div className="my-7 flex items-center justify-center gap-8">
              <button
                type="button"
                onClick={() => p.skip(-10)}
                aria-label={t("interface.skip_back")}
                className="app-icon-button"
              >
                <RotateCcw size={24} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={p.toggle}
                aria-label={
                  p.isPlaying ? t("interface.pause") : t("interface.play")
                }
                className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-foreground"
              >
                {p.isPlaying ? (
                  <Pause size={30} fill="currentColor" aria-hidden="true" />
                ) : (
                  <Play size={30} fill="currentColor" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => p.skip(10)}
                aria-label={t("interface.skip_forward")}
                className="app-icon-button"
              >
                <RotateCw size={24} aria-hidden="true" />
              </button>
            </div>
            <label className="flex items-center gap-3 text-sm text-muted-foreground">
              {t("interface.playback_speed")}
              <select
                value={p.playbackSpeed}
                onChange={(event) => p.setSpeed(Number(event.target.value))}
                className="min-h-11 rounded-xl border border-border bg-background px-3 text-foreground"
              >
                {PLAYBACK_SPEEDS.map((speed) => (
                  <option key={speed} value={speed}>
                    {speed}×
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </dialog>
    </>
  );
}
