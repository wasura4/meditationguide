"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Headphones,
  ChevronRight,
  Flower2,
  Play,
  BookMarked,
  Library,
  MessageCircle,
  Route,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppPage } from "@/components/app/AppPage";
import { PracticeActivity } from "@/components/app/PracticeActivity";
import { MeditationService } from "@/lib/meditationService";
import { DhammaService } from "@/lib/dhammaService";
import type { MeditationSession } from "@/types";
import type { DhammaPost } from "@/types/admin";
import { EventBanner } from "@/components/events/EventBanner";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [posts, setPosts] = useState<DhammaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(false);
  const [postsError, setPostsError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    setSessionsError(false);
    setPostsError(false);
    Promise.allSettled([
      MeditationService.getUserSessions(user.id, 5),
      DhammaService.getPublishedPosts(),
    ]).then(([sessionResult, postResult]) => {
      if (cancelled) return;
      if (sessionResult.status === "fulfilled")
        setSessions(sessionResult.value);
      else setSessionsError(true);
      if (postResult.status === "fulfilled")
        setPosts(postResult.value.slice(0, 2));
      else setPostsError(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, attempt]);

  const resources = [
    {
      href: "/mypath",
      icon: Route,
      label: t("dashboard.quick_actions_labels.my_path"),
      detail: t("interface.path_description"),
    },
    {
      href: "/pitaka",
      icon: BookMarked,
      label: t("dashboard.quick_actions_labels.tripitaka"),
      detail: t("interface.pitaka_description"),
    },
    {
      href: "/books",
      icon: Library,
      label: t("interface.books"),
      detail: t("interface.books_description"),
    },
    {
      href: "/meditation-questions",
      icon: MessageCircle,
      label: t("interface.questions"),
      detail: t("interface.questions_description"),
    },
  ];

  return (
    <ProtectedRoute>
      <AppPage
        title={t("interface.today")}
        subtitle={t("interface.welcome", {
          name: user?.displayName || t("interface.practitioner"),
        })}
      >
        <div className="space-y-8">
          {user?.id && <PracticeActivity key={user.id} userId={user.id} />}
          <section
            className="app-card relative overflow-hidden p-6 sm:p-8"
            aria-labelledby="practice-title"
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-primary/10" />
            <Flower2
              className="pointer-events-none absolute right-6 top-7 h-16 w-16 text-primary/30 sm:h-24 sm:w-24"
              strokeWidth={1}
              aria-hidden="true"
            />
            <div className="relative max-w-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("interface.daily_practice")}
              </p>
              <h2
                id="practice-title"
                className="max-w-[85%] text-2xl font-semibold leading-snug tracking-tight sm:text-3xl"
              >
                {t("interface.make_space")}
              </h2>
              <p className="mb-6 mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                {t("interface.practice_description")}
              </p>
              <Link
                href="/meditate"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary/20 px-5 py-3 text-sm font-semibold text-foreground hover:bg-primary/30"
              >
                <Play size={17} fill="currentColor" aria-hidden="true" />
                {t("dashboard.actions.start_meditating")}
              </Link>
            </div>
          </section>

          <section aria-labelledby="explore-title">
            <h2 id="explore-title" className="app-section-title mb-3">
              {t("interface.practice_and_learn")}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                {
                  href: "/kamatahan",
                  icon: Headphones,
                  title: t("interface.guided_practice"),
                  description: t("interface.listen_description"),
                },
                {
                  href: "/dhamma",
                  icon: BookOpen,
                  title: t("navigation.dhamma"),
                  description: t("interface.learn_description"),
                },
              ].map(({ href, icon: Icon, title, description }) => (
                <Link
                  key={href}
                  href={href}
                  className="app-card p-4 transition-colors hover:border-primary/50 sm:p-5"
                >
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon size={23} strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <h3 className="mb-1 font-semibold leading-relaxed">
                    {title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {description}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <EventBanner />

          <div className="grid gap-8 lg:grid-cols-2">
            <section aria-labelledby="recent-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="recent-title" className="app-section-title">
                  {t("dashboard.recent_sessions.title")}
                </h2>
                <Link
                  href="/logbook"
                  className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground"
                >
                  {t("common.view_all")}
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <div className="app-card overflow-hidden divide-y divide-border/60">
                {loading ? (
                  <p
                    role="status"
                    className="p-6 text-sm text-muted-foreground"
                  >
                    {t("common.loading")}
                  </p>
                ) : sessionsError ? (
                  <div role="alert" className="p-5">
                    <AlertCircle size={22} className="mb-2" />
                    <p className="text-sm">{t("interface.history_error")}</p>
                    <button
                      onClick={() => setAttempt((value) => value + 1)}
                      className="mt-3 min-h-11 text-sm font-semibold underline"
                    >
                      {t("common.retry")}
                    </button>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-6">
                    <Flower2
                      size={28}
                      className="mb-3 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <h3 className="font-semibold">
                      {t("interface.first_session")}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t("interface.first_session_description")}
                    </p>
                  </div>
                ) : (
                  sessions.slice(0, 3).map((session) => (
                    <Link key={session.id} href="/logbook" className="app-row">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Flower2 size={20} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold">
                          {session.typeName}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {session.createdAt.toLocaleDateString(
                            language === "si" ? "si-LK" : "en-GB",
                            { month: "short", day: "numeric" },
                          )}{" "}
                          ·{" "}
                          {t("interface.minutes", { count: session.duration })}
                        </p>
                      </div>
                      <ChevronRight
                        size={17}
                        className="shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section aria-labelledby="reading-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="reading-title" className="app-section-title">
                  {t("interface.dhamma_reading")}
                </h2>
                <Link
                  href="/dhamma"
                  className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground"
                >
                  {t("common.view_all")}
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <div className="app-card overflow-hidden divide-y divide-border/60">
                {loading ? (
                  <p
                    role="status"
                    className="p-6 text-sm text-muted-foreground"
                  >
                    {t("common.loading")}
                  </p>
                ) : postsError ? (
                  <div role="alert" className="p-5">
                    <p className="text-sm">{t("interface.content_error")}</p>
                    <button
                      onClick={() => setAttempt((value) => value + 1)}
                      className="mt-3 min-h-11 text-sm font-semibold underline"
                    >
                      {t("common.retry")}
                    </button>
                  </div>
                ) : posts.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    {t("dhamma.no_posts")}
                  </p>
                ) : (
                  posts.map((post) => (
                    <Link
                      href={`/dhamma/${post.id}`}
                      key={post.id}
                      className="app-row"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                        <BookOpen size={21} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-relaxed">
                          {post.title}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={12} aria-hidden="true" />
                          {t("interface.reading_minutes", {
                            count: post.readTime || 5,
                          })}
                        </p>
                      </div>
                      <ChevronRight
                        size={17}
                        className="shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>

          <section aria-labelledby="resources-title">
            <h2 id="resources-title" className="app-section-title mb-3">
              {t("interface.deeper_learning")}
            </h2>
            <div className="app-card grid overflow-hidden sm:grid-cols-2">
              {resources.map(({ href, icon: Icon, label, detail }) => (
                <Link
                  key={href}
                  href={href}
                  className="app-row border-b border-border/60 last:border-b-0"
                >
                  <Icon
                    size={23}
                    className="shrink-0 text-muted-foreground"
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">{label}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {detail}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </section>

          <a
            href="https://chat.whatsapp.com/GODZJiLKe60DGRHDzCP9S7"
            target="_blank"
            rel="noopener noreferrer"
            className="app-card app-row"
          >
            <MessageCircle
              size={23}
              className="shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h2 className="text-sm font-semibold">
                {t("interface.community")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("interface.community_description")}
              </p>
            </div>
            <ChevronRight size={17} aria-hidden="true" />
          </a>
        </div>
      </AppPage>
    </ProtectedRoute>
  );
}
