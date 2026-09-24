"use client";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MeditationSession } from "@/types";
import { localDateKey } from "@/lib/logbook";
import { useLogbookFormat } from "./useLogbookFormat";

export function MeditationCalendar({
  sessions,
  selectedDate,
  month,
  onDateSelect,
  onMonthChange,
  onToday,
  onLatest,
}: {
  sessions: MeditationSession[];
  selectedDate: Date | null;
  month: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onToday: () => void;
  onLatest: () => void;
}) {
  const { date: formatDate, month: formatMonth, t } = useLogbookFormat();
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((session) => {
      const key = localDateKey(session.createdAt);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [sessions]);
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells = Math.ceil((first.getDay() + count) / 7) * 7;
  const today = localDateKey(new Date());
  const selected = selectedDate ? localDateKey(selectedDate) : "";
  return (
    <section
      className="app-card p-3 sm:p-5"
      aria-label={t("logbook.calendar.title")}
    >
      <div className="mb-3 flex items-center justify-between gap-1">
        <button
          className="app-icon-button shrink-0"
          aria-label={t("journal.previous_month")}
          onClick={() =>
            onMonthChange(
              new Date(month.getFullYear(), month.getMonth() - 1, 1),
            )
          }
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h2
          aria-live="polite"
          className="text-center text-sm font-semibold sm:text-lg"
        >
          {formatMonth(month)}
        </h2>
        <button
          className="app-icon-button shrink-0"
          aria-label={t("journal.next_month")}
          onClick={() =>
            onMonthChange(
              new Date(month.getFullYear(), month.getMonth() + 1, 1),
            )
          }
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="mb-3 flex flex-wrap justify-center gap-2">
        <button
          className="min-h-11 rounded-xl bg-primary/10 px-3 text-xs font-medium"
          onClick={onToday}
        >
          {t("common.today")}
        </button>
        <button
          disabled={!sessions.length}
          className="min-h-11 rounded-xl px-3 text-xs font-medium disabled:opacity-40"
          onClick={onLatest}
        >
          {t("journal.latest_practice")}
        </button>
      </div>
      <div className="grid grid-cols-7" aria-hidden="true">
        {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((day) => (
          <span
            key={day}
            className="py-2 text-center text-[10px] text-muted-foreground sm:text-xs"
          >
            {t(`activity.${day}`)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: cells }, (_, index) => {
          const day = index - first.getDay() + 1;
          if (day < 1 || day > count) return <span key={index} />;
          const value = new Date(month.getFullYear(), month.getMonth(), day);
          const key = localDateKey(value);
          const total = counts.get(key) || 0;
          return (
            <button
              key={index}
              onClick={() => onDateSelect(value)}
              aria-pressed={key === selected}
              aria-current={key === today ? "date" : undefined}
              aria-label={t("journal.calendar_day", {
                date: formatDate(value),
                count: total,
              })}
              className={`flex min-h-11 min-w-0 flex-col items-center justify-center rounded-xl py-1 text-sm ${key === selected ? "bg-primary text-primary-foreground" : key === today ? "bg-primary/10 font-semibold ring-1 ring-inset ring-primary" : "hover:bg-primary/10"}`}
            >
              <span aria-hidden="true">{day}</span>
              <span
                aria-hidden="true"
                className={`mt-1 h-1 w-1 rounded-full ${total ? (key === selected ? "bg-primary-foreground" : "bg-primary") : "bg-transparent"}`}
              />
            </button>
          );
        })}
      </div>
      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span
          className="h-1.5 w-1.5 rounded-full bg-primary"
          aria-hidden="true"
        />
        {t("journal.calendar_legend")}
      </p>
    </section>
  );
}
