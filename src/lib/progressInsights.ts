import type { MeditationSession } from "@/types";
import {
  summarizeDashboardPractice,
  validPracticeSessions,
} from "./dashboardPractice";
import { localDateKey } from "./logbook";

export type ProgressRange = "7" | "30" | "90" | "all";
export const practiceDate = (s: MeditationSession) =>
  s.startTime || s.createdAt;
export function shiftDay(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}
export function periodBounds(range: ProgressRange, now: Date) {
  if (range === "all") return null;
  const days = Number(range);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - days + 1);
  return {
    start,
    end: now,
    previousStart: shiftDay(start, -days),
    previousEnd: shiftDay(now, -days),
  };
}
function periodSummary(sessions: MeditationSession[]) {
  const completed = sessions.filter((s) => s.status === "completed");
  const minutes = completed.reduce((sum, s) => sum + s.duration, 0);
  const durations = completed.map((s) => s.duration).sort((a, b) => a - b);
  const mid = Math.floor(durations.length / 2);
  const typical = durations.length
    ? durations.length % 2
      ? durations[mid]
      : (durations[mid - 1] + durations[mid]) / 2
    : 0;
  const early = sessions.filter((s) => s.status === "abandoned");
  return {
    sessions: completed.length,
    minutes,
    days: new Set(completed.map((s) => localDateKey(practiceDate(s)))).size,
    typical,
    earlySessions: early.length,
    earlyMinutes: early.reduce((sum, s) => sum + s.duration, 0),
  };
}
export function progressInsights(
  sessions: MeditationSession[],
  range: ProgressRange,
  now: Date,
) {
  const valid = validPracticeSessions(sessions, now).sort(
    (a, b) => practiceDate(b).getTime() - practiceDate(a).getTime(),
  );
  const bounds = periodBounds(range, now);
  const current = bounds
    ? valid.filter(
        (s) => practiceDate(s) >= bounds.start && practiceDate(s) <= bounds.end,
      )
    : valid;
  const previous = bounds
    ? valid.filter(
        (s) =>
          practiceDate(s) >= bounds.previousStart &&
          practiceDate(s) <= bounds.previousEnd,
      )
    : [];
  const completed = valid.filter((s) => s.status === "completed");
  const dates = [
    ...new Set(completed.map((s) => localDateKey(practiceDate(s)))),
  ].sort();
  let longest = 0,
    run = 0,
    last: string | null = null;
  for (const day of dates) {
    const [year, month, date] = day.split("-").map(Number);
    run =
      last === localDateKey(shiftDay(new Date(year, month - 1, date), -1))
        ? run + 1
        : 1;
    longest = Math.max(longest, run);
    last = day;
  }
  const types = new Map<
    string,
    { id: string; name: string; minutes: number; sessions: number }
  >();
  for (const s of current.filter((s) => s.status === "completed")) {
    const item = types.get(s.typeId) || {
      id: s.typeId,
      name: s.typeName,
      minutes: 0,
      sessions: 0,
    };
    item.minutes += s.duration;
    item.sessions++;
    types.set(s.typeId, item);
  }
  return {
    valid,
    current,
    bounds,
    summary: periodSummary(current),
    previous: periodSummary(previous),
    lifetime: summarizeDashboardPractice(valid, now),
    longest,
    types: [...types.values()].sort((a, b) => b.minutes - a.minutes),
  };
}

/** At most 30 bars for daily periods, 13 weekly bars for 90 days, 12 yearly/monthly groups for long histories. */
export function progressTrend(
  sessions: MeditationSession[],
  range: ProgressRange,
  now: Date,
) {
  const completed = sessions.filter((s) => s.status === "completed");
  const bounds = periodBounds(range, now);
  const earliest = completed.length
    ? new Date(
        completed.reduce(
          (min, s) => Math.min(min, practiceDate(s).getTime()),
          now.getTime(),
        ),
      )
    : now;
  const start =
    bounds?.start || new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const monthSpan =
    (now.getFullYear() - start.getFullYear()) * 12 +
    now.getMonth() -
    start.getMonth() +
    1;
  const monthsPerBucket = Math.max(1, Math.ceil(monthSpan / 12));
  const buckets: { start: Date; end: Date; minutes: number }[] = [];
  for (let cursor = new Date(start); cursor <= now; ) {
    const next =
      range === "all"
        ? new Date(cursor.getFullYear(), cursor.getMonth() + monthsPerBucket, 1)
        : shiftDay(cursor, range === "90" ? 7 : 1);
    buckets.push({
      start: new Date(cursor),
      end: new Date(Math.min(next.getTime() - 1, now.getTime())),
      minutes: 0,
    });
    cursor = next;
  }
  for (const s of completed) {
    const date = practiceDate(s);
    const bucket = buckets.find((b) => date >= b.start && date <= b.end);
    if (bucket) bucket.minutes += s.duration;
  }
  return buckets;
}
