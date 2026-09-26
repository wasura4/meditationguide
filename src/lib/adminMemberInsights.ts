import type { MeditationSession } from "@/types";
import {
  summarizeDashboardPractice,
  validPracticeSessions,
} from "./dashboardPractice";
import { localDateKey } from "./logbook";

export function memberPracticeInsights(
  sessions: MeditationSession[],
  now = new Date(),
) {
  const completed = validPracticeSessions(sessions, now).filter(
    (session) => session.status === "completed",
  );
  const lifetime = summarizeDashboardPractice(completed, now);
  const types = new Map<
    string,
    { name: string; count: number; minutes: number }
  >();
  const byDay = new Map<string, number>();
  completed.forEach((session) => {
    const name = session.typeName || "Unnamed practice";
    const type = types.get(name) || { name, count: 0, minutes: 0 };
    type.count++;
    type.minutes += session.duration;
    types.set(name, type);
    const key = localDateKey(session.startTime || session.createdAt);
    byDay.set(key, (byDay.get(key) || 0) + session.duration);
  });
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 29 + index,
    );
    return { date, minutes: byDay.get(localDateKey(date)) || 0 };
  });
  const dates = [...byDay.keys()].sort();
  let longest = 0,
    run = 0,
    last = "";
  dates.forEach((key) => {
    const date = new Date(`${key}T12:00:00`);
    date.setDate(date.getDate() - 1);
    run = last === localDateKey(date) ? run + 1 : 1;
    longest = Math.max(longest, run);
    last = key;
  });
  const sorted = [...completed].sort(
    (a, b) =>
      (b.startTime || b.createdAt).getTime() -
      (a.startTime || a.createdAt).getTime(),
  );
  return {
    ...lifetime,
    completed: completed.length,
    average: completed.length
      ? Math.round(lifetime.totalMinutes / completed.length)
      : 0,
    longest,
    lastPractice: sorted[0]?.startTime || sorted[0]?.createdAt,
    days,
    types: [...types.values()].sort(
      (a, b) => b.count - a.count || b.minutes - a.minutes,
    ),
    recentMinutes: days.reduce((sum, day) => sum + day.minutes, 0),
    recentDays: days.filter((day) => day.minutes > 0).length,
  };
}
