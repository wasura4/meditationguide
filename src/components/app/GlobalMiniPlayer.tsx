"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer, PLAYBACK_SPEEDS } from "@/contexts/PlayerContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  ChevronDown,
  SkipBack,
  SkipForward,
  ListMusic,
  Repeat,
  LoaderCircle,
} from "lucide-react";
import { AudioArtwork } from "@/components/audio/AudioArtwork";
import { audioTime } from "@/lib/audioPresentation";

export function GlobalMiniPlayer() {
  const p = usePlayer();
  const { t } = useLanguage();
  const [showQueue, setShowQueue] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hasGuide = !!p.guide;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !p.expanded || !hasGuide) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      dialog.close();
    };
  }, [p.expanded, hasGuide]);
  if (!p.guide) return null;
  const track = p.guide.audioFiles[p.index];
  const duration = Math.max(0, p.duration);
  const currentTime = Math.min(p.currentTime, duration);
  const progress = duration ? (currentTime / duration) * 100 : 0;
  const subtitle =
    p.guide.authorName ||
    (p.guide.name !== track?.title
      ? p.guide.name
      : t(`listen.category.${track?.category}`));
  const playLabel = p.error
    ? t("listen.retry")
    : p.isPlaying
      ? t("interface.pause")
      : t("interface.play");
  const playIcon = p.isPlaying ? (
    <Pause size={28} fill="currentColor" aria-hidden="true" />
  ) : (
    <Play size={28} fill="currentColor" aria-hidden="true" />
  );
  return (
    <>
      <section
        aria-label={t("interface.now_playing")}
        className="app-mini-player"
      >
        <div className="listen-mini relative flex items-center gap-1 overflow-hidden rounded-2xl border border-border p-2 shadow-lg backdrop-blur-xl">
          <button
            type="button"
            aria-label={`${t("interface.expand_player")}: ${track?.title}`}
            onClick={() => p.setExpanded(true)}
            className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl text-left"
          >
            <AudioArtwork
              src={p.guide.thumbnailUrl}
              className="h-12 w-12 rounded-xl"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {track?.title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {p.error
                  ? t("listen.play_error_short")
                  : p.isLoading
                    ? t("listen.buffering")
                    : subtitle}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={p.toggle}
            aria-label={playLabel}
            className="app-icon-button shrink-0"
          >
            {p.isPlaying ? (
              <Pause size={21} fill="currentColor" />
            ) : (
              <Play size={21} fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            onClick={p.stop}
            aria-label={t("interface.stop")}
            className="app-icon-button shrink-0"
          >
            <X size={18} />
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
        onClose={() => p.setExpanded(false)}
        aria-labelledby="player-title"
        className="app-player-dialog listen-player"
      >
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-6 sm:px-8">
          <header className="flex shrink-0 items-center justify-between gap-3 py-4">
            <button
              type="button"
              onClick={() => p.setExpanded(false)}
              aria-label={t("interface.collapse_player")}
              className="app-icon-button"
            >
              <ChevronDown size={24} />
            </button>
            <div className="min-w-0 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t(showQueue ? "listen.queue" : "interface.now_playing")}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {t("listen.track_position", {
                  current: p.index + 1,
                  total: p.guide.audioFiles.length,
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={p.stop}
              aria-label={t("interface.stop")}
              className="app-icon-button"
            >
              <X size={20} />
            </button>
          </header>
          {showQueue ? (
            <div className="flex-1 py-4">
              <h2
                id="player-title"
                className="mb-2 break-words text-xl font-bold leading-relaxed"
              >
                {p.guide.name}
              </h2>
              <p className="mb-5 text-sm text-muted-foreground">
                {t("listen.queue_hint")}
              </p>
              <ol className="space-y-2">
                {p.guide.audioFiles.map((item, index) => (
                  <li key={`${item.id}-${index}`}>
                    <button
                      type="button"
                      onClick={() => p.playAt(index)}
                      aria-current={index === p.index ? "true" : undefined}
                      className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border p-3 text-left ${index === p.index ? "border-primary/30 bg-primary/10" : "border-transparent hover:bg-muted"}`}
                    >
                      <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
                        {index === p.index && p.isPlaying ? (
                          <Pause size={16} />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-sm font-medium leading-relaxed">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {audioTime(item.duration)}
                        </span>
                      </span>
                      {index === p.index && (
                        <span className="text-xs text-muted-foreground">
                          {t("listen.current")}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-center py-3">
              <AudioArtwork
                src={p.guide.thumbnailUrl}
                className="listen-player-cover mx-auto aspect-square w-full rounded-[28px] border border-border shadow-sm"
              />
              <div className="mt-6">
                <h2
                  id="player-title"
                  className="break-words text-xl font-bold leading-relaxed sm:text-2xl"
                >
                  {track?.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {subtitle}
                </p>
                {track?.description && (
                  <details className="mt-3 text-sm text-muted-foreground">
                    <summary className="cursor-pointer py-2">
                      {t("listen.about_recording")}
                    </summary>
                    <p className="whitespace-pre-line pb-2 leading-loose">
                      {track.description}
                    </p>
                  </details>
                )}
              </div>
              <div className="mt-3">
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
                  aria-valuetext={`${audioTime(currentTime)} / ${audioTime(duration)}`}
                  className="min-h-11 w-full accent-primary"
                />
                <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
                  <span>{audioTime(currentTime)}</span>
                  <span>−{audioTime(duration - currentTime)}</span>
                </div>
              </div>
              <div className="my-6 flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={p.prev}
                  aria-label={t("listen.previous")}
                  className="app-icon-button"
                >
                  <SkipBack size={22} fill="currentColor" />
                </button>
                <button
                  type="button"
                  onClick={() => p.skip(-10)}
                  disabled={!duration}
                  aria-label={t("interface.skip_back")}
                  className="app-icon-button relative disabled:opacity-40"
                >
                  <RotateCcw size={29} />
                  <span
                    className="absolute text-[9px] font-bold"
                    aria-hidden="true"
                  >
                    10
                  </span>
                </button>
                <button
                  type="button"
                  onClick={p.toggle}
                  aria-label={playLabel}
                  className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                >
                  {playIcon}
                  {p.isLoading && (
                    <LoaderCircle
                      size={88}
                      className="pointer-events-none absolute animate-spin text-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => p.skip(10)}
                  disabled={!duration}
                  aria-label={t("interface.skip_forward")}
                  className="app-icon-button relative disabled:opacity-40"
                >
                  <RotateCw size={29} />
                  <span
                    className="absolute text-[9px] font-bold"
                    aria-hidden="true"
                  >
                    10
                  </span>
                </button>
                <button
                  type="button"
                  onClick={p.next}
                  disabled={p.index >= p.guide.audioFiles.length - 1}
                  aria-label={t("listen.next")}
                  className="app-icon-button disabled:opacity-30"
                >
                  <SkipForward size={22} fill="currentColor" />
                </button>
              </div>
            </div>
          )}
          {p.error && (
            <p
              role="alert"
              className="mb-4 rounded-2xl bg-muted p-4 text-sm leading-relaxed"
            >
              {t("listen.play_error")}{" "}
              <button
                type="button"
                onClick={p.toggle}
                className="min-h-11 font-semibold underline"
              >
                {t("listen.retry")}
              </button>
            </p>
          )}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <label className="sr-only" htmlFor="player-speed">
              {t("interface.playback_speed")}
            </label>
            <select
              id="player-speed"
              value={p.playbackSpeed}
              onChange={(event) => p.setSpeed(Number(event.target.value))}
              className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm font-semibold"
            >
              {PLAYBACK_SPEEDS.map((speed) => (
                <option key={speed} value={speed}>
                  {speed}×
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => p.setRepeat(!p.repeat)}
              aria-pressed={p.repeat}
              aria-label={t("listen.repeat")}
              className={`app-icon-button ${p.repeat ? "bg-primary/15 ring-1 ring-primary/30" : ""}`}
            >
              <Repeat size={21} />
            </button>
            <button
              type="button"
              onClick={() => setShowQueue((value) => !value)}
              aria-pressed={showQueue}
              className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium"
            >
              <ListMusic size={21} />
              {t(showQueue ? "interface.now_playing" : "listen.queue")}
            </button>
          </footer>
        </div>
      </dialog>
    </>
  );
}
