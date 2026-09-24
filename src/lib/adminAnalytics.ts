import type { User, MeditationSession } from "@/types";

export type AdminTimeRange = "7d" | "30d" | "90d" | "all";
const dayStart = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
const offsetDay = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function analyticsStart(range: AdminTimeRange, now: Date): Date | null {
  return range === "all" ? null : offsetDay(now, 1 - Number.parseInt(range));
}
export function buildAdminAnalytics(
  users: User[],
  sessions: MeditationSession[],
  range: AdminTimeRange,
  now = new Date(),
) {
  const validDate = (date: Date) =>
    date instanceof Date && Number.isFinite(date.getTime()) && date <= now;
  const registered = users.filter((user) => validDate(user.createdAt));
  const validSessions = sessions.filter((session) =>
    validDate(session.createdAt),
  );
  const firstDate = [
    ...registered.map((user) => user.createdAt),
    ...validSessions.map((session) => session.createdAt),
  ].reduce((earliest, date) => (date < earliest ? date : earliest), now);
  const start = analyticsStart(range, now) ?? dayStart(firstDate);
  const previousStart =
    range === "all" ? null : offsetDay(start, -Number.parseInt(range));
  const selected = validSessions.filter(
    (session) => session.createdAt >= start,
  );
  const completed = selected.filter(
    (session) =>
      session.status === "completed" &&
      Number.isFinite(session.duration) &&
      session.duration > 0,
  );
  const minutes = completed.reduce((sum, session) => sum + session.duration, 0);
  const activeIds = new Set(completed.map((session) => session.userId));
  const newUsers = registered.filter((user) => user.createdAt >= start).length;
  const growth = (current: number, previous: number) =>
    previousStart && previous > 0
      ? Math.round(((current - previous) / previous) * 100)
      : null;
  const previousUsers = registered.filter(
    (user) =>
      previousStart &&
      user.createdAt >= previousStart &&
      user.createdAt < start,
  ).length;
  const previousSessions = validSessions.filter(
    (session) =>
      previousStart &&
      session.createdAt >= previousStart &&
      session.createdAt < start,
  ).length;
  const allCompleted = validSessions.filter(
    (session) =>
      session.status === "completed" &&
      Number.isFinite(session.duration) &&
      session.duration > 0,
  );
  const activeBetween = (from: Date, to: Date) =>
    new Set(
      allCompleted
        .filter(
          (session) => session.createdAt >= from && session.createdAt < to,
        )
        .map((session) => session.userId),
    ).size;
  const tomorrow = offsetDay(now, 1);
  const dailyActive = Array.from({ length: 7 }, (_, index) =>
    activeBetween(offsetDay(now, index - 6), offsetDay(now, index - 5)),
  );
  const weeklyActive = Array.from({ length: 4 }, (_, index) =>
    activeBetween(
      offsetDay(tomorrow, (index - 4) * 7),
      offsetDay(tomorrow, (index - 3) * 7),
    ),
  );
  const typeCounts = new Map<string, number>();
  completed.forEach((session) =>
    typeCounts.set(
      session.typeName || "Other",
      (typeCounts.get(session.typeName || "Other") || 0) + 1,
    ),
  );
  const popularTypes = Array.from(typeCounts, ([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / Math.max(completed.length, 1)) * 100),
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const userGrowth: { date: string; count: number }[] = [];
  const sessionGrowth: { date: string; count: number }[] = [];
  const userDates = registered
    .map((user) => user.createdAt.getTime())
    .sort((a, b) => a - b);
  const sessionCounts = new Map<string, number>();
  selected.forEach((session) => {
    const key = dateKey(session.createdAt);
    sessionCounts.set(key, (sessionCounts.get(key) || 0) + 1);
  });
  let userIndex = 0;
  for (let date = start; date <= now; date = offsetDay(date, 1)) {
    const next = offsetDay(date, 1).getTime();
    while (userIndex < userDates.length && userDates[userIndex] < next)
      userIndex++;
    userGrowth.push({ date: dateKey(date), count: userIndex });
    sessionGrowth.push({
      date: dateKey(date),
      count: sessionCounts.get(dateKey(date)) || 0,
    });
  }
  const userById = new Map(users.map((user) => [user.id, user]));
  const stats = new Map<
    string,
    { sessionCount: number; totalMinutes: number; types: Map<string, number> }
  >();
  completed.forEach((session) => {
    const entry = stats.get(session.userId) || {
      sessionCount: 0,
      totalMinutes: 0,
      types: new Map<string, number>(),
    };
    entry.sessionCount++;
    entry.totalMinutes += session.duration;
    entry.types.set(
      session.typeName,
      (entry.types.get(session.typeName) || 0) + 1,
    );
    stats.set(session.userId, entry);
  });
  const topUsers = Array.from(stats, ([id, stat]) => ({
    user: userById.get(id)!,
    sessionCount: stat.sessionCount,
    totalMinutes: stat.totalMinutes,
    meditationTypes: Array.from(stat.types, ([type, count]) => ({
      type,
      count,
    }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
  }))
    .filter((item) => item.user)
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 20);
  const withProgress = users.filter(
    (user) =>
      user.pathProgress &&
      user.pathProgress.currentStage >= 1 &&
      user.pathProgress.currentStage <= 8,
  );
  return {
    users: {
      total: users.length,
      active: activeIds.size,
      new: newUsers,
      growth: growth(newUsers, previousUsers),
    },
    sessions: {
      total: selected.length,
      completed: completed.length,
      average: completed.length ? Math.round(minutes / completed.length) : 0,
      growth: growth(selected.length, previousSessions),
    },
    engagement: {
      dailyActive,
      weeklyActive,
      monthlyActive: activeBetween(offsetDay(now, -29), tomorrow),
      participationRate: users.length
        ? Math.round(
            ([...activeIds].filter((id) => userById.has(id)).length /
              users.length) *
              100,
          )
        : 0,
    },
    meditation: {
      totalMinutes: minutes,
      averageSession: completed.length
        ? Math.round(minutes / completed.length)
        : 0,
      popularTypes,
    },
    trends: { userGrowth, sessionGrowth },
    pathProgress: withProgress.length
      ? {
          totalWithProgress: withProgress.length,
          byStage: Array.from({ length: 8 }, (_, i) => {
            const count = withProgress.filter(
              (user) => user.pathProgress?.currentStage === i + 1,
            ).length;
            return {
              stage: i + 1,
              count,
              percentage: Math.round((count / withProgress.length) * 100),
            };
          }),
        }
      : undefined,
    topUsers,
  };
}
