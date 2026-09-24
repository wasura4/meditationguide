"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Flower2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MeditationService } from "@/lib/meditationService";
import { practiceWindowStart, summarizePractice } from "@/lib/practiceActivity";

type Activity = ReturnType<typeof summarizePractice>;

export function PracticeActivity({ userId }: { userId: string }) {
  const { t, language } = useLanguage();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let request = 0;
    let lastDay = "";
    setActivity(null);
    async function refresh() {
      const currentRequest = ++request;
      const now = new Date();
      lastDay = now.toDateString();
      setError(false);
      try {
        const sessions = await MeditationService.getSessionsByDateRange(
          userId,
          practiceWindowStart(now),
          now,
        );
        if (!cancelled && currentRequest === request)
          setActivity(summarizePractice(sessions, now));
      } catch {
        if (!cancelled && currentRequest === request) setError(true);
      }
    }
    function onVisible() {
      if (document.visibilityState === "visible") void refresh();
    }
    void refresh();
    // Refresh on return from background and across midnight in a long-lived WebView.
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => {
      if (new Date().toDateString() !== lastDay) onVisible();
    }, 60_000);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [userId, attempt]);

  const locale = language === "si" ? "si-LK" : "en-GB";
  const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return (
    <section
      className="app-card overflow-hidden p-5 sm:p-6"
      aria-labelledby="activity-title"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 id="activity-title" className="app-section-title">
            {t("activity.title")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("activity.period")}
          </p>
        </div>
        <Link
          href="/analytics"
          aria-label={t("activity.details")}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-primary/10"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </Link>
      </div>
      {error ? (
        <div role="alert" className="py-4 text-sm">
          <p>{t("activity.error")}</p>
          <button
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-2 min-h-11 font-semibold underline"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : !activity ? (
        <p role="status" className="py-12 text-sm text-muted-foreground">
          {t("common.loading")}
        </p>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4 min-[360px]:flex-row min-[360px]:gap-5 sm:gap-8">
            <div
              className="relative h-28 w-28 shrink-0 sm:h-36 sm:w-36"
              role="img"
              aria-label={t("activity.days_summary", {
                count: activity.activeDays,
              })}
            >
              <svg
                viewBox="0 0 120 120"
                className="h-full w-full -rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="51"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  className="text-primary/15"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="51"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  pathLength="100"
                  strokeDasharray={`${(activity.activeDays / 7) * 100} 100`}
                  strokeLinecap={activity.activeDays ? "round" : "butt"}
                  className="text-primary"
                />
              </svg>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
                  {activity.activeDays}
                  <span className="text-base text-muted-foreground"> / 7</span>
                </span>
                <Flower2 size={19} className="mt-1 text-primary" />
              </div>
            </div>
            <div className="min-w-0 text-center min-[360px]:text-left">
              <p className="text-sm font-semibold">
                {t("activity.active_days")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(
                  activity.todayMinutes > 0
                    ? "activity.done_today"
                    : activity.activeDays > 0
                      ? "activity.keep_going"
                      : "activity.begin",
                )}
              </p>
            </div>
          </div>
          <dl className="my-6 grid grid-cols-3 gap-3 border-y border-border/60 py-4">
            {[
              [t("activity.today_minutes"), activity.todayMinutes],
              [t("activity.total_minutes"), activity.totalMinutes],
              [t("activity.sessions"), activity.totalSessions],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dd className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                  {number.format(Number(value))}
                </dd>
                <dt className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
          <ol
            className="grid grid-cols-7 gap-1"
            aria-label={t("activity.daily_activity")}
          >
            {activity.days.map((day, index) => (
              <li
                key={day.date.getTime()}
                className="flex flex-col items-center gap-2"
                aria-current={index === 6 ? "date" : undefined}
                aria-label={`${t(`activity.${weekdays[day.date.getDay()]}`)} ${day.date.toLocaleDateString(locale, { year: "numeric", month: "numeric", day: "numeric" })}: ${t("activity.day_summary", { count: day.sessions, minutes: number.format(day.minutes) })}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10 ${day.sessions ? "bg-primary text-primary-foreground" : "bg-primary/10 text-muted-foreground"} ${index === 6 ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                >
                  {day.sessions ? (
                    <Check size={17} strokeWidth={2.5} />
                  ) : (
                    <span className="text-xs tabular-nums">
                      {day.date.getDate()}
                    </span>
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className={`text-[10px] leading-relaxed sm:text-xs ${index === 6 ? "font-semibold" : "text-muted-foreground"}`}
                >
                  {t(`activity.${weekdays[day.date.getDay()]}`)}
                </span>
              </li>
            ))}
          </ol>
          <Link
            href="/meditate"
            className="mt-5 flex min-h-11 items-center justify-between gap-3 border-t border-border/60 pt-4 text-sm font-semibold"
          >
            {t(
              activity.todayMinutes > 0
                ? "activity.practice_again"
                : "activity.practice_today",
            )}
            <ChevronRight size={17} className="shrink-0" aria-hidden="true" />
          </Link>
        </>
      )}
    </section>
  );
}
