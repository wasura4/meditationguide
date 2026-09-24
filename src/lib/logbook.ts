import type { MeditationSession } from "@/types";

export type LogbookFilters = {
  search: string;
  type: string;
  status: string;
  mood: string;
  rating: string;
  period: "all" | "today" | "7" | "30" | "custom";
  from: string;
  to: string;
};
export const EMPTY_LOGBOOK_FILTERS: LogbookFilters = {
  search: "",
  type: "all",
  status: "all",
  mood: "all",
  rating: "all",
  period: "all",
  from: "",
  to: "",
};
export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseLocalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return localDateKey(date) === value ? date : null;
}
export function validDateRange(filters: LogbookFilters): boolean {
  if (filters.period !== "custom") return true;
  const start = parseLocalDate(filters.from);
  const end = parseLocalDate(filters.to);
  return !!start && !!end && start <= end;
}
export function filterLogbook(
  sessions: MeditationSession[],
  filters: LogbookFilters,
  now: Date,
) {
  if (!validDateRange(filters)) return [];
  let start: Date | null = null;
  let end: Date | null = null;
  if (filters.period !== "all") {
    if (filters.period === "custom") {
      start = parseLocalDate(filters.from)!;
      end = parseLocalDate(filters.to)!;
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      start.setDate(
        start.getDate() -
          (filters.period === "7" ? 6 : filters.period === "30" ? 29 : 0),
      );
    }
    // Exclusive next local midnight includes the whole last day across DST.
    end.setDate(end.getDate() + 1);
  }
  const query = filters.search.trim().toLocaleLowerCase();
  return sessions
    .filter((session) => {
      if (Number.isNaN(session.createdAt.getTime())) return false;
      if (
        (start && session.createdAt < start) ||
        (end && session.createdAt >= end)
      )
        return false;
      if (filters.type !== "all" && session.typeId !== filters.type)
        return false;
      if (filters.status !== "all" && session.status !== filters.status)
        return false;
      if (filters.mood !== "all" && session.mood !== filters.mood) return false;
      if (filters.rating !== "all" && session.rating !== Number(filters.rating))
        return false;
      return (
        !query ||
        [
          session.typeName,
          session.notes,
          ...(session.insights || []),
          ...(session.distractions || []),
          ...(session.tags || []),
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query)
      );
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
export function logbookSummary(sessions: MeditationSession[]) {
  const completed = sessions.filter(
    (session) =>
      session.status === "completed" &&
      Number.isFinite(session.duration) &&
      session.duration > 0,
  );
  return {
    completed: completed.length,
    minutes: completed.reduce((sum, session) => sum + session.duration, 0),
    days: new Set(completed.map((session) => localDateKey(session.createdAt)))
      .size,
  };
}
