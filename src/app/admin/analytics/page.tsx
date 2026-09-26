"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Download,
  Flower2,
  Headphones,
  Info,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminService } from "@/lib/adminService";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { PATH_STAGES } from "@/constants/path";
import type { AdminTimeRange } from "@/lib/adminAnalytics";
import styles from "./analytics.module.css";

type Analytics = Awaited<ReturnType<typeof AdminService.getAdminAnalytics>>;
const number = (n: number) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(n);
const dateLabel = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
const ranges: { value: AdminTimeRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];
function Change({ value }: { value: number | null }) {
  if (value === null)
    return <span className={styles.muted}>No previous baseline</span>;
  const Icon = value < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <span className={value < 0 ? styles.decrease : styles.increase}>
      <Icon size={14} />
      {value > 0 ? "+" : ""}
      {value}% <span className={styles.muted}>vs previous period</span>
    </span>
  );
}
function exportReport(data: Analytics, range: AdminTimeRange) {
  const rows: (string | number)[][] = [
    ["Nirvanaya analytics", range],
    ["Metric", "Value", "Scope"],
    ["Registered users", data.users.total, "Lifetime"],
    ["Active meditators", data.users.active, range],
    ["New members", data.users.new, range],
    ["Sessions", data.sessions.total, range],
    ["Completed sessions", data.sessions.completed, range],
    ["Practice minutes", data.meditation.totalMinutes, range],
    ["Average session minutes", data.sessions.average, range],
    ["Participation percent", data.engagement.participationRate, range],
    ["Audio listens", data.content.totalAudioListens, range],
    ["Article reads", data.content.totalViews, range],
    [],
    ["Date", "Sessions", "Cumulative registrations"],
    ...data.trends.sessionGrowth.map((row, i) => [
      row.date,
      row.count,
      data.trends.userGrowth[i]?.count ?? 0,
    ]),
  ];
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `nirvanaya-analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function AdminAnalyticsPage() {
  const { hasPermission } = useAdminAuth();
  const allowed = hasPermission("analytics", "read");
  const [range, setRange] = useState<AdminTimeRange>("30d");
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);
  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    AdminService.getAdminAnalytics(range)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setUpdated(new Date());
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
  }, [allowed, range, retry]);
  return (
    <AdminLayout currentPage="/admin/analytics">
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              <Activity size={14} /> THE BIGGER PICTURE
            </p>
            <h1>
              Community analytics<span>.</span>
            </h1>
            <p className={styles.subtitle}>
              Understand the people, practices, and moments that move Nirvanaya
              forward.
            </p>
          </div>
          <button
            className={styles.button}
            disabled={!data || loading || error || !allowed}
            onClick={() => data && exportReport(data, range)}
          >
            <Download size={16} /> Export report
          </button>
        </header>
        {!allowed ? (
          <p role="alert">You don&apos;t have permission to view analytics.</p>
        ) : (
          <>
            <div className={styles.toolbar}>
              <div
                className={styles.ranges}
                role="group"
                aria-label="Analytics period"
              >
                {ranges.map((item) => (
                  <button
                    key={item.value}
                    aria-pressed={range === item.value}
                    onClick={() => setRange(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className={styles.freshness}>
                <span>
                  {loading
                    ? "Updating insights…"
                    : error
                      ? "Update failed"
                      : updated
                        ? `Updated ${updated.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}`
                        : ""}
                </span>
                <button
                  className={styles.iconButton}
                  aria-label="Refresh analytics"
                  disabled={loading}
                  onClick={() => setRetry((value) => value + 1)}
                >
                  <RefreshCw size={16} className={loading ? styles.spin : ""} />
                </button>
              </div>
            </div>
            {loading ? (
              <div
                role="status"
                aria-label="Loading analytics"
                className={styles.skeleton}
              >
                <div />
                <div />
                <div />
                <div />
                <section />
              </div>
            ) : error || !data ? (
              <section className={styles.panel} role="alert">
                <h2>We couldn&apos;t load your insights</h2>
                <p className={styles.subtitle}>
                  Check your connection, then try again.
                </p>
                <button
                  className={styles.button}
                  onClick={() => setRetry((value) => value + 1)}
                >
                  <RefreshCw size={16} /> Try again
                </button>
              </section>
            ) : (
              <AnalyticsContent data={data} />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
function AnalyticsContent({ data }: { data: Analytics }) {
  const [metric, setMetric] = useState<"sessions" | "community">("sessions");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"sessions" | "minutes">("sessions");
  const [expanded, setExpanded] = useState(false);
  const [stage, setStage] = useState<number | null>(null);
  const [stageUsers, setStageUsers] = useState<Awaited<
    ReturnType<typeof AdminService.getUsersByStage>
  > | null>(null);
  const [stageLoading, setStageLoading] = useState(false);
  const [stageError, setStageError] = useState(false);
  const { hasPermission } = useAdminAuth();
  const canReadUsers = hasPermission("users", "read");
  useEffect(() => {
    if (stage === null || stageUsers || !canReadUsers) return;
    let cancelled = false;
    setStageLoading(true);
    setStageError(false);
    AdminService.getUsersByStage()
      .then((users) => {
        if (!cancelled) setStageUsers(users);
      })
      .catch(() => {
        if (!cancelled) setStageError(true);
      })
      .finally(() => {
        if (!cancelled) setStageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stage, stageUsers, canReadUsers]);
  const completedPercent = data.sessions.total
    ? Math.round((data.sessions.completed / data.sessions.total) * 100)
    : 0;
  const source =
    metric === "sessions" ? data.trends.sessionGrowth : data.trends.userGrowth;
  const chart = useMemo(() => {
    const size = Math.max(1, Math.ceil(source.length / 90));
    return Array.from({ length: Math.ceil(source.length / size) }, (_, i) => {
      const entries = source.slice(i * size, (i + 1) * size);
      return {
        date: entries[0].date,
        end: entries.at(-1)!.date,
        count:
          metric === "sessions"
            ? entries.reduce((sum, row) => sum + row.count, 0)
            : entries.at(-1)!.count,
      };
    });
  }, [source, metric]);
  const top = data.meditation.popularTypes[0];
  const visibleUsers = data.topUsers
    .filter((item) =>
      `${item.user.displayName} ${item.user.email}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "sessions"
        ? b.sessionCount - a.sessionCount
        : b.totalMinutes - a.totalMinutes,
    );
  const shownUsers = expanded ? visibleUsers : visibleUsers.slice(0, 5);
  const period = source.length
    ? `${dateLabel(source[0].date)}, ${source[0].date.slice(0, 4)} – ${dateLabel(source.at(-1)!.date)}, ${source.at(-1)!.date.slice(0, 4)}`
    : "Selected period";
  return (
    <>
      <div className={styles.metrics}>
        <section className={`${styles.metric} ${styles.featured}`}>
          <div className={styles.metricLabel}>
            Active meditators <Users size={18} />
          </div>
          <strong>{number(data.users.active)}</strong>
          <p>People making time for stillness</p>
          <div className={styles.metricFoot}>
            <span className={styles.dot} />
            {data.engagement.participationRate}% of registered members
          </div>
        </section>
        <section className={styles.metric}>
          <div className={styles.metricLabel}>
            Practice sessions <Flower2 size={18} />
          </div>
          <strong>{number(data.sessions.total)}</strong>
          <p>{number(data.sessions.completed)} completed sessions</p>
          <div className={styles.metricFoot}>
            <Change value={data.sessions.growth} />
          </div>
        </section>
        <section className={styles.metric}>
          <div className={styles.metricLabel}>
            Time in practice <Timer size={18} />
          </div>
          <strong>
            {number(data.meditation.totalMinutes / 60)}
            <small>hrs</small>
          </strong>
          <p>{number(data.meditation.totalMinutes)} mindful minutes</p>
          <div className={styles.metricFoot}>
            <span className={styles.muted}>
              {data.sessions.average} min average completed session
            </span>
          </div>
        </section>
        <section className={styles.metric}>
          <div className={styles.metricLabel}>
            New members <Sparkles size={18} />
          </div>
          <strong>{number(data.users.new)}</strong>
          <p>{number(data.users.total)} registered members, all time</p>
          <div className={styles.metricFoot}>
            <Change value={data.users.growth} />
          </div>
        </section>
      </div>
      <div className={styles.mainGrid}>
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>MOMENTUM</p>
              <h2>
                {metric === "sessions"
                  ? "A rhythm of practice"
                  : "A growing community"}
              </h2>
            </div>
            <div className={styles.tabs} role="group" aria-label="Chart metric">
              <button
                aria-pressed={metric === "sessions"}
                onClick={() => setMetric("sessions")}
              >
                Sessions
              </button>
              <button
                aria-pressed={metric === "community"}
                onClick={() => setMetric("community")}
              >
                Members
              </button>
            </div>
          </div>
          <div className={styles.chartMeta}>
            <span>
              <i className={styles.legend} />
              {metric === "sessions"
                ? "Recorded sessions"
                : "Cumulative registrations"}
            </span>
            <span>{period}</span>
          </div>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chart}
                margin={{ top: 12, right: 12, left: -22, bottom: 4 }}
                accessibilityLayer
              >
                <defs>
                  <linearGradient
                    id="analyticsFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="4 5"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={dateLabel}
                  minTickGap={45}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                  }}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload;
                    return row
                      ? `${dateLabel(row.date)}${row.date !== row.end ? ` – ${dateLabel(row.end)}` : ""}`
                      : "";
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name={
                    metric === "sessions" ? "Sessions" : "Registered members"
                  }
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fill="url(#analyticsFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <details className={styles.details}>
            <summary>Explore chart data & definitions</summary>
            <p>
              Sessions include every recorded status. Members are cumulative
              registrations through each date.{" "}
              {source.length > 90
                ? "Long periods are grouped into intervals; session counts are summed and member counts use the end of each interval."
                : "Each point represents one day."}
            </p>
            <div className={styles.dataTable}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>{metric === "sessions" ? "Sessions" : "Members"}</th>
                  </tr>
                </thead>
                <tbody>
                  {source.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>{number(row.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
        <section className={styles.panel}>
          <p className={styles.eyebrow}>PRACTICE HEALTH</p>
          <h2>Every session matters</h2>
          <div
            className={styles.ring}
            style={
              { "--progress": `${completedPercent}%` } as React.CSSProperties
            }
          >
            <div>
              <strong>
                {data.sessions.total ? `${completedPercent}%` : "—"}
              </strong>
              <span>completion rate</span>
            </div>
          </div>
          <div className={styles.healthRow}>
            <span>
              <i className={styles.legend} />
              Completed
            </span>
            <strong>{number(data.sessions.completed)}</strong>
          </div>
          <div className={styles.healthRow}>
            <span>
              <i className={styles.legendMuted} />
              Other recorded sessions
            </span>
            <strong>
              {number(data.sessions.total - data.sessions.completed)}
            </strong>
          </div>
          <div className={styles.insight}>
            <Sparkles size={17} />
            <p>
              {data.sessions.total
                ? `${number(data.sessions.completed)} sessions ended with completed practice. The average completed session lasts ${data.sessions.average} minutes.`
                : "Your community’s practice story starts with its first recorded session."}
            </p>
          </div>
        </section>
      </div>
      <div className={styles.secondaryGrid}>
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>SHOWING UP</p>
              <h2>The weekly pulse</h2>
            </div>
            <span className={styles.badge}>Last 7 days</span>
          </div>
          <p className={styles.subtitle}>
            Unique meditators with completed practice each day.
          </p>
          <div className={styles.bars}>
            {data.engagement.dailyActive.map((count, i) => {
              const end = data.trends.sessionGrowth.at(-1)?.date;
              const day = end ? new Date(`${end}T12:00:00`) : new Date();
              day.setDate(day.getDate() - 6 + i);
              return (
                <div key={i} className={styles.barColumn}>
                  <strong>{number(count)}</strong>
                  <div className={styles.barTrack}>
                    <div
                      style={{
                        height: `${(count / Math.max(1, ...data.engagement.dailyActive)) * 100}%`,
                      }}
                    />
                  </div>
                  <span>
                    {day.toLocaleDateString("en", { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className={styles.pulseFooter}>
            <span>
              <strong>{number(data.engagement.monthlyActive)}</strong> active in
              the last 30 days
            </span>
            <Activity size={18} />
          </div>
          <details className={styles.details}>
            <summary>Weekly active meditators · last 4 weeks</summary>
            {data.engagement.weeklyActive.map((count, i) => (
              <div className={styles.healthRow} key={i}>
                <span>
                  {i === 3
                    ? "Most recent 7 days"
                    : `${(4 - i) * 7 - 1}–${(3 - i) * 7} days ago`}
                </span>
                <strong>{number(count)}</strong>
              </div>
            ))}
          </details>
        </section>
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>FINDING STILLNESS</p>
              <h2>Practices people return to</h2>
            </div>
            <Flower2 size={22} className={styles.accent} />
          </div>
          <p className={styles.subtitle}>
            Share of completed sessions in this period.
          </p>
          <div className={styles.practiceList}>
            {data.meditation.popularTypes.length ? (
              data.meditation.popularTypes.map((item, i) => (
                <div key={item.type}>
                  <div className={styles.practiceLabel}>
                    <span>
                      <small>{String(i + 1).padStart(2, "0")}</small>
                      {item.type}
                    </span>
                    <strong>{item.percentage}%</strong>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      style={{
                        width: `${item.percentage}%`,
                        opacity: 1 - i * 0.14,
                      }}
                    />
                  </div>
                  <p>{number(item.count)} completed sessions</p>
                </div>
              ))
            ) : (
              <div className={styles.empty}>
                <Flower2 size={28} />
                <p>No completed practices in this period.</p>
              </div>
            )}
          </div>
          {top && (
            <p className={styles.practiceNote}>
              <Sparkles size={14} />
              {top.type} leads with {top.percentage}% of completed sessions.
            </p>
          )}
        </section>
      </div>
      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>THE PATH, TOGETHER</p>
            <h2>A community on its journey</h2>
          </div>
          <span className={styles.badge}>Current stages · all time</span>
        </div>
        <p className={styles.subtitle}>
          {number(data.pathProgress?.totalWithProgress ?? 0)} members have
          recorded their place on the Seven Purifications path.
        </p>
        <div className={styles.stages}>
          {PATH_STAGES.map((item) => {
            const entry = data.pathProgress?.byStage.find(
              (row) => row.stage === item.order,
            );
            return (
              <button
                key={item.order}
                disabled={!canReadUsers}
                aria-pressed={stage === item.order}
                onClick={() =>
                  setStage(stage === item.order ? null : item.order)
                }
                className={styles.stage}
              >
                <span className={styles.stageNumber}>
                  {String(item.order).padStart(2, "0")}
                </span>
                <strong>{number(entry?.count ?? 0)}</strong>
                <span className={styles.stageName}>{item.nameEn}</span>
                <div className={styles.progressTrack}>
                  <div style={{ width: `${entry?.percentage ?? 0}%` }} />
                </div>
                <small>{entry?.percentage ?? 0}% of path members</small>
              </button>
            );
          })}
        </div>
        {stage !== null && canReadUsers && (
          <div className={styles.stageDetails} aria-live="polite">
            <div className={styles.sectionHeader}>
              <h3>
                {PATH_STAGES.find((item) => item.order === stage)?.nameEn}
              </h3>
              <button className={styles.button} onClick={() => setStage(null)}>
                Close
              </button>
            </div>
            {stageLoading ? (
              <p>Loading members…</p>
            ) : stageError ? (
              <p role="alert">
                Member details couldn&apos;t load. Close and select the stage to
                retry.
              </p>
            ) : stageUsers?.[stage]?.length ? (
              <ul>
                {stageUsers[stage].map((user) => (
                  <li key={user.id}>
                    <strong>{user.displayName || "Unnamed member"}</strong>
                    <span>{user.email}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No members recorded in this stage yet.</p>
            )}
          </div>
        )}
      </section>
      <section className={styles.contentStrip}>
        <div>
          <span className={styles.contentIcon}>
            <Headphones size={22} />
          </span>
          <div>
            <p>Audio engagement</p>
            <strong>
              {number(data.content.totalAudioListens)}{" "}
              <small>listens this period</small>
            </strong>
            <span>
              {number(data.content.audioFiles)} audio files in the library
            </span>
          </div>
        </div>
        <div>
          <span className={styles.contentIcon}>
            <BookOpen size={22} />
          </span>
          <div>
            <p>Dhamma engagement</p>
            <strong>
              {number(data.content.totalViews)} <small>reads this period</small>
            </strong>
            <span>
              {number(data.content.dhammaPosts)} posts across all publication
              states
            </span>
          </div>
        </div>
      </section>
      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>PEOPLE BEHIND THE PRACTICE</p>
            <h2>Most active meditators</h2>
            <p className={styles.subtitle}>
              The top 20 members by completed sessions this period.
            </p>
          </div>
          <div className={styles.tableControls}>
            <label className={styles.search}>
              <Search size={15} />
              <input
                aria-label="Search top meditators"
                placeholder="Find a member…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Sort meditators"
              value={sort}
              onChange={(e) =>
                setSort(e.target.value as "sessions" | "minutes")
              }
            >
              <option value="sessions">By sessions</option>
              <option value="minutes">By practice time</option>
            </select>
          </div>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.members}>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Member</th>
                <th scope="col">Sessions</th>
                <th scope="col">Practice time</th>
                <th scope="col">Favorite practice</th>
              </tr>
            </thead>
            <tbody>
              {shownUsers.length ? (
                shownUsers.map((item, i) => (
                  <tr key={item.user.id}>
                    <td>{String(i + 1).padStart(2, "0")}</td>
                    <td>
                      <div className={styles.member}>
                        <span className={styles.avatar}>
                          {(item.user.displayName || "M")
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>
                        <div>
                          <strong>
                            {item.user.displayName || "Unnamed member"}
                          </strong>
                          <span>{item.user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.sessionPill}>
                        {number(item.sessionCount)}
                      </span>
                    </td>
                    <td>
                      {number(item.totalMinutes)}{" "}
                      <span className={styles.muted}>min</span>
                    </td>
                    <td>{item.meditationTypes[0]?.type || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    {query
                      ? "No members match your search."
                      : "No completed sessions to show in this period."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFooter}>
          <span>
            Showing {shownUsers.length} of {visibleUsers.length} members
          </span>
          {visibleUsers.length > 5 && (
            <button
              className={styles.button}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Show fewer" : "Show all members"}
            </button>
          )}
        </div>
      </section>
      <footer className={styles.footer}>
        <Info size={16} />
        <p>
          Practice, new members, and content engagement follow the selected
          period. Registered members, library inventory, and path stages are
          lifetime snapshots. Growth compares the preceding equal-length period.
          Completion counts require a positive, valid duration.
        </p>
      </footer>
    </>
  );
}
