/** Serializable clock. UI ticks never change the time source or write storage. */
export interface PracticeClock {
  version: 1;
  id: string;
  userId: string;
  typeId: string;
  typeName: string;
  eventId?: string;
  targetMs: number;
  elapsedMs: number;
  anchor: number;
  startedAt: number;
  endsAt?: number;
  phase: "settling" | "running" | "paused" | "finished";
  outcome?: "completed" | "abandoned";
  bell: boolean;
  saved?: boolean;
}

export function practiceElapsed(clock: PracticeClock, now: number): number {
  return Math.min(
    clock.targetMs,
    Math.max(
      0,
      clock.elapsedMs +
        (clock.phase === "running" || clock.phase === "settling"
          ? Math.max(0, now - clock.anchor)
          : 0),
    ),
  );
}

export function advancePractice(
  clock: PracticeClock,
  now: number,
): PracticeClock {
  if (clock.phase === "finished" || clock.phase === "paused") return clock;
  const elapsed = practiceElapsed(clock, now);
  if (elapsed >= clock.targetMs)
    return {
      ...clock,
      phase: "finished",
      outcome: "completed",
      elapsedMs: clock.targetMs,
      endsAt: clock.anchor + clock.targetMs - clock.elapsedMs,
    };
  if (clock.phase === "settling" && now >= clock.anchor)
    return { ...clock, phase: "running" };
  return clock;
}

export function pausePractice(
  clock: PracticeClock,
  now: number,
): PracticeClock {
  const current = advancePractice(clock, now);
  if (current.phase !== "running") return current;
  return {
    ...current,
    phase: "paused",
    elapsedMs: practiceElapsed(current, now),
    anchor: now,
  };
}

export function resumePractice(
  clock: PracticeClock,
  now: number,
): PracticeClock {
  return clock.phase === "paused"
    ? { ...clock, phase: "running", anchor: now }
    : clock;
}

export function finishPractice(
  clock: PracticeClock,
  now: number,
): PracticeClock {
  const current = advancePractice(clock, now);
  if (current.phase === "finished") return current;
  return {
    ...current,
    phase: "finished",
    outcome: "abandoned",
    elapsedMs: practiceElapsed(current, now),
    endsAt: now,
  };
}

export function createPractice(
  input: Pick<
    PracticeClock,
    "id" | "userId" | "typeId" | "typeName" | "bell" | "eventId"
  >,
  minutes: number,
  settlingSeconds: number,
  now: number,
): PracticeClock {
  if (
    !Number.isInteger(minutes) ||
    minutes < 1 ||
    minutes > 120 ||
    ![0, 5, 10, 15].includes(settlingSeconds)
  )
    throw new Error("Invalid duration");
  return {
    ...input,
    version: 1,
    targetMs: minutes * 60000,
    elapsedMs: 0,
    anchor: now + settlingSeconds * 1000,
    startedAt: now + settlingSeconds * 1000,
    phase: settlingSeconds ? "settling" : "running",
  };
}

export function parsePractice(
  raw: string | null,
  userId: string,
): PracticeClock | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as PracticeClock;
    if (
      c.version !== 1 ||
      c.userId !== userId ||
      typeof c.id !== "string" ||
      !/^practice_[a-zA-Z0-9-]+$/.test(c.id) ||
      typeof c.typeId !== "string" ||
      typeof c.typeName !== "string" ||
      typeof c.bell !== "boolean" ||
      !["settling", "running", "paused", "finished"].includes(c.phase) ||
      ![c.targetMs, c.elapsedMs, c.anchor, c.startedAt].every(
        Number.isFinite,
      ) ||
      c.targetMs < 60000 ||
      c.targetMs > 7200000 ||
      c.elapsedMs < 0 ||
      c.elapsedMs > c.targetMs ||
      (c.phase === "finished" &&
        (!Number.isFinite(c.endsAt) ||
          !["completed", "abandoned"].includes(c.outcome!))) ||
      (c.eventId !== undefined &&
        (typeof c.eventId !== "string" || c.eventId.includes("/"))) ||
      (c.saved !== undefined && typeof c.saved !== "boolean")
    )
      return null;
    return c;
  } catch {
    return null;
  }
}

export const practiceStorageKey = (userId: string) =>
  `nirvanaya.practice.v1:${userId}`;
export function practiceTime(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
