"use client";
import { useCallback } from "react";
import type { PracticeClock } from "@/lib/meditationClock";
import type {} from "@/types/native-bridge";

/** Versioned snapshot contract: native schedules the same deadline as the web. */
export function sendPracticeToNative(
  clock: PracticeClock,
  target: Pick<Window, "AndroidInterface" | "webkit">,
): boolean {
  const payload = {
    ...clock,
    protocolVersion: 2,
    deadlineMs: clock.anchor + clock.targetMs - clock.elapsedMs,
  };
  try {
    if (typeof target.AndroidInterface?.syncPractice === "function") {
      target.AndroidInterface.syncPractice(JSON.stringify(payload));
      return true;
    }
    const handler = target.webkit?.messageHandlers?.syncPractice;
    if (handler) {
      handler.postMessage(payload);
      return true;
    }
  } catch {
    /* Fall back to the web clock, without claiming a native cue. */
  }
  return false;
}
export function useNativeBridge() {
  const syncPractice = useCallback(
    (clock: PracticeClock) => sendPracticeToNative(clock, window),
    [],
  );
  const supportsTimer = useCallback(
    () =>
      typeof window !== "undefined" &&
      (typeof window.AndroidInterface?.syncPractice === "function" ||
        !!window.webkit?.messageHandlers?.syncPractice),
    [],
  );
  const isNative = useCallback(
    () =>
      typeof window !== "undefined" &&
      (!!window.AndroidInterface ||
        !!window.Android ||
        !!window.webkit?.messageHandlers?.onMeditationStart),
    [],
  );
  return { syncPractice, supportsTimer, isNative };
}
