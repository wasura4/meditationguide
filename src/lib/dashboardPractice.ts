import type { MeditationSession } from "@/types";

export function dailyPracticeGoal(value: unknown): number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 120
    ? value
    : 20;
}

const key = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/** Shared by Home and Progress; calendar dates reflect practice, not upload time. */
export function validPracticeSessions(
  sessions: MeditationSession[],
  now: Date,
) {
  const seen = new Set<string>();
  return sessions.filter((session) => {
    const date = session.startTime || session.createdAt;
    if (
      seen.has(session.id) ||
      !["completed", "abandoned"].includes(session.status) ||
      !Number.isFinite(session.duration) ||
      session.duration <= 0 ||
      !date ||
      !Number.isFinite(date.getTime()) ||
      date > now
    )
      return false;
    seen.add(session.id);
    return true;
  });
}

export function summarizeDashboardPractice(
  sessions: MeditationSession[],
  now: Date,
) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + index);
    return {
      date,
      minutes: 0,
      sessions: 0,
      future: date > today,
      today: key(date) === key(today),
    };
  });
  const byDay = new Map<string, number>();
  let totalMinutes = 0;
  for (const session of validPracticeSessions(sessions, now)) {
    // A late sync belongs to the day of practice, not the day it reached Firestore.
    const date = session.startTime || session.createdAt;
    if (session.status !== "completed") continue;
    totalMinutes += session.duration;
    byDay.set(key(date), (byDay.get(key(date)) || 0) + session.duration);
    const day = days.find((day) => key(day.date) === key(date));
    if (day) {
      day.minutes += session.duration;
      day.sessions++;
    }
  }
  const cursor = new Date(today);
  if (!byDay.has(key(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (byDay.has(key(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    days,
    totalMinutes,
    practiceDays: byDay.size,
    streak,
    todayMinutes: byDay.get(key(today)) || 0,
    weekDays: days.filter((day) => day.sessions > 0).length,
  };
}
