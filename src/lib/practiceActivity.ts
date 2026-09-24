import type { MeditationSession } from "@/types";

// Calendar arithmetic keeps the window aligned to local days, including DST.
export function practiceWindowStart(now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  return start;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function summarizePractice(sessions: MeditationSession[], now: Date) {
  const start = practiceWindowStart(now);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    return { date, minutes: 0, sessions: 0 };
  });
  const byDay = new Map(days.map((day) => [dayKey(day.date), day]));
  const seen = new Set<string>();
  for (const session of sessions) {
    if (
      seen.has(session.id) ||
      session.status !== "completed" ||
      !Number.isFinite(session.duration) ||
      session.duration <= 0 ||
      session.createdAt < start ||
      session.createdAt > now
    )
      continue;
    const day = byDay.get(dayKey(session.createdAt));
    if (!day) continue;
    seen.add(session.id);
    day.minutes += session.duration;
    day.sessions += 1;
  }
  return {
    days,
    activeDays: days.filter((day) => day.sessions > 0).length,
    totalMinutes: days.reduce((sum, day) => sum + day.minutes, 0),
    totalSessions: days.reduce((sum, day) => sum + day.sessions, 0),
    todayMinutes: days[6].minutes,
  };
}
