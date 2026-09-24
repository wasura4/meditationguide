"use client";
import { useState } from "react";
import {
  Pause,
  Play,
  Bell,
  BellOff,
  Check,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  practiceElapsed,
  practiceTime,
  type PracticeClock,
} from "@/lib/meditationClock";
import { PracticeSheet } from "./PracticeSheet";

interface Props {
  nativeUnavailable?: boolean;
  clock: PracticeClock;
  now: number;
  awake: boolean;
  pause: () => void;
  resume: () => void;
  end: () => void;
  discard: () => void;
  skipSettling: () => void;
}
export function MeditationTimer({
  clock,
  now,
  awake,
  nativeUnavailable,
  pause,
  resume,
  end,
  discard,
  skipSettling,
}: Props) {
  const { t } = useLanguage();
  const [ending, setEnding] = useState(false);
  const [wasRunning, setWasRunning] = useState(false);
  const elapsed = practiceElapsed(clock, now);
  const settling = clock.phase === "settling";
  const paused = clock.phase === "paused";
  const remaining = Math.max(0, clock.targetMs - elapsed);
  const close = () => {
    setEnding(false);
    if (wasRunning) resume();
  };
  const askEnd = () => {
    setWasRunning(clock.phase === "running");
    pause();
    setEnding(true);
  };
  return (
    <section
      aria-label={t("practice.clock")}
      className="practice-focus mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-6 text-center"
    >
      <header className="flex items-center justify-between gap-3 pt-4">
        <button
          onClick={settling ? discard : askEnd}
          className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground"
        >
          <ArrowLeft size={18} />
          {t(settling ? "common.cancel" : "practice.end")}
        </button>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {clock.bell ? <Bell size={16} /> : <BellOff size={16} />}
          {t(clock.bell ? "practice.bell_on" : "practice.bell_off")}
        </span>
      </header>
      {nativeUnavailable && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t("practice.native_update")}
        </p>
      )}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
        <div className="max-w-sm space-y-3">
          <p className="text-xs font-medium tracking-widest text-primary">
            {t(
              settling
                ? "practice.settling"
                : paused
                  ? "practice.paused"
                  : "practice.in_progress",
            )}
          </p>
          <h1 className="text-xl font-medium leading-relaxed sm:text-2xl">
            {clock.typeName}
          </h1>
        </div>
        <div className="relative grid aspect-square w-full max-w-[300px] place-items-center sm:max-w-[340px]">
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              className="text-border"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={
                settling ? 0 : 100 * (1 - remaining / clock.targetMs)
              }
              className="text-primary motion-safe:transition-[stroke-dashoffset] motion-safe:duration-300"
            />
          </svg>
          <div className="z-10 space-y-2">
            <p
              role="timer"
              aria-label={t(
                settling ? "practice.settling" : "practice.remaining",
              )}
              className="select-none text-6xl font-light tracking-tight tabular-nums sm:text-7xl"
            >
              {settling
                ? Math.max(0, Math.ceil((clock.anchor - now) / 1000))
                : practiceTime(remaining)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t(settling ? "practice.get_comfortable" : "practice.remaining")}
            </p>
          </div>
        </div>
        <p
          className="max-w-xs text-sm leading-relaxed text-muted-foreground"
          role="status"
        >
          {t(
            settling
              ? "practice.settle_hint"
              : paused
                ? "practice.pause_hint"
                : "practice.focus_hint",
          )}
        </p>
      </div>
      <footer className="flex flex-col items-center gap-4 pb-7">
        {settling ? (
          <button
            onClick={skipSettling}
            className="min-h-14 rounded-full bg-primary px-8 font-semibold text-primary-foreground"
          >
            {t("practice.begin_now")}
          </button>
        ) : (
          <>
            <button
              onClick={paused ? resume : pause}
              className="flex min-h-16 min-w-44 items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground"
            >
              {paused ? (
                <Play size={21} fill="currentColor" />
              ) : (
                <Pause size={21} />
              )}{" "}
              {t(paused ? "practice.resume" : "practice.pause")}
            </button>
            <button
              onClick={askEnd}
              className="min-h-11 px-5 text-sm text-muted-foreground"
            >
              {t("practice.end")}
            </button>
          </>
        )}
        <p className="min-h-5 text-xs text-muted-foreground">
          {awake ? t("practice.awake") : ""}
        </p>
      </footer>
      {ending && (
        <PracticeSheet title={t("practice.end_question")} onClose={close}>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            {t("practice.end_hint", {
              time: practiceTime(Math.floor(elapsed / 1000) * 1000),
            })}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={close}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground"
            >
              <Play size={18} />
              {t(wasRunning ? "practice.continue" : "practice.stay_paused")}
            </button>
            <button
              disabled={elapsed < 1000}
              onClick={() => {
                setEnding(false);
                end();
              }}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border font-medium disabled:opacity-40"
            >
              <Check size={18} />
              {t("practice.save_end")}
            </button>
            <button
              onClick={discard}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl text-destructive"
            >
              <RotateCcw size={16} />
              {t("practice.discard")}
            </button>
          </div>
        </PracticeSheet>
      )}
    </section>
  );
}
