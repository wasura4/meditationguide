"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Flower2,
  Headphones,
  RefreshCw,
  Sparkles,
  Timer,
  Users,
  type LucideIcon,
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
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminService } from "@/lib/adminService";
import ui from "../analytics/analytics.module.css";
import styles from "./dashboard.module.css";

type DashboardData = Awaited<ReturnType<typeof AdminService.getAdminAnalytics>>;
const number = (value: number) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);
const dateLabel = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
  });
const shortcuts: {
  title: string;
  description: string;
  href: string;
  resource: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Audio library",
    description: "Care for your collection of guided practices.",
    href: "/admin/audio",
    resource: "audio",
    icon: Headphones,
  },
  {
    title: "Dhamma articles",
    description: "Manage teachings that inspire understanding.",
    href: "/admin/dhamma",
    resource: "dhamma",
    icon: BookOpen,
  },
  {
    title: "Community",
    description: "Find members and manage their profiles.",
    href: "/admin/users",
    resource: "users",
    icon: Users,
  },
  {
    title: "Events",
    description: "Organize opportunities to practice together.",
    href: "/admin/events",
    resource: "content",
    icon: CalendarDays,
  },
];

export default function AdminDashboardPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const allowed = hasPermission("analytics", "read");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [updated, setUpdated] = useState<Date | null>(null);
  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    AdminService.getAdminAnalytics("30d")
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
  }, [allowed, retry]);
  const actions = shortcuts.filter((action) =>
    hasPermission(action.resource, "read"),
  );
  return (
    <AdminLayout currentPage="/admin/dashboard">
      <div className={ui.dashboard}>
        <header className={ui.header}>
          <div>
            <p className={ui.eyebrow}>
              <Flower2 size={14} /> NIRVANAYA / OVERVIEW
            </p>
            <h1>
              A little care. A lasting impact<span>.</span>
            </h1>
            <p className={ui.subtitle}>
              Welcome back
              {adminUser?.displayName
                ? `, ${adminUser.displayName.split(" ")[0]}`
                : ""}
              . Here&apos;s how your community is doing.
            </p>
          </div>
          <button
            className={ui.button}
            disabled={loading || !allowed}
            onClick={() => setRetry((value) => value + 1)}
          >
            <RefreshCw size={15} className={loading ? ui.spin : ""} /> Refresh
            overview
          </button>
        </header>
        {!allowed ? (
          <p role="alert">
            You don&apos;t have permission to view this overview.
          </p>
        ) : (
          <>
            <div className={styles.statusLine}>
              <span>
                <i />
                {loading
                  ? "Updating overview…"
                  : error
                    ? "Overview unavailable"
                    : "Community overview"}
              </span>
              <span>
                {updated && !loading && !error
                  ? `Updated ${updated.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })} · Your local time`
                  : "Last 30 days"}
              </span>
            </div>
            {loading ? (
              <div
                className={ui.skeleton}
                role="status"
                aria-label="Loading dashboard"
              >
                <div />
                <div />
                <div />
                <div />
                <section />
              </div>
            ) : error || !data ? (
              <section className={ui.panel} role="alert">
                <h2>Your overview couldn&apos;t load</h2>
                <p className={ui.subtitle}>
                  Check your connection and try again.
                </p>
                <button
                  className={ui.button}
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Try again
                </button>
              </section>
            ) : (
              <DashboardOverview data={data} />
            )}
            {actions.length > 0 && (
              <section className={ui.panel}>
                <div className={ui.sectionHeader}>
                  <div>
                    <p className={ui.eyebrow}>MAKE ROOM FOR WHAT&apos;S NEXT</p>
                    <h2>Your workspace</h2>
                  </div>
                  <span className={ui.badge}>Quick access</span>
                </div>
                <div className={styles.shortcuts}>
                  {actions.map(({ title, description, href, icon: Icon }) => (
                    <Link key={href} href={href} className={styles.shortcut}>
                      <span className={styles.actionIcon}>
                        <Icon size={21} />
                      </span>
                      <ArrowUpRight size={17} className={styles.actionArrow} />
                      <strong>{title}</strong>
                      <p>{description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <footer className={styles.footer}>
              <Flower2 size={16} />
              <span>A thoughtful space, supported by thoughtful people.</span>
              <Link href="/admin/analytics">
                Explore all analytics <ArrowRight size={13} />
              </Link>
            </footer>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function DashboardOverview({ data }: { data: DashboardData }) {
  const { hasPermission } = useAdminAuth();
  const [chartMode, setChartMode] = useState<"sessions" | "members">(
    "sessions",
  );
  const today = data.trends.sessionGrowth.at(-1);
  const activeToday = data.engagement.dailyActive.at(-1) ?? 0;
  const completed = data.sessions.total
    ? Math.round((data.sessions.completed / data.sessions.total) * 100)
    : 0;
  const top = data.meditation.popularTypes[0];
  const chartData =
    chartMode === "sessions"
      ? data.trends.sessionGrowth
      : data.trends.userGrowth;
  const metrics = [
    {
      label: "Community members",
      value: number(data.users.total),
      detail: `${number(data.users.new)} joined in the last 30 days`,
      icon: Users,
    },
    {
      label: "Active meditators",
      value: number(data.users.active),
      detail: `${data.engagement.participationRate}% of registered members · 30 days`,
      icon: Activity,
    },
    {
      label: "Completed practices",
      value: number(data.sessions.completed),
      detail: `${number(data.sessions.total)} recorded sessions · 30 days`,
      icon: Flower2,
    },
    {
      label: "Hours of stillness",
      value: number(data.meditation.totalMinutes / 60),
      detail: `${number(data.meditation.totalMinutes)} practice minutes · 30 days`,
      icon: Timer,
    },
  ];
  return (
    <>
      <section className={styles.hero} aria-labelledby="today-title">
        <div className={styles.heroCopy}>
          <p className={ui.eyebrow}>SMALL MOMENTS. MEANINGFUL CHANGE.</p>
          <h2 id="today-title">
            A space to pause.
            <br />A community to grow.
          </h2>
          <p>
            {activeToday
              ? `${number(activeToday)} ${activeToday === 1 ? "person has" : "people have"} completed a practice today. Every return is a moment worth making space for.`
              : "A new day to support your community. Completed practices will appear here as members make time for themselves."}
          </p>
          <Link href="/admin/analytics" className={styles.primaryLink}>
            See the bigger picture <ArrowRight size={16} />
          </Link>
        </div>
        <div className={styles.todayCard}>
          <div className={styles.todayHeading}>
            <span className={styles.sun}>
              <Flower2 size={26} />
            </span>
            <div>
              <strong>Today, at a glance</strong>
              <span>
                {today ? dateLabel(today.date) : "Today"} · local time
              </span>
            </div>
          </div>
          <div className={styles.todayStats}>
            <div>
              <strong>{number(activeToday)}</strong>
              <span>active meditators</span>
            </div>
            <div>
              <strong>{number(today?.count ?? 0)}</strong>
              <span>recorded sessions</span>
            </div>
          </div>
          <p>
            <Activity size={13} />A snapshot at the last refresh
          </p>
        </div>
        <div className={styles.orbit} aria-hidden="true" />
      </section>
      <div className={ui.metrics}>
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <section key={label} className={`${ui.metric} ${styles.metric}`}>
            <div className={ui.metricLabel}>
              {label}
              <Icon size={18} />
            </div>
            <strong>{value}</strong>
            <p>{detail}</p>
          </section>
        ))}
      </div>
      <div className={styles.overviewGrid}>
        <section className={ui.panel}>
          <div className={ui.sectionHeader}>
            <div>
              <p className={ui.eyebrow}>BUILDING MOMENTUM</p>
              <h2>
                {chartMode === "sessions"
                  ? "The rhythm of your community"
                  : "More people, a shared purpose"}
              </h2>
            </div>
            <div className={ui.tabs} role="group" aria-label="Overview chart">
              <button
                aria-pressed={chartMode === "sessions"}
                onClick={() => setChartMode("sessions")}
              >
                Sessions
              </button>
              <button
                aria-pressed={chartMode === "members"}
                onClick={() => setChartMode("members")}
              >
                Members
              </button>
            </div>
          </div>
          <div className={ui.chartMeta}>
            <span>
              <i className={ui.legend} />
              {chartMode === "sessions"
                ? "All recorded sessions per day"
                : "Cumulative registered members"}
            </span>
            <span>Last 30 days</span>
          </div>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 15, right: 10, bottom: 8, left: -20 }}
                accessibilityLayer
              >
                <defs>
                  <linearGradient
                    id="dashboard-practice-fill"
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
                  minTickGap={40}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip
                  labelFormatter={(value) => dateLabel(String(value))}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name={
                    chartMode === "sessions" ? "Sessions" : "Registered members"
                  }
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fill="url(#dashboard-practice-fill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartFooter}>
            <span>
              {data.sessions.growth === null
                ? "Session growth has no previous baseline."
                : `${data.sessions.growth > 0 ? "+" : ""}${data.sessions.growth}% sessions compared with the previous 30 days.`}
            </span>
            <Link href="/admin/analytics">
              Full report <ArrowUpRight size={14} />
            </Link>
          </div>
          <details className={ui.details}>
            <summary>View daily chart values</summary>
            <div className={ui.dataTable}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">
                      {chartMode === "sessions"
                        ? "Sessions"
                        : "Registered members"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row) => (
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
        <section className={`${ui.panel} ${styles.insights}`}>
          <p className={ui.eyebrow}>WORTH A MOMENT</p>
          <h2>Your community in focus</h2>
          <p className={ui.subtitle}>A few signals from the last 30 days.</p>
          <div className={styles.signal}>
            <span className={styles.signalIcon}>
              <Sparkles size={18} />
            </span>
            <div>
              <strong>
                {data.sessions.total
                  ? `${completed}% of sessions completed`
                  : "Room for a first practice"}
              </strong>
              <p>
                {data.sessions.total
                  ? `${number(data.sessions.completed)} completed practices from ${number(data.sessions.total)} recorded sessions.`
                  : "Practice insights will appear when members start recording sessions."}
              </p>
            </div>
          </div>
          <div className={styles.signal}>
            <span className={styles.signalIcon}>
              <Timer size={18} />
            </span>
            <div>
              <strong>
                {data.sessions.completed
                  ? `${data.sessions.average} minutes to slow down`
                  : "A rhythm is taking shape"}
              </strong>
              <p>
                {data.sessions.completed
                  ? "The average length of a completed session in your community."
                  : "Average practice length will appear after the first completed session."}
              </p>
            </div>
          </div>
          <div className={styles.signal}>
            <span className={styles.signalIcon}>
              <Flower2 size={18} />
            </span>
            <div>
              <strong>{top ? top.type : "Many paths to stillness"}</strong>
              <p>
                {top
                  ? `The most practiced type, with ${number(top.count)} completed sessions (${top.percentage}%).`
                  : "Your most practiced meditation will appear here."}
              </p>
            </div>
          </div>
          <div className={styles.insightNote}>
            <Flower2 size={17} />
            <p>
              Consistency grows one practice at a time. These numbers reflect
              participation, not spiritual attainment.
            </p>
          </div>
        </section>
      </div>
      <section className={ui.panel}>
        <div className={ui.sectionHeader}>
          <div>
            <p className={ui.eyebrow}>RESOURCES THAT SUPPORT THE JOURNEY</p>
            <h2>Your content, at a glance</h2>
          </div>
          <span className={ui.badge}>
            Library totals · engagement over 30 days
          </span>
        </div>
        <div className={styles.libraryGrid}>
          {[
            {
              title: "Audio library",
              count: data.content.audioFiles,
              unit: "audio files",
              engagement: data.content.totalAudioListens,
              action: "listens",
              icon: Headphones,
              resource: "audio",
              href: "/admin/audio",
            },
            {
              title: "Dhamma collection",
              count: data.content.dhammaPosts,
              unit: "posts · all publication states",
              engagement: data.content.totalViews,
              action: "recorded reads",
              icon: BookOpen,
              resource: "dhamma",
              href: "/admin/dhamma",
            },
          ].map(
            ({
              title,
              count,
              unit,
              engagement,
              action,
              icon: Icon,
              resource,
              href,
            }) => (
              <div className={styles.libraryCard} key={title}>
                <div className={styles.libraryHeading}>
                  <span className={styles.actionIcon}>
                    <Icon size={22} />
                  </span>
                  <h3>{title}</h3>
                  {hasPermission(resource, "read") && (
                    <Link
                      href={href}
                      aria-label={`Manage ${title.toLowerCase()}`}
                    >
                      <ArrowUpRight size={18} />
                    </Link>
                  )}
                </div>
                <div className={styles.libraryStats}>
                  <div>
                    <strong>{number(count)}</strong>
                    <span>{unit}</span>
                  </div>
                  <div>
                    <strong>{number(engagement)}</strong>
                    <span>{action} · 30 days</span>
                  </div>
                </div>
                {count === 0 && (
                  <p className={ui.subtitle}>
                    Your library is ready for its first addition.
                  </p>
                )}
              </div>
            ),
          )}
        </div>
      </section>
      <section className={styles.explore}>
        <span className={styles.actionIcon}>
          <ChartNoAxesCombined size={23} />
        </span>
        <div>
          <h2>Curious about the bigger picture?</h2>
          <p>
            Explore date ranges, practice patterns, member activity, and
            downloadable reports.
          </p>
        </div>
        <Link href="/admin/analytics" className={ui.button}>
          Open analytics <ArrowRight size={15} />
        </Link>
      </section>
    </>
  );
}
