"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNativeBridge } from "./useNativeBridge";
import {
  advancePractice,
  createPractice,
  finishPractice,
  pausePractice,
  practiceStorageKey,
  parsePractice,
  resumePractice,
  type PracticeClock,
} from "@/lib/meditationClock";
import { savePractice } from "@/lib/practiceTransactions";
import { db } from "@/lib/firebase";
import { prepareBellSound, playBellSound } from "@/lib/audioUtils";

export function usePracticeClock(userId?: string) {
  const [clock, setClock] = useState<PracticeClock | null>(null);
  const clockRef = useRef<PracticeClock | null>(null);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "pending"
  >("idle");
  const [storageError, setStorageError] = useState(false);
  const [awake, setAwake] = useState(false);
  const saving = useRef<string | null>(null);
  const nativeHandled = useRef(false);
  const bridge = useNativeBridge();
  const bridgeRef = useRef(bridge);
  bridgeRef.current = bridge;

  const commit = useCallback(
    (next: PracticeClock | null) => {
      if (!userId) return false;
      try {
        if (next)
          localStorage.setItem(
            practiceStorageKey(userId),
            JSON.stringify(next),
          );
        else localStorage.removeItem(practiceStorageKey(userId));
        setStorageError(false);
      } catch {
        setStorageError(true);
        return false;
      }
      if (next) nativeHandled.current = bridgeRef.current.syncPractice(next);
      else if (clockRef.current)
        bridgeRef.current.syncPractice({
          ...clockRef.current,
          phase: "finished",
          outcome: "abandoned",
        });
      clockRef.current = next;
      setClock(next);
      setNow(Date.now());
      return true;
    },
    [userId],
  );

  const retrySave = useCallback(async () => {
    const current = clockRef.current;
    if (
      !current ||
      current.userId !== userId ||
      current.phase !== "finished" ||
      saving.current === current.id
    )
      return;
    if (current.saved) {
      setSaveState("saved");
      return;
    }
    saving.current = current.id;
    setSaveState("saving");
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      // A stalled connection must not trap the finish screen indefinitely.
      // The transaction may still finish later; the stable ID makes retry safe.
      const acknowledged = await Promise.race([
        savePractice(db, current),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error("Save not acknowledged")),
            12000,
          );
        }),
      ]);
      if (
        clockRef.current?.id === current.id &&
        clockRef.current.userId === userId
      ) {
        commit({
          ...clockRef.current,
          saved: true,
          elapsedMs: Math.round(acknowledged.duration * 60000),
          outcome: acknowledged.status as "completed" | "abandoned",
          startedAt: acknowledged.startTime.getTime(),
          endsAt: acknowledged.endTime!.getTime(),
        });
        setSaveState("saved");
      }
    } catch {
      if (clockRef.current?.id === current.id) setSaveState("pending");
    } finally {
      clearTimeout(timeout);
      if (saving.current === current.id) saving.current = null;
    }
  }, [commit, userId]);

  const tick = useCallback(() => {
    const current = clockRef.current;
    const time = Date.now();
    if (!current || current.userId !== userId) return;
    if (current.phase === "running" || current.phase === "settling")
      setNow(time);
    const next = advancePractice(current, time);
    if (next === current) return;
    // Change the phase synchronously before sound, native messages or async saving.
    // Even when local storage becomes unavailable, never complete the same run twice.
    if (!commit(next)) {
      clockRef.current = next;
      setClock(next);
    }
    if (next.phase === "finished") {
      if (next.bell && !nativeHandled.current) playBellSound(true);
      void retrySave();
    }
  }, [commit, retrySave, userId]);

  useEffect(() => {
    clockRef.current = null;
    setClock(null);
    setReady(false);
    setSaveState("idle");
    if (!userId) return;
    try {
      const restored = parsePractice(
        localStorage.getItem(practiceStorageKey(userId)),
        userId,
      );
      clockRef.current = restored;
      setClock(restored);
      if (restored && restored.phase !== "finished")
        bridgeRef.current.syncPractice(restored);
      if (restored?.saved) setSaveState("saved");
      else if (restored?.phase === "finished") setSaveState("pending");
    } catch {
      setStorageError(true);
    }
    setReady(true);
    tick();
    // Recovery uses the original identity and deadline, regardless of calendar date.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== practiceStorageKey(userId)) return;
      const restored = parsePractice(event.newValue, userId);
      clockRef.current = restored;
      setClock(restored);
      setSaveState(
        restored?.saved
          ? "saved"
          : restored?.phase === "finished"
            ? "pending"
            : "idle",
      );
      tick();
    };
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    const timer = window.setInterval(tick, 250);
    window.addEventListener("storage", onStorage);
    window.addEventListener("online", retrySave);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("online", retrySave);
      document.removeEventListener("visibilitychange", onVisible);
      clockRef.current = null;
    };
  }, [userId, tick, retrySave]);

  const phase = clock?.phase;
  useEffect(() => {
    if (phase !== "running" && phase !== "settling") {
      setAwake(false);
      return;
    }
    let disposed = false;
    let lock: WakeLockSentinel | null = null;
    const acquire = async () => {
      if (
        disposed ||
        document.hidden ||
        !("wakeLock" in navigator) ||
        (lock && !lock.released)
      )
        return;
      try {
        const acquired = await navigator.wakeLock.request("screen");
        if (disposed) {
          await acquired.release();
          return;
        }
        lock = acquired;
        setAwake(true);
        acquired.addEventListener("release", () => {
          if (!disposed) setAwake(false);
        });
      } catch {
        if (!disposed) setAwake(false);
      }
    };
    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release();
    };
  }, [phase]);

  const begin = (
    typeId: string,
    typeName: string,
    minutes: number,
    bell: boolean,
    settling: number,
    eventId?: string,
  ) => {
    if (!userId || !ready || clockRef.current) return;
    void prepareBellSound();
    const next = createPractice(
      {
        id: `practice_${crypto.randomUUID()}`,
        userId,
        typeId,
        typeName,
        bell,
        ...(eventId ? { eventId } : {}),
      },
      minutes,
      settling,
      Date.now(),
    );
    if (commit(next)) {
      setSaveState("idle");
    }
  };
  const pause = () => {
    const current = clockRef.current;
    if (!current) return;
    const next = pausePractice(current, Date.now());
    if (commit(next)) {
      if (next.phase === "finished") {
        if (next.bell && !nativeHandled.current) playBellSound(true);
        void retrySave();
      }
    }
  };
  const resume = () => {
    const current = clockRef.current;
    if (!current || current.phase !== "paused") return;
    void prepareBellSound();
    commit(resumePractice(current, Date.now()));
  };
  const skipSettling = () => {
    const current = clockRef.current;
    if (!current || current.phase !== "settling") return;
    const next = {
      ...current,
      phase: "running" as const,
      anchor: Date.now(),
      startedAt: Date.now(),
    };
    commit(next);
  };
  const end = () => {
    const current = clockRef.current;
    if (!current || current.phase === "finished") return;
    const next = finishPractice(current, Date.now());
    if (next.elapsedMs < 1000) return;
    if (commit(next)) {
      void retrySave();
    }
  };
  const discard = () => {
    const current = clockRef.current;
    if (!current) return;
    if (commit(null)) setSaveState("idle");
  };
  return {
    nativeUnavailable: ready && bridge.isNative() && !bridge.supportsTimer(),
    clock,
    ready,
    now,
    saveState,
    storageError,
    awake,
    begin,
    pause,
    resume,
    end,
    discard,
    skipSettling,
    retrySave,
  };
}
