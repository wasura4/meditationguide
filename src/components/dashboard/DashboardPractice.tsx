"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Play, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { dailyPracticeGoal, summarizeDashboardPractice } from "@/lib/dashboardPractice";
import type { MeditationSession } from "@/types";

export function DashboardPractice({ sessions, loading, error, retry, now }: {
  sessions: MeditationSession[]; loading: boolean; error: boolean; retry: () => void; now: Date;
}) {
  const { user, updateUserPreferences } = useAuth();
  const { t, language } = useLanguage();
  const goal = dailyPracticeGoal(user?.preferences.dailyGoalMinutes);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(goal));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => { if (!editing) setInput(String(goal)); }, [goal, editing]);
  const stats = summarizeDashboardPractice(sessions, now);
  const ready = !loading && !error;
  const progress = Math.min(100, Math.round(stats.todayMinutes / goal * 100));
  const format = new Intl.NumberFormat(language === "si" ? "si-LK" : "en-GB", { maximumFractionDigits: 1 });
  const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const valid = input.trim() !== "" && Number.isInteger(Number(input)) && Number(input) >= 1 && Number(input) <= 120;
  async function saveGoal(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true); setSaveError(false);
    try { await updateUserPreferences({ dailyGoalMinutes: Number(input) }); setEditing(false); }
    catch { setSaveError(true); }
    finally { setSaving(false); }
  }
  return <div className="space-y-3 sm:space-y-4">
    <section className="home-glass p-5 sm:p-7" aria-labelledby="today-practice-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="today-practice-title" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("home.today_practice")}</h2>
        <button type="button" aria-label={t("home.edit_goal")} aria-expanded={editing} aria-controls="daily-goal-form" onClick={() => setEditing(!editing)} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-primary/10"><SlidersHorizontal size={17} /></button>
      </div>
      <div className="flex items-center justify-between gap-4 pb-5">
        <div className="min-w-0">
          <p className="text-[clamp(2.5rem,10vw,3.8rem)] font-semibold leading-tight tracking-tight tabular-nums">{ready ? format.format(stats.todayMinutes) : "—"} <span className="text-xl font-normal sm:text-2xl">{t("home.min")}</span></p>
          <p className="mt-1 text-sm text-muted-foreground">{t("home.of_goal", { count: goal })}</p>
          {ready && stats.todayMinutes >= goal && <p className="mt-2 text-xs font-medium text-foreground">{t("home.goal_met")}</p>}
        </div>
        <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28" role={ready ? "progressbar" : undefined} aria-label={t("home.daily_goal")} aria-valuenow={ready ? progress : undefined} aria-valuemin={0} aria-valuemax={100}>
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="7" className="text-primary/20" />
            <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="7" pathLength="100" strokeDasharray={`${ready ? progress : 0} 100`} strokeLinecap={progress && ready ? "round" : "butt"} className="text-primary" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold tabular-nums" aria-hidden="true">{ready ? `${progress}%` : "—"}</span>
        </div>
      </div>
      {editing && <form id="daily-goal-form" onSubmit={saveGoal} className="mb-5 rounded-2xl border border-border bg-background/90 p-4">
        <label htmlFor="daily-goal" className="text-sm font-medium">{t("home.goal_label")}</label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input id="daily-goal" type="number" min={1} max={120} step={1} inputMode="numeric" value={input} onChange={e => setInput(e.target.value)} aria-invalid={!valid} aria-describedby="goal-help" className="min-h-11 w-24 rounded-xl border border-input bg-background px-3 text-foreground" />
          <button disabled={!valid || saving} className="home-primary rounded-xl px-5 text-sm font-semibold disabled:opacity-50">{t(saving ? "home.saving_goal" : "common.save")}</button>
          <button type="button" disabled={saving} onClick={() => setEditing(false)} className="min-h-11 px-3 text-sm">{t("common.cancel")}</button>
        </div>
        <p id="goal-help" className="mt-2 text-xs text-muted-foreground">{t("home.goal_help")}</p>
        {saveError && <p role="alert" className="mt-2 text-sm text-destructive">{t("home.goal_error")}</p>}
      </form>}
      {loading && <p role="status" className="mb-3 text-sm text-muted-foreground">{t("common.loading")}</p>}
      {error && <div role="alert" className="mb-4 text-sm"><p>{t("activity.error")}</p><button onClick={retry} className="min-h-11 font-semibold underline">{t("common.retry")}</button></div>}
      <Link href="/meditate" className="home-primary flex min-h-13 items-center justify-center gap-2 rounded-full px-4 py-3 text-base font-semibold"><Play size={19} fill="currentColor" aria-hidden="true" />{t("practice.begin")}</Link>
    </section>
    <section className="home-glass p-5 sm:p-6" aria-labelledby="journey-title">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 id="journey-title" className="text-base font-semibold">{t("home.journey")}</h2><Link href="/analytics" aria-label={t("activity.details")} className="-my-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-primary/10"><ChevronRight size={19} /></Link></div>
      <dl className="grid grid-cols-3 divide-x divide-border/70">
        {[["home.total_minutes", stats.totalMinutes], ["home.practice_days", stats.practiceDays], ["home.streak", stats.streak]].map(([label, value]) => <div key={label} className="px-2 text-center"><dd className="text-[clamp(1.4rem,6vw,2rem)] font-semibold tabular-nums">{ready ? format.format(Number(value)) : "—"}</dd><dt className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(String(label))}</dt></div>)}
      </dl>
    </section>
    <section className="home-glass p-5 sm:p-6" aria-labelledby="home-week-title">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2"><h2 id="home-week-title" className="text-base font-semibold">{t("home.this_week")}</h2><p className="text-xs text-muted-foreground">{ready ? t(stats.weekDays === 1 ? "home.day_practised" : "home.days_practised", { count: stats.weekDays }) : "—"}</p></div>
      <ol className="grid grid-cols-7 gap-2" aria-label={t("home.week_activity")}>
        {stats.days.map(day => <li key={day.date.getTime()} aria-current={day.today ? "date" : undefined} className={`flex min-w-0 flex-col items-center gap-2 ${day.future ? "opacity-45" : ""}`} aria-label={`${day.date.toLocaleDateString(language === "si" ? "si-LK" : "en-GB", { weekday: "long", month: "short", day: "numeric" })}: ${ready ? t(day.future ? "home.upcoming" : "activity.day_summary", { count: day.sessions, minutes: format.format(day.minutes) }) : t("common.loading")}`}>
          <span aria-hidden="true" className={`flex aspect-square w-full max-w-11 items-center justify-center rounded-full border-2 ${ready && day.sessions ? "home-primary border-transparent" : "border-primary/45"} ${day.today ? "outline outline-2 outline-offset-4 outline-primary/35" : ""}`}>{ready && day.sessions > 0 && <Check size={19} strokeWidth={2.5} />}</span>
          <span aria-hidden="true" className="text-[11px] text-muted-foreground">{t(`activity.${weekdays[day.date.getDay()]}`)}</span>
        </li>)}
      </ol>
    </section>
  </div>;
}
