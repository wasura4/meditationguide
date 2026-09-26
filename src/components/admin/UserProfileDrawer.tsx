"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  Flower2,
  Route,
  Timer,
  X,
} from "lucide-react";
import { AdminService } from "@/lib/adminService";
import { memberPracticeInsights } from "@/lib/adminMemberInsights";
import { PATH_STAGES } from "@/constants/path";
import type { MeditationSession, User } from "@/types";
import ui from "@/app/admin/analytics/analytics.module.css";
import styles from "@/app/admin/users/users.module.css";

const formatDate = (date?: Date) =>
  date && Number.isFinite(date.getTime())
    ? date.toLocaleDateString("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not recorded";
const formatNumber = (value: number) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);
const preference = (value: unknown) =>
  typeof value === "boolean"
    ? value
      ? "On"
      : "Off"
    : typeof value === "string" && value
      ? value
      : typeof value === "number" && Number.isFinite(value)
        ? String(value)
        : "Not recorded";

export function UserProfileDrawer({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [profile, setProfile] = useState(user);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [practiceError, setPracticeError] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [retry, setRetry] = useState(0);
  const [tab, setTab] = useState<"overview" | "sessions" | "account">(
    "overview",
  );
  const [status, setStatus] = useState("all");
  const [limit, setLimit] = useState(10);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPracticeError(false);
    setProfileError("");
    Promise.allSettled([
      AdminService.getUserById(user.id),
      AdminService.getUserPracticeHistory(user.id),
    ]).then(([member, history]) => {
      if (cancelled) return;
      if (member.status === "fulfilled" && member.value)
        setProfile(member.value);
      else
        setProfileError(
          member.status === "fulfilled"
            ? "This member no longer exists. Showing the last loaded profile."
            : "Profile refresh failed. Showing the last loaded account details.",
        );
      if (history.status === "fulfilled") {
        setSessions(history.value);
        setNow(new Date());
      } else setPracticeError(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user.id, retry]);
  const insights = useMemo(
    () => memberPracticeInsights(sessions, now),
    [sessions, now],
  );
  const filteredSessions = sessions.filter(
    (session) => status === "all" || session.status === status,
  );
  const displayName =
    (profile.displayName && profile.displayName !== "Anonymous User"
      ? profile.displayName
      : profile.email?.split("@")[0]) || "Unnamed member";
  const currentStage = PATH_STAGES.find(
    (stage) => stage.order === profile.pathProgress?.currentStage,
  );
  async function copyId() {
    try {
      await navigator.clipboard.writeText(profile.id);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <dialog
      ref={dialog}
      className={styles.drawer}
      aria-labelledby="member-profile-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.drawerContent}>
        <header className={styles.drawerHeader}>
          <span>
            <Flower2 size={14} /> MEMBER PROFILE
          </span>
          <button
            autoFocus
            onClick={onClose}
            className={ui.iconButton}
            aria-label="Close member profile"
          >
            <X size={20} />
          </button>
        </header>
        <div className={styles.identity}>
          <span className={styles.largeAvatar}>
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h2 id="member-profile-title">{displayName}</h2>
            <p>{profile.email || "No email recorded"}</p>
            <div className={styles.identityMeta}>
              <span className={styles.pill}>
                {profile.isAnonymous ? "Guest account" : "Registered account"}
              </span>
              <span>
                <CalendarDays size={12} />
                Joined {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <nav className={styles.profileTabs} aria-label="Profile sections">
          {(
            [
              ["overview", "Overview"],
              ["sessions", "Session history"],
              ["account", "Account & preferences"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
            >
              {label}
              {value === "sessions" && !loading && !practiceError && (
                <span>{sessions.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className={styles.profileBody}>
          {profileError && (
            <div role="alert" className={styles.notice}>
              {profileError}
              <button
                className={ui.button}
                onClick={() => setRetry((value) => value + 1)}
              >
                Retry
              </button>
            </div>
          )}
          {tab === "account" ? (
            <>
              <section className={styles.profileSection}>
                <p className={ui.eyebrow}>ACCOUNT RECORD</p>
                <h3>The details behind the profile</h3>
                <dl className={styles.facts}>
                  {[
                    ["Display name", profile.displayName || "Not recorded"],
                    ["Email", profile.email || "Not recorded"],
                    [
                      "Account type",
                      profile.isAnonymous ? "Guest" : "Registered",
                    ],
                    ["Profile role", profile.role || "Not recorded"],
                    ["Joined", formatDate(profile.createdAt)],
                    ["Last recorded login", formatDate(profile.lastLoginAt)],
                    ["Profile updated", formatDate(profile.updatedAt)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className={styles.userId}>
                  <div>
                    <span>User ID</span>
                    <code>{profile.id}</code>
                  </div>
                  <button
                    className={ui.iconButton}
                    onClick={copyId}
                    aria-label="Copy user ID"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p role="status" className={styles.footnote}>
                  {copyError
                    ? "Copy unavailable. Select the user ID above to copy it."
                    : copied
                      ? "User ID copied."
                      : "Profile roles do not describe admin-console permissions."}
                </p>
              </section>
              <section className={styles.profileSection}>
                <p className={ui.eyebrow}>PERSONAL PREFERENCES</p>
                <h3>How they make the space their own</h3>
                <dl className={styles.facts}>
                  {[
                    [
                      "Language",
                      profile.preferences?.language === "si"
                        ? "Sinhala"
                        : profile.preferences?.language === "en"
                          ? "English"
                          : "Not recorded",
                    ],
                    ["Appearance", preference(profile.preferences?.theme)],
                    [
                      "Time format",
                      preference(profile.preferences?.timeFormat),
                    ],
                    [
                      "Saved daily goal",
                      profile.preferences?.dailyGoalMinutes
                        ? `${profile.preferences.dailyGoalMinutes} minutes`
                        : "Not recorded",
                    ],
                    [
                      "Session-end notification",
                      preference(
                        profile.preferences?.notifications?.sessionEnd,
                      ),
                    ],
                    [
                      "Daily reminder",
                      preference(
                        profile.preferences?.notifications?.dailyReminder,
                      ),
                    ],
                    [
                      "Weekly report",
                      preference(
                        profile.preferences?.notifications?.weeklyReport,
                      ),
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </>
          ) : loading ? (
            <div className={styles.loading} role="status">
              Loading practice history…
              {[0, 1, 2].map((value) => (
                <div key={value} />
              ))}
            </div>
          ) : practiceError ? (
            <div className={styles.notice} role="alert">
              <h3>Practice history couldn&apos;t load</h3>
              <p>
                Account information is still available in the Account &
                preferences tab.
              </p>
              <button
                className={ui.button}
                onClick={() => setRetry((value) => value + 1)}
              >
                Retry practice history
              </button>
            </div>
          ) : tab === "overview" ? (
            <>
              <div className={styles.profileMetrics}>
                {[
                  {
                    label: "Completed sessions",
                    value: formatNumber(insights.completed),
                    icon: Flower2,
                  },
                  {
                    label: "Practice minutes",
                    value: formatNumber(insights.totalMinutes),
                    icon: Timer,
                  },
                  {
                    label: "Current streak",
                    value: `${insights.streak} days`,
                    icon: Activity,
                  },
                  {
                    label: "Average session",
                    value: `${insights.average} min`,
                    icon: CalendarDays,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <Icon size={17} />
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <p className={styles.scope}>
                All recorded history · completed sessions with valid durations
                and dates
              </p>
              <section className={styles.profileSection}>
                <div className={ui.sectionHeader}>
                  <div>
                    <p className={ui.eyebrow}>MAKING TIME FOR STILLNESS</p>
                    <h3>Practice over the last 30 days</h3>
                  </div>
                  <span className={ui.badge}>
                    {insights.recentDays} active days
                  </span>
                </div>
                <p className={styles.sectionDescription}>
                  {formatNumber(insights.recentMinutes)} minutes of completed
                  practice. Dates use your local time.
                </p>
                <div className={styles.activityGrid}>
                  {insights.days.map((day) => (
                    <div
                      key={day.date.toISOString()}
                      className={styles.activityDay}
                      data-active={day.minutes > 0}
                      tabIndex={0}
                      title={`${formatDate(day.date)}: ${formatNumber(day.minutes)} minutes`}
                      aria-label={`${formatDate(day.date)}: ${formatNumber(day.minutes)} minutes`}
                      style={
                        day.minutes
                          ? {
                              background: `color-mix(in srgb, var(--primary) ${Math.max(20, (day.minutes / Math.max(1, ...insights.days.map((item) => item.minutes))) * 100)}%, var(--card))`,
                            }
                          : undefined
                      }
                    >
                      <span>{day.date.getDate()}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.activityLegend}>
                  <span>{formatDate(insights.days[0].date)}</span>
                  <span>
                    Less <i />
                    <i />
                    <i /> More
                  </span>
                  <span>{formatDate(insights.days.at(-1)?.date)}</span>
                </div>
                <div className={styles.practiceFacts}>
                  <span>
                    Longest streak<strong>{insights.longest} days</strong>
                  </span>
                  <span>
                    Practice days, all time
                    <strong>{insights.practiceDays}</strong>
                  </span>
                  <span>
                    Last completed practice
                    <strong>{formatDate(insights.lastPractice)}</strong>
                  </span>
                </div>
              </section>
              <section className={styles.profileSection}>
                <div className={ui.sectionHeader}>
                  <div>
                    <p className={ui.eyebrow}>PRACTICE PREFERENCES</p>
                    <h3>Practices they return to</h3>
                  </div>
                  <Flower2 size={21} className={ui.accent} />
                </div>
                {insights.types.length ? (
                  <div className={styles.typeList}>
                    {insights.types.slice(0, 5).map((type) => (
                      <div key={type.name}>
                        <div>
                          <strong>{type.name}</strong>
                          <span>
                            {type.count} sessions · {formatNumber(type.minutes)}{" "}
                            min
                          </span>
                        </div>
                        <div className={ui.progressTrack}>
                          <div
                            style={{
                              width: `${(type.count / insights.completed) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.sectionDescription}>
                    No completed practices recorded yet.
                  </p>
                )}
              </section>
              <section className={styles.profileSection}>
                <div className={ui.sectionHeader}>
                  <div>
                    <p className={ui.eyebrow}>THE SEVEN PURIFICATIONS</p>
                    <h3>
                      {currentStage
                        ? currentStage.nameEn
                        : "A journey yet to be recorded"}
                    </h3>
                  </div>
                  <Route size={21} className={ui.accent} />
                </div>
                {currentStage ? (
                  <>
                    <p className={styles.sectionDescription}>
                      {currentStage.name} · Stage {currentStage.order} of 8
                    </p>
                    <div
                      className={styles.pathSteps}
                      aria-label={`Current path stage ${currentStage.order} of 8`}
                    >
                      {PATH_STAGES.map((stage) => (
                        <span
                          key={stage.order}
                          data-current={stage.order === currentStage.order}
                          title={stage.nameEn}
                        >
                          {stage.order}
                        </span>
                      ))}
                    </div>
                    <p className={styles.sectionDescription}>
                      {currentStage.description}
                    </p>
                    <p className={styles.scope}>
                      Self-reported · updated{" "}
                      {formatDate(profile.pathProgress?.updatedAt)}
                    </p>
                    {!!profile.pathProgress?.history.length && (
                      <details className={styles.pathHistory}>
                        <summary>
                          View recorded path milestones (
                          {profile.pathProgress.history.length})
                        </summary>
                        {[...profile.pathProgress.history]
                          .reverse()
                          .map((entry, i) => (
                            <div key={i}>
                              <strong>
                                {PATH_STAGES.find(
                                  (stage) => stage.order === entry.stage,
                                )?.nameEn || `Stage ${entry.stage}`}
                              </strong>
                              <span>{formatDate(entry.updatedAt)}</span>
                              {entry.notes && <p>{entry.notes}</p>}
                            </div>
                          ))}
                      </details>
                    )}
                  </>
                ) : (
                  <p className={styles.sectionDescription}>
                    This member hasn&apos;t saved a path stage yet.
                  </p>
                )}
              </section>
              <button
                className={styles.historyLink}
                onClick={() => setTab("sessions")}
              >
                Explore all {sessions.length} recorded sessions
                <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <section className={styles.profileSection}>
              <div className={ui.sectionHeader}>
                <div>
                  <p className={ui.eyebrow}>THE PRACTICE LOG</p>
                  <h3>Session history</h3>
                </div>
                <label className={styles.select}>
                  Status
                  <select
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value);
                      setLimit(10);
                    }}
                  >
                    <option value="all">All statuses</option>
                    <option value="completed">Completed</option>
                    <option value="abandoned">Abandoned</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </label>
              </div>
              <p className={styles.sectionDescription}>
                Expand a session for its recorded reflection, mood, and rating.
              </p>
              <div className={styles.sessionList}>
                {filteredSessions.slice(0, limit).map((session) => (
                  <details key={session.id} className={styles.session}>
                    <summary>
                      <span className={styles.sessionIcon}>
                        <Flower2 size={18} />
                      </span>
                      <span className={styles.sessionTitle}>
                        <strong>
                          {session.typeName || "Unnamed practice"}
                        </strong>
                        <small>
                          {formatDate(session.startTime || session.createdAt)}
                          {session.startTime &&
                          Number.isFinite(session.startTime.getTime())
                            ? ` · ${session.startTime.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}`
                            : ""}
                        </small>
                      </span>
                      <span className={styles.sessionDuration}>
                        {Number.isFinite(session.duration) &&
                        session.duration > 0
                          ? `${formatNumber(session.duration)} min`
                          : "Duration unavailable"}
                      </span>
                      <span
                        className={styles.sessionStatus}
                        data-completed={session.status === "completed"}
                      >
                        {session.status || "Unknown"}
                      </span>
                    </summary>
                    <div className={styles.sessionBody}>
                      <dl className={styles.facts}>
                        <div>
                          <dt>Mood</dt>
                          <dd>{preference(session.mood)}</dd>
                        </div>
                        <div>
                          <dt>Rating</dt>
                          <dd>
                            {session.rating &&
                            session.rating >= 1 &&
                            session.rating <= 5
                              ? `${session.rating} / 5`
                              : "Not recorded"}
                          </dd>
                        </div>
                        <div>
                          <dt>Started</dt>
                          <dd>{formatDate(session.startTime)}</dd>
                        </div>
                        <div>
                          <dt>Ended</dt>
                          <dd>{formatDate(session.endTime)}</dd>
                        </div>
                      </dl>
                      <h4>Reflection</h4>
                      <p>
                        {session.notes ||
                          "No reflection recorded for this session."}
                      </p>
                      {!!session.distractions?.length && (
                        <>
                          <h4>Distractions</h4>
                          <p>{session.distractions.join(", ")}</p>
                        </>
                      )}
                      {!!session.insights?.length && (
                        <>
                          <h4>Insights</h4>
                          <p>{session.insights.join(", ")}</p>
                        </>
                      )}
                      {!!session.tags?.length && (
                        <div className={styles.tags}>
                          {session.tags.map((tag, i) => (
                            <span key={`${tag}-${i}`}>{tag}</span>
                          ))}
                        </div>
                      )}
                      <p className={styles.scope}>Session ID: {session.id}</p>
                    </div>
                  </details>
                ))}
              </div>
              {!filteredSessions.length && (
                <div className={ui.empty}>
                  <Flower2 size={28} />
                  <h4>
                    {sessions.length
                      ? "No sessions with this status"
                      : "No practice sessions recorded yet"}
                  </h4>
                </div>
              )}
              <div className={styles.listFooter}>
                <span>
                  Showing {Math.min(limit, filteredSessions.length)} of{" "}
                  {filteredSessions.length} sessions
                </span>
                {limit < filteredSessions.length && (
                  <button
                    className={ui.button}
                    onClick={() => setLimit((value) => value + 10)}
                  >
                    Show more
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
        <footer className={styles.drawerFooter}>
          <Flower2 size={14} />
          Practice is a personal journey. This profile reflects recorded
          activity.
        </footer>
      </div>
    </dialog>
  );
}
