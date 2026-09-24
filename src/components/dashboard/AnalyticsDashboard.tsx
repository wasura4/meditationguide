"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flower2,
  RefreshCw,
  Route,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { MeditationService } from "@/lib/meditationService";
import type { MeditationSession } from "@/types";
import { dailyPracticeGoal } from "@/lib/dashboardPractice";
import {
  practiceDate,
  progressInsights,
  progressTrend,
  type ProgressRange,
} from "@/lib/progressInsights";
import { localDateKey } from "@/lib/logbook";
import { useLogbookFormat } from "@/components/logbook/useLogbookFormat";

const weekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const panel = "app-card p-5 sm:p-6";

function PracticeCalendar({
  sessions,
  now,
}: {
  sessions: MeditationSession[];
  now: Date;
}) {
  const { t, date, month: monthLabel, number, time } = useLogbookFormat();
  const [month, setMonth] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [selected, setSelected] = useState(() => localDateKey(now));
  const byDay = useMemo(() => {
    const map = new Map<string, MeditationSession[]>();
    for (const s of sessions) {
      const key = localDateKey(practiceDate(s));
      map.set(key, [...(map.get(key) || []), s]);
    }
    return map;
  }, [sessions]);
  const offset = (month.getDay() + 6) % 7;
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const today = localDateKey(now);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const oldest = sessions.at(-1) ? practiceDate(sessions.at(-1)!) : now;
  const earliestMonth = new Date(oldest.getFullYear(), oldest.getMonth(), 1);
  const selectedSessions = byDay.get(selected) || [];
  function move(amount: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + amount, 1);
    setMonth(next);
    setSelected(localDateKey(next));
  }
  return (
    <section className={panel} aria-labelledby="progress-calendar-title">
      <div className="flex items-center gap-2">
        <CalendarDays size={19} className="text-primary" aria-hidden="true" />
        <h2 id="progress-calendar-title" className="text-lg font-semibold">
          {t("progress.calendar")}
        </h2>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {t("progress.calendar_help")}
      </p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          onClick={() => move(-1)}
          disabled={month <= earliestMonth}
          aria-label={t("journal.previous_month")}
          className="app-icon-button disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-center text-sm font-semibold" aria-live="polite">
          {monthLabel(month)}
        </h3>
        <button
          onClick={() => move(1)}
          disabled={month >= currentMonth}
          aria-label={t("journal.next_month")}
          className="app-icon-button disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {weekdays.map((day) => (
          <span key={day} className="py-2 text-[11px] text-muted-foreground">
            {t(`activity.${day}`)}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`gap-${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const day = new Date(month.getFullYear(), month.getMonth(), i + 1),
            key = localDateKey(day),
            entries = byDay.get(key) || [];
          const completed = entries.filter((s) => s.status === "completed"),
            minutes = completed.reduce((sum, s) => sum + s.duration, 0);
          return (
            <button
              key={key}
              disabled={key > today}
              aria-pressed={selected === key}
              aria-current={key === today ? "date" : undefined}
              aria-label={t("progress.calendar_day", {
                date: date(day),
                count: entries.length,
                minutes: number(minutes),
              })}
              onClick={() => setSelected(key)}
              className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border text-sm tabular-nums disabled:opacity-25 ${selected === key ? "border-primary bg-primary/20 font-semibold" : completed.length ? "border-transparent bg-primary/10" : "border-transparent"} ${key === today ? "font-bold underline underline-offset-4" : ""}`}
            >
              {i + 1}
              <span
                aria-hidden="true"
                className={`h-1 w-1 rounded-full ${entries.length ? "bg-foreground" : "bg-transparent"}`}
              />
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {t("progress.calendar_legend")}
      </p>
      <div className="mt-5 border-t border-border pt-4" aria-live="polite">
        <h3 className="text-sm font-semibold">
          {date(new Date(`${selected}T12:00:00`))}
        </h3>
        {!selectedSessions.length ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("progress.day_empty")}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {selectedSessions.map((s) => (
              <li key={s.id} className="py-3">
                <details>
                  <summary className="cursor-pointer text-sm">
                    <span className="font-medium">{s.typeName}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {time(practiceDate(s))} ·{" "}
                      {t("interface.minutes", { count: number(s.duration) })} ·{" "}
                      {t(`journal.status_${s.status}`)}
                    </span>
                  </summary>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                    {s.notes || t("journal.no_reflection")}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/logbook"
          className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium"
        >
          {t("progress.open_journal")}
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

export function AnalyticsDashboard() {
  const { user } = useAuth();
  return user ? <ProgressContent key={user.id} userId={user.id} /> : null;
}
function ProgressContent({ userId }: { userId: string }) {
  const { user } = useAuth();
  const { t, date, number } = useLogbookFormat();
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [range, setRange] = useState<ProgressRange>("30");
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let disposed = false,
      request = 0,
      lastDay = "";
    async function refresh() {
      const id = ++request;
      setLoading(true);
      try {
        const result = await MeditationService.getAllUserSessions(userId);
        if (disposed || id !== request) return;
        const time = new Date();
        lastDay = localDateKey(time);
        setSessions(result);
        setNow(time);
        setError(false);
      } catch {
        if (!disposed && id === request) setError(true);
      } finally {
        if (!disposed && id === request) setLoading(false);
      }
    }
    const visible = () => {
      if (!document.hidden) void refresh();
    };
    void refresh();
    document.addEventListener("visibilitychange", visible);
    const timer = window.setInterval(() => {
      if (lastDay && lastDay !== localDateKey(new Date())) visible();
    }, 60000);
    return () => {
      disposed = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [userId, attempt]);
  const data = useMemo(
    () => progressInsights(sessions, range, now),
    [sessions, range, now],
  );
  const trend = useMemo(
    () => progressTrend(data.current, range, now),
    [data, range, now],
  );
  const goal = dailyPracticeGoal(user?.preferences.dailyGoalMinutes);
  const remaining = Math.max(0, goal - data.lifetime.todayMinutes);
  const percentage = Math.min(
    100,
    Math.round((data.lifetime.todayMinutes / goal) * 100),
  );
  const delta = data.summary.minutes - data.previous.minutes;
  const maxMinutes = Math.max(1, ...trend.map((b) => b.minutes));
  if (loading)
    return (
      <div role="status" className={`${panel} space-y-4`}>
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        <div
          aria-hidden="true"
          className="h-32 animate-pulse rounded-2xl bg-muted"
        />
      </div>
    );
  if (error)
    return (
      <div role="alert" className={panel}>
        <h2 className="font-semibold">{t("journal.load_error")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("journal.load_error_help")}
        </p>
        <button
          onClick={() => setAttempt((a) => a + 1)}
          className="home-primary mt-4 min-h-11 rounded-full px-5 font-medium"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label={t("journal.period")}
          className="grid flex-1 grid-cols-4 rounded-2xl bg-muted p-1 sm:max-w-md"
        >
          {(["7", "30", "90", "all"] as const).map((value) => (
            <button
              key={value}
              aria-pressed={range === value}
              onClick={() => setRange(value)}
              className={`min-h-11 rounded-xl px-2 text-xs font-medium sm:text-sm ${range === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {t(`progress.range_${value}`)}
            </button>
          ))}
        </div>
        <button
          aria-label={t("journal.refresh")}
          onClick={() => setAttempt((a) => a + 1)}
          className="app-icon-button"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      <section className={panel} aria-labelledby="progress-summary-title">
        <p className="text-xs font-medium text-muted-foreground">
          {data.bounds
            ? `${date(data.bounds.start)} – ${date(now)}`
            : t("journal.all_history")}
        </p>
        <h2
          id="progress-summary-title"
          className="mt-2 text-2xl font-semibold leading-snug tracking-tight"
        >
          {t(
            data.summary.days === 1
              ? "progress.summary_one"
              : data.summary.days
                ? "progress.summary"
                : "progress.period_empty",
            {
              count: number(data.summary.days),
            },
          )}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {!data.valid.length
            ? t("progress.first_step")
            : range === "all"
              ? t("progress.lifetime_help")
              : t(
                  delta === 0
                    ? "progress.same"
                    : delta > 0
                      ? "progress.more"
                      : "progress.less",
                  { count: number(Math.abs(delta)) },
                )}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          {[
            ["progress.minutes", number(data.summary.minutes)],
            ["progress.sessions", number(data.summary.sessions)],
            ["progress.days", number(data.summary.days)],
            [
              "progress.typical",
              data.summary.sessions ? number(data.summary.typical) : "—",
            ],
          ].map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs leading-relaxed text-muted-foreground">
                {t(key)}
              </dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <details className="mt-5 text-xs leading-relaxed text-muted-foreground">
          <summary className="cursor-pointer py-2">
            {t("progress.counting")}
          </summary>
          <p className="mt-2">{t("progress.completed_help")}</p>
        </details>
        {range !== "all" && (
          <details className="mt-4 border-t border-border pt-3">
            <summary className="cursor-pointer text-xs font-medium">
              {t("progress.comparison")}
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {date(data.bounds!.previousStart)} –{" "}
              {date(data.bounds!.previousEnd)} · {t("progress.comparison_help")}
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                [
                  "progress.minutes",
                  data.summary.minutes,
                  data.previous.minutes,
                ],
                ["progress.days", data.summary.days, data.previous.days],
                [
                  "progress.sessions",
                  data.summary.sessions,
                  data.previous.sessions,
                ],
              ].map(([key, current, previous]) => (
                <div key={key} className="flex flex-wrap justify-between gap-2">
                  <dt>{t(String(key))}</dt>
                  <dd>
                    {t("progress.compare_values", {
                      current: number(Number(current)),
                      previous: number(Number(previous)),
                    })}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        )}
        {data.summary.earlySessions > 0 && (
          <p className="mt-4 rounded-2xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
            {t("progress.early", {
              count: number(data.summary.earlySessions),
              minutes: number(data.summary.earlyMinutes),
            })}
          </p>
        )}
      </section>
      <section
        className="rounded-3xl border border-primary/25 bg-primary/10 p-5 sm:p-6"
        aria-labelledby="progress-next-title"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("progress.next")}
        </p>
        <h2 id="progress-next-title" className="mt-2 text-xl font-semibold">
          {t(
            remaining === 0
              ? "progress.goal_met"
              : data.lifetime.todayMinutes
                ? "progress.keep_space"
                : "progress.begin_gently",
          )}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t(
            remaining === 0 ? "progress.goal_met_help" : "progress.remaining",
            { count: number(remaining) },
          )}
        </p>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-primary/15"
          role="progressbar"
          aria-label={t("home.daily_goal")}
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {t("progress.today_goal", {
              minutes: number(data.lifetime.todayMinutes),
              goal: number(goal),
            })}
          </span>
          <Link
            href="/dashboard#today-practice-title"
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            {t("progress.edit_goal")}
          </Link>
        </div>
        <Link
          href={remaining === 0 ? "/dhamma" : "/meditate"}
          className="home-primary mt-2 inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold"
        >
          {t(remaining === 0 ? "interface.dhamma_reading" : "practice.begin")}
          <ArrowRight size={17} />
        </Link>
      </section>
      <section className={panel} aria-labelledby="progress-trend-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="progress-trend-title" className="text-lg font-semibold">
            {t("progress.rhythm")}
          </h2>
          <span className="text-xs text-muted-foreground">
            {t(
              range === "all"
                ? "progress.grouped_months"
                : range === "90"
                  ? "progress.grouped_weeks"
                  : "progress.grouped_days",
            )}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("progress.rhythm_help")}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          {t("progress.scale", { count: number(maxMinutes) })}
        </p>
        <div
          className="mt-5 flex h-32 items-end gap-1 rounded-2xl border-b border-border bg-muted/30 px-2 pt-2"
          aria-hidden="true"
        >
          {trend.map((b) => (
            <div
              key={b.start.toISOString()}
              className="flex h-full min-w-0 flex-1 items-end"
            >
              <div
                className="w-full rounded-t-sm bg-primary"
                style={{
                  height: `${(b.minutes / maxMinutes) * 100}%`,
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between gap-4 text-[11px] text-muted-foreground">
          <span>{trend[0] && date(trend[0].start)}</span>
          <span>{date(now)}</span>
        </div>
        <details className="mt-4">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">
            {t("progress.chart_data")}
          </summary>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">{t("progress.rhythm")}</caption>
              <thead>
                <tr>
                  <th scope="col" className="py-2">
                    {t("journal.period")}
                  </th>
                  <th scope="col" className="py-2 text-right">
                    {t("progress.minutes")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {trend.map((b) => (
                  <tr
                    key={b.start.toISOString()}
                    className="border-t border-border"
                  >
                    <th scope="row" className="py-2 font-normal">
                      {date(b.start)}
                      {localDateKey(b.start) !== localDateKey(b.end) &&
                        ` – ${date(b.end)}`}
                    </th>
                    <td className="text-right tabular-nums">
                      {number(b.minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <PracticeCalendar sessions={data.valid} now={now} />
        <div className="space-y-5">
          <section className={panel} aria-labelledby="progress-streak-title">
            <h2 id="progress-streak-title" className="text-lg font-semibold">
              {t("progress.returning")}
            </h2>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("progress.current_streak")}
                </dt>
                <dd className="mt-1 text-3xl font-semibold">
                  {number(data.lifetime.streak)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("progress.longest_streak")}
                </dt>
                <dd className="mt-1 text-3xl font-semibold">
                  {number(data.longest)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {t("progress.streak_help")}
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              {t("progress.gentle")}
            </p>
          </section>
          <section className={panel} aria-labelledby="progress-types-title">
            <div className="flex items-center gap-2">
              <Flower2 size={19} className="text-primary" aria-hidden="true" />
              <h2 id="progress-types-title" className="text-lg font-semibold">
                {t("progress.types")}
              </h2>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("progress.types_help")}
            </p>
            {!data.types.length ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {t("progress.period_empty")}
              </p>
            ) : (
              <ul className="mt-5 space-y-5">
                {data.types.map((type) => (
                  <li key={type.id}>
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="font-medium">{type.name}</span>
                      <span className="shrink-0 tabular-nums">
                        {number((type.minutes / data.summary.minutes) * 100)}%
                      </span>
                    </div>
                    <div
                      className="my-2 h-1.5 overflow-hidden rounded-full bg-primary/10"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(type.minutes / data.summary.minutes) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("progress.type_stats", {
                        count: number(type.sessions),
                        minutes: number(type.minutes),
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      <nav
        aria-label={t("progress.explore")}
        className="grid gap-3 sm:grid-cols-3"
      >
        {[
          ["/logbook", "navigation.logbook", BookOpen],
          ["/learn", "home.learning_paths", Route],
          ["/mypath", "dashboard.quick_actions_labels.my_path", Flower2],
        ].map(([href, key, Icon]) => {
          const Glyph = Icon as typeof BookOpen;
          return (
            <Link
              key={String(href)}
              href={String(href)}
              className="app-card flex min-h-16 items-center gap-3 px-5 py-3 text-sm font-medium"
            >
              <Glyph
                size={20}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="flex-1">{t(String(key))}</span>
              <ChevronRight size={17} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
