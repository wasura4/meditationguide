"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Headphones, ChevronRight, Flower2, BookMarked, Library, MessageCircle, Route, UserRound, Leaf } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardPractice } from "@/components/dashboard/DashboardPractice";
import { MeditationService } from "@/lib/meditationService";
import { DhammaService } from "@/lib/dhammaService";
import type { MeditationSession } from "@/types";
import type { DhammaPost } from "@/types/admin";
import { EventBanner } from "@/components/events/EventBanner";
import { DailyCheckinCard } from "@/components/checkins/CheckinCards";

function DashboardContent() {
  const { user } = useAuth();
  const userId = user?.id;
  const { t, language } = useLanguage();
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [posts, setPosts] = useState<DhammaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(false);
  const [postsError, setPostsError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let request = 0;
    let lastDay = "";
    async function refresh() {
      const current = ++request;
      setLoading(true);
      const date = new Date();
      lastDay = date.toDateString();
      setNow(date);
      const [sessionResult, postResult] = await Promise.allSettled([
        MeditationService.getAllUserSessions(userId!),
        DhammaService.getPublishedPosts(),
      ]);
      if (cancelled || current !== request) return;
      setSessionsError(sessionResult.status === "rejected");
      setPostsError(postResult.status === "rejected");
      if (sessionResult.status === "fulfilled") setSessions(sessionResult.value);
      if (postResult.status === "fulfilled") setPosts(postResult.value.slice(0, 2));
      setLoading(false);
    }
    const onVisible = () => { if (!document.hidden) void refresh(); };
    void refresh();
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => {
      if (new Date().toDateString() !== lastDay) onVisible();
    }, 60000);
    return () => { cancelled = true; clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [userId, attempt]);

  const resources = [
    { href: "/learn", icon: Route, label: t("home.learning_paths") },
    { href: "/mypath", icon: Flower2, label: t("dashboard.quick_actions_labels.my_path") },
    { href: "/pitaka", icon: BookMarked, label: t("dashboard.quick_actions_labels.tripitaka") },
    { href: "/books", icon: Library, label: t("interface.books") },
    { href: "/meditation-questions", icon: MessageCircle, label: t("interface.questions") },
  ];
  const locale = language === "si" ? "si-LK" : "en-GB";
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return <div className="home-dashboard">
    <div className="home-backdrop" aria-hidden="true">
      <Image src="/images/dashboard-sanctuary.png" alt="" fill priority unoptimized={false} sizes="(max-width: 768px) 100vw, 1200px" className="home-scenery" />
      <div className="home-image-veil" />
    </div>
    <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
      <header className="home-header flex items-center justify-between gap-3">
        <Link href="/dashboard" className="flex min-h-11 items-center gap-2.5 text-base font-semibold tracking-tight"><Leaf size={25} strokeWidth={1.5} aria-hidden="true" />{t("app.name")}</Link>
        <Link href="/settings" aria-label={t("navigation.settings")} className="home-profile flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"><UserRound size={23} strokeWidth={1.6} aria-hidden="true" /></Link>
      </header>
      <main>
        <section className="home-welcome" aria-labelledby="home-title">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{t("home.eyebrow")}</p>
          <h1 id="home-title" className="home-title max-w-[12ch] font-medium tracking-tight">{t("home.headline")}</h1>
          <p className="mt-4 max-w-[28ch] text-base leading-relaxed sm:text-lg">{t("home.welcome", { name: user?.displayName || t("interface.practitioner") })}</p>
        </section>
        <div className="home-content space-y-6 pb-8">
          <DashboardPractice sessions={sessions} loading={loading} error={sessionsError} retry={() => setAttempt(value => value + 1)} now={now} />
          <DailyCheckinCard />
          <section aria-labelledby="home-listen-title">
            <h2 id="home-listen-title" className="mb-3 text-lg font-semibold tracking-tight">{t("home.practice_for_you")}</h2>
            <Link href="/kamatahan" className="home-glass flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
              <span className="home-listen-art flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-20 sm:w-20"><Flower2 className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1} aria-hidden="true" /></span>
              <div className="min-w-0 flex-1"><h3 className="font-semibold leading-relaxed">{t("interface.guided_practice")}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{t("home.listen_hint")}</p></div>
              <span className="home-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full"><Headphones size={20} aria-hidden="true" /></span>
            </Link>
          </section>
          <EventBanner />
          <section aria-labelledby="home-reading-title">
            <div className="mb-2 flex items-center justify-between gap-3"><h2 id="home-reading-title" className="text-lg font-semibold">{t("interface.dhamma_reading")}</h2><Link href="/dhamma" className="flex min-h-11 items-center gap-1 text-xs font-medium">{t("common.view_all")}<ChevronRight size={15} /></Link></div>
            <div className="home-glass divide-y divide-border/60 overflow-hidden">
              {loading ? <p role="status" className="p-5 text-sm text-muted-foreground">{t("common.loading")}</p> : postsError ? <div role="alert" className="p-5 text-sm"><p>{t("interface.content_error")}</p><button onClick={() => setAttempt(value => value + 1)} className="min-h-11 underline">{t("common.retry")}</button></div> : posts.length ? posts.map(post => <Link key={post.id} href={`/dhamma/${post.id}`} className="app-row">
                <BookOpen size={23} className="shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><h3 className="line-clamp-2 text-sm font-semibold leading-relaxed">{post.title}</h3><p className="mt-1 text-xs text-muted-foreground">{t("interface.reading_minutes", { count: post.readTime || 5 })}</p></div><ChevronRight size={17} aria-hidden="true" />
              </Link>) : <p className="p-5 text-sm text-muted-foreground">{t("dhamma.no_posts")}</p>}
            </div>
          </section>
          <details className="home-glass p-5">
            <summary className="cursor-pointer text-base font-semibold">{t("home.more")}</summary>
            <div className="mt-4 space-y-5">
              <section aria-labelledby="recent-title"><div className="flex items-center justify-between"><h2 id="recent-title" className="text-sm font-semibold">{t("dashboard.recent_sessions.title")}</h2><Link href="/logbook" className="flex min-h-11 items-center gap-1 text-xs">{t("common.view_all")}<ChevronRight size={15} /></Link></div>
                {loading ? <p className="text-sm text-muted-foreground">{t("common.loading")}</p> : sessionsError ? <p className="text-sm text-muted-foreground">{t("interface.history_error")}</p> : sessions.length ? sessions.slice(0, 3).map(session => <Link key={session.id} href="/logbook" className="flex min-h-16 items-center justify-between gap-3 border-t border-border/60 py-3 text-sm"><span className="min-w-0"><span className="line-clamp-1 font-medium">{session.typeName}</span><span className="mt-1 block text-xs text-muted-foreground">{session.startTime.toLocaleDateString(locale, { month: "short", day: "numeric" })} · {t("interface.minutes", { count: number.format(session.duration) })} · {t(session.status === "completed" ? "logbook.session_details.completed_at" : "home.ended_early")}</span></span><ChevronRight size={17} className="shrink-0" /></Link>) : <p className="text-sm text-muted-foreground">{t("interface.first_session_description")}</p>}
              </section>
              <nav aria-label={t("interface.deeper_learning")} className="grid gap-2 sm:grid-cols-2">{resources.map(({href, icon:Icon, label}) => <Link key={href} href={href} className="flex min-h-12 items-center gap-3 rounded-xl border border-border/60 px-3 text-sm"><Icon size={19} aria-hidden="true" /><span className="flex-1">{label}</span><ChevronRight size={15} aria-hidden="true" /></Link>)}</nav>
              <a href="https://chat.whatsapp.com/GODZJiLKe60DGRHDzCP9S7" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2 text-sm font-medium"><MessageCircle size={18} />{t("interface.community")}<ChevronRight size={15} /></a>
            </div>
          </details>
        </div>
      </main>
    </div>
  </div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  return <ProtectedRoute><DashboardContent key={user?.id || "signed-out"} /></ProtectedRoute>;
}
