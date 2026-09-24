"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  CalendarDays,
  List,
  SlidersHorizontal,
  RefreshCw,
  Flower2,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppPage } from "@/components/app/AppPage";
import { useAuth } from "@/contexts/AuthContext";
import { MeditationService } from "@/lib/meditationService";
import type { MeditationSession } from "@/types";
import {
  EMPTY_LOGBOOK_FILTERS,
  filterLogbook,
  localDateKey,
  logbookSummary,
  validDateRange,
  type LogbookFilters,
} from "@/lib/logbook";
import { MeditationCalendar } from "@/components/logbook/MeditationCalendar";
import { DateSessions } from "@/components/logbook/DateSessions";
import { SessionDetails } from "@/components/logbook/SessionDetails";
import { useLogbookFormat } from "@/components/logbook/useLogbookFormat";

function Logbook({ userId }: { userId: string }) {
  const { t, date, month: formatMonth, number } = useLogbookFormat();
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState<LogbookFilters>({
    ...EMPTY_LOGBOOK_FILTERS,
  });
  const [view, setView] = useState<"list" | "calendar">("list");
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    MeditationService.getAllUserSessions(userId)
      .then((result) => {
        if (!cancelled) {
          setSessions(result);
          setNow(new Date());
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);
  useEffect(() => {
    const updateDate = () => setNow(new Date());
    const timer = window.setInterval(updateDate, 60_000);
    document.addEventListener("visibilitychange", updateDate);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", updateDate);
    };
  }, []);
  const filtered = useMemo(
    () => filterLogbook(sessions, filters, now),
    [sessions, filters, now],
  );
  const shown = useMemo(
    () =>
      view === "list"
        ? filtered
        : filtered.filter((session) =>
            selectedDate
              ? localDateKey(session.createdAt) === localDateKey(selectedDate)
              : session.createdAt.getFullYear() === month.getFullYear() &&
                session.createdAt.getMonth() === month.getMonth(),
          ),
    [view, filtered, selectedDate, month],
  );
  const summary = useMemo(() => logbookSummary(shown), [shown]);
  const types = useMemo(
    () =>
      Array.from(
        new Map(
          sessions.map((session) => [session.typeId, session.typeName]),
        ).entries(),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [sessions],
  );
  const openSession = sessions.find((session) => session.id === openId);
  const hasFilters = Object.entries(filters).some(
    ([key, value]) =>
      value !== EMPTY_LOGBOOK_FILTERS[key as keyof LogbookFilters],
  );
  const validRange = validDateRange(filters);
  const input =
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-sm";
  function change<K extends keyof LogbookFilters>(
    key: K,
    value: LogbookFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
    setVisibleCount(20);
    setNotice(false);
  }
  function reset() {
    setFilters({ ...EMPTY_LOGBOOK_FILTERS });
    setSelectedDate(null);
    setVisibleCount(20);
  }
  function selectMonth(value: Date) {
    setMonth(value);
    setSelectedDate(null);
    setVisibleCount(20);
  }
  function jumpToDate(value: Date) {
    setMonth(new Date(value.getFullYear(), value.getMonth(), 1));
    setSelectedDate(value);
    setVisibleCount(20);
  }
  async function saveNote(id: string, notes: string) {
    await MeditationService.updateSession(id, { notes });
    setSessions((current) =>
      current.map((session) =>
        session.id === id
          ? { ...session, notes, updatedAt: new Date() }
          : session,
      ),
    );
  }
  async function deleteSession(id: string) {
    await MeditationService.deleteSession(id);
    setOpenId(null);
    setSessions((current) => current.filter((session) => session.id !== id));
    setNotice(true);
  }
  return (
    <AppPage
      title={t("logbook.title")}
      subtitle={t("journal.subtitle")}
      backHref="/analytics"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div
            className="grid flex-1 grid-cols-2 rounded-2xl bg-muted/60 p-1 sm:max-w-xs"
            role="group"
            aria-label={t("journal.view")}
          >
            {[
              { value: "list", label: t("journal.list"), icon: List },
              {
                value: "calendar",
                label: t("journal.calendar"),
                icon: CalendarDays,
              },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                aria-pressed={view === value}
                onClick={() => {
                  setView(value as "list" | "calendar");
                  setVisibleCount(20);
                }}
                className={`app-segment flex min-h-11 items-center justify-center gap-2 rounded-xl border px-2 text-sm ${view === value ? 'border-primary/50' : 'border-transparent text-muted-foreground'}`}
              >
                <Icon size={17} className="shrink-0" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setNotice(false);
              setAttempt((value) => value + 1);
            }}
            disabled={loading}
            aria-label={t("journal.refresh")}
            className="app-icon-button shrink-0 disabled:opacity-40"
          >
            <RefreshCw size={19} aria-hidden="true" />
          </button>
        </div>

        <div className="app-card space-y-4 p-4 sm:p-5">
          <div className="relative">
            <Search
              size={18}
              aria-hidden="true"
              className="absolute left-3 top-4 text-muted-foreground"
            />
            <input
              type="search"
              aria-label={t("journal.search")}
              placeholder={t("journal.search")}
              value={filters.search}
              onChange={(event) => change("search", event.target.value)}
              className={`${input} pl-10`}
            />
          </div>
          <details>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={17} aria-hidden="true" />
                {t("journal.filters")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t(
                  hasFilters ? "journal.filters_active" : "journal.all_history",
                )}
              </span>
            </summary>
            <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="min-w-0 text-xs text-muted-foreground">
                {t("journal.period")}
                <select
                  className={`${input} mt-2 text-foreground`}
                  value={filters.period}
                  onChange={(event) =>
                    change(
                      "period",
                      event.target.value as LogbookFilters["period"],
                    )
                  }
                >
                  {(["all", "today", "7", "30", "custom"] as const).map(
                    (value) => (
                      <option key={value} value={value}>
                        {t(`journal.period_${value}`)}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="min-w-0 text-xs text-muted-foreground">
                {t("logbook.session_details.type")}
                <select
                  className={`${input} mt-2 text-foreground`}
                  value={filters.type}
                  onChange={(event) => change("type", event.target.value)}
                >
                  <option value="all">{t("common.all")}</option>
                  {types.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="min-w-0 text-xs text-muted-foreground">
                {t("journal.status")}
                <select
                  className={`${input} mt-2 text-foreground`}
                  value={filters.status}
                  onChange={(event) => change("status", event.target.value)}
                >
                  <option value="all">{t("common.all")}</option>
                  {["completed", "abandoned", "active", "paused"].map(
                    (value) => (
                      <option key={value} value={value}>
                        {t(`journal.status_${value}`)}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="min-w-0 text-xs text-muted-foreground">
                {t("journal.mood")}
                <select
                  className={`${input} mt-2 text-foreground`}
                  value={filters.mood}
                  onChange={(event) => change("mood", event.target.value)}
                >
                  <option value="all">{t("common.all")}</option>
                  {[
                    "excellent",
                    "good",
                    "neutral",
                    "challenging",
                    "difficult",
                  ].map((value) => (
                    <option key={value} value={value}>
                      {t(`journal.mood_${value}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="min-w-0 text-xs text-muted-foreground">
                {t("journal.rating")}
                <select
                  className={`${input} mt-2 text-foreground`}
                  value={filters.rating}
                  onChange={(event) => change("rating", event.target.value)}
                >
                  <option value="all">{t("common.all")}</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value} / 5
                    </option>
                  ))}
                </select>
              </label>
              {filters.period === "custom" && (
                <>
                  <label className="min-w-0 text-xs text-muted-foreground">
                    {t("journal.from")}
                    <input
                      type="date"
                      className={`${input} mt-2 text-foreground`}
                      value={filters.from}
                      max={filters.to || undefined}
                      onChange={(event) => change("from", event.target.value)}
                      aria-invalid={!validRange}
                    />
                  </label>
                  <label className="min-w-0 text-xs text-muted-foreground">
                    {t("journal.to")}
                    <input
                      type="date"
                      className={`${input} mt-2 text-foreground`}
                      value={filters.to}
                      min={filters.from || undefined}
                      onChange={(event) => change("to", event.target.value)}
                      aria-invalid={!validRange}
                    />
                  </label>
                </>
              )}
            </div>
          </details>
          {hasFilters && (
            <button
              onClick={reset}
              className="min-h-11 text-sm font-medium underline"
            >
              {t("journal.clear_filters")}
            </button>
          )}
          {!validRange && (
            <p role="alert" className="text-sm">
              {t("journal.invalid_range")}
            </p>
          )}
        </div>

        {loading ? (
          <div
            className="app-card p-8 text-center text-sm text-muted-foreground"
            role="status"
          >
            {t("common.loading")}
          </div>
        ) : error ? (
          <div className="app-card p-6" role="alert">
            <h2 className="font-semibold">{t("journal.load_error")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("journal.load_error_help")}
            </p>
            <button
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-3 min-h-11 text-sm font-semibold underline"
            >
              {t("common.retry")}
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="app-card space-y-3 p-8 text-center">
            <Flower2
              className="mx-auto text-primary"
              size={36}
              aria-hidden="true"
            />
            <h2 className="font-semibold">
              {t("logbook.empty_states.no_sessions_title")}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("logbook.empty_states.no_sessions_message")}
            </p>
            <Link
              href="/meditate"
              className="inline-flex min-h-12 items-center rounded-xl bg-primary/15 px-4 text-sm font-semibold"
            >
              {t("logbook.empty_states.start_meditating")}
            </Link>
          </div>
        ) : (
          <>
            {view === "calendar" && (
              <MeditationCalendar
                sessions={filtered}
                month={month}
                selectedDate={selectedDate}
                onMonthChange={selectMonth}
                onDateSelect={(value) => {
                  setSelectedDate(value);
                  setVisibleCount(20);
                }}
                onToday={() => jumpToDate(new Date())}
                onLatest={() => {
                  if (filtered[0]) jumpToDate(filtered[0].createdAt);
                }}
              />
            )}
            {validRange && (
              <>
                <section
                  aria-labelledby="logbook-summary"
                  className="app-card p-4 sm:p-5"
                >
                  <h2 id="logbook-summary" className="text-sm font-semibold">
                    {view === "calendar"
                      ? selectedDate
                        ? date(selectedDate)
                        : formatMonth(month)
                      : t(
                          hasFilters
                            ? "journal.filtered_summary"
                            : "journal.your_journey",
                        )}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t("journal.summary_help")}
                  </p>
                  <dl className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      [t("journal.completed"), summary.completed],
                      [t("journal.minutes"), summary.minutes],
                      [t("journal.practice_days"), summary.days],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col">
                        <dt className="order-2 mt-2 text-xs leading-relaxed text-muted-foreground">
                          {label}
                        </dt>
                        <dd className="order-1 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                          {number(Number(value))}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="app-section-title">
                    {t("journal.entries", { count: shown.length })}
                  </h2>
                  {view === "calendar" && selectedDate && (
                    <button
                      className="min-h-11 text-sm font-medium underline"
                      onClick={() => {
                        setSelectedDate(null);
                        setVisibleCount(20);
                      }}
                    >
                      {t("journal.whole_month")}
                    </button>
                  )}
                </div>
                {notice && (
                  <p role="status" className="text-sm">
                    {t("journal.deleted")}
                  </p>
                )}
                {shown.length ? (
                  <>
                    <DateSessions
                      sessions={shown.slice(0, visibleCount)}
                      onOpen={(session) => setOpenId(session.id)}
                    />
                    <p
                      className="text-center text-xs text-muted-foreground"
                      role="status"
                    >
                      {t("journal.showing", {
                        shown: Math.min(visibleCount, shown.length),
                        total: shown.length,
                      })}
                    </p>
                    {shown.length > visibleCount && (
                      <button
                        onClick={() => setVisibleCount((value) => value + 20)}
                        className="app-card min-h-12 w-full px-4 py-3 text-sm font-semibold"
                      >
                        {t("journal.load_more")}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="app-card space-y-3 p-7 text-center">
                    <Flower2
                      size={28}
                      className="mx-auto text-muted-foreground"
                      aria-hidden="true"
                    />
                    <h3 className="font-semibold">{t("journal.no_matches")}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(
                        view === "calendar"
                          ? "journal.empty_calendar"
                          : "journal.empty_filter",
                      )}
                    </p>
                    {hasFilters && (
                      <button
                        onClick={reset}
                        className="min-h-11 text-sm font-semibold underline"
                      >
                        {t("journal.clear_filters")}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      {openSession && (
        <SessionDetails
          key={openSession.id}
          session={openSession}
          onClose={() => setOpenId(null)}
          onSaveNote={saveNote}
          onDelete={deleteSession}
        />
      )}
    </AppPage>
  );
}
export default function LogbookPage() {
  const { user } = useAuth();
  return (
    <ProtectedRoute>
      {user && <Logbook key={user.id} userId={user.id} />}
    </ProtectedRoute>
  );
}
