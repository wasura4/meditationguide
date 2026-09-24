"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Share2,
  Type,
  Clock,
  BookOpen,
} from "lucide-react";
import type { DhammaPost } from "@/types/admin";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { recordDhammaRead } from "@/lib/metricsService";
import { isFavorited, setFavorite } from "@/lib/favoritesService";
import { prepareArticle, type PreparedArticle } from "@/lib/articleContent";
import { Button } from "@/components/ui/button";

const SIZE_KEY = "nirvanaya-reader-size";
const SIZES = [18, 20, 23] as const;
const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

export function DhammaPostReader({
  post,
  onClose,
}: {
  post: DhammaPost;
  onClose: () => void;
}) {
  const { user } = useAuth();
  return (
    <Reader
      key={post.id + ":" + (user?.id || "guest")}
      post={post}
      onClose={onClose}
      userId={user?.id}
    />
  );
}

function Reader({
  post,
  onClose,
  userId,
}: {
  post: DhammaPost;
  onClose: () => void;
  userId?: string;
}) {
  const { t, language } = useLanguage();
  const [article, setArticle] = useState<PreparedArticle | null>(null);
  // Keep the HTML prop stable so toolbar actions do not reload embedded players.
  const articleMarkup = useMemo(
    () => ({ __html: article?.html || "" }),
    [article],
  );
  const [contentError, setContentError] = useState(false);
  const [size, setSize] = useState<number>(20);
  const [showOptions, setShowOptions] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveState, setSaveState] = useState<
    "loading" | "ready" | "error" | "saving"
  >("loading");
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [notice, setNotice] = useState("");
  const [sharing, setSharing] = useState(false);
  const writePending = useRef(false);
  const recorded = useRef(false);

  useEffect(() => {
    try {
      setArticle(prepareArticle(post.content, window));
      setContentError(false);
    } catch {
      setContentError(true);
    }
  }, [post.content]);

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(SIZE_KEY));
      if (SIZES.some((value) => value === stored)) setSize(stored);
    } catch {
      /* Reading controls still work when storage is unavailable. */
    }
  }, []);

  useEffect(() => {
    if (userId && article && !recorded.current) {
      recorded.current = true;
      void recordDhammaRead(post.id, userId);
    }
  }, [article, post.id, userId]);

  useEffect(() => {
    if (!userId) {
      setSaveState("ready");
      return;
    }
    let cancelled = false;
    setSaveState("loading");
    isFavorited(userId, post.id)
      .then((value) => {
        if (!cancelled) {
          setSaved(value);
          setSaveState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setSaveState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [userId, post.id, saveAttempt]);

  const changeSize = (value: number) => {
    setSize(value);
    try {
      localStorage.setItem(SIZE_KEY, String(value));
    } catch {
      /* In-memory preference remains usable. */
    }
  };
  const save = async () => {
    if (!userId || saveState !== "ready" || writePending.current) return;
    writePending.current = true;
    setSaveState("saving");
    setNotice("");
    try {
      await setFavorite(userId, post.id, !saved);
      setSaved(!saved);
      setSaveState("ready");
      setNotice(t(saved ? "reader.removed" : "reader.saved_notice"));
    } catch {
      // Re-read server state before another write in case the outcome is uncertain.
      setSaveState("error");
    } finally {
      writePending.current = false;
    }
  };
  const share = async () => {
    if (sharing) return;
    setSharing(true);
    setNotice("");
    const url = new URL(
      "/dhamma/" + encodeURIComponent(post.id),
      window.location.origin,
    ).href;
    try {
      if (navigator.share) await navigator.share({ title: post.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setNotice(t("reader.link_copied"));
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setNotice(t("reader.share_error"));
    } finally {
      setSharing(false);
    }
  };
  const published = post.publishedAt || post.createdAt;
  const validDate = published && Number.isFinite(new Date(published).getTime());
  const dateLabel = validDate
    ? language === "si"
      ? `${new Date(published).getDate()} ${t("journal." + MONTHS[new Date(published).getMonth()])} ${new Date(published).getFullYear()}`
      : new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(published))
    : "";
  const bookmarkLabel = t(saved ? "reader.remove_saved" : "reader.save");
  const bookmark = userId ? (
    <button
      type="button"
      className="app-icon-button disabled:opacity-50"
      aria-label={bookmarkLabel}
      aria-pressed={saved}
      disabled={saveState !== "ready"}
      onClick={save}
    >
      <Bookmark
        size={20}
        fill={saved ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </button>
  ) : (
    <Link
      href="/auth"
      className="app-icon-button"
      aria-label={t("reader.sign_in_save")}
    >
      <Bookmark size={20} aria-hidden="true" />
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="app-toolbar">
        <div className="mx-auto flex min-h-16 max-w-3xl items-center justify-between gap-2 px-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center gap-1 text-sm font-medium"
          >
            <ChevronLeft size={21} aria-hidden="true" />
            {t("navigation.dhamma")}
          </button>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className="app-icon-button"
              aria-label={t("reader.appearance")}
              aria-expanded={showOptions}
              aria-controls="reader-options"
              onClick={() => setShowOptions(!showOptions)}
            >
              <Type size={20} aria-hidden="true" />
            </button>
            {bookmark}
            <button
              type="button"
              className="app-icon-button disabled:opacity-50"
              aria-label={t("reader.share")}
              disabled={sharing}
              onClick={share}
            >
              <Share2 size={19} aria-hidden="true" />
            </button>
          </div>
        </div>
        {showOptions && (
          <section
            id="reader-options"
            aria-label={t("reader.appearance")}
            className="mx-auto max-w-3xl border-t border-border/60 px-5 py-4"
          >
            <p className="mb-3 text-sm font-medium">{t("reader.text_size")}</p>
            <div className="app-segment grid grid-cols-3 gap-1">
              {SIZES.map((value, index) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={size === value}
                  onClick={() => changeSize(value)}
                  className={`min-h-11 rounded-xl px-2 py-2 text-sm ${size === value ? "bg-background font-semibold shadow-sm" : "text-muted-foreground"}`}
                >
                  {t(
                    ["reader.standard", "reader.comfortable", "reader.large"][
                      index
                    ],
                  )}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("reader.device_preference")}
            </p>
          </section>
        )}
      </header>
      <main className="mx-auto max-w-[740px] px-5 pb-10 pt-8 sm:px-8 sm:pt-12">
        {saveState === "error" && (
          <div role="alert" className="mb-5 rounded-2xl bg-muted p-4 text-sm">
            <p>{t("reader.save_error")}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setSaveAttempt((value) => value + 1)}
            >
              {t("common.retry")}
            </Button>
          </div>
        )}
        <div
          role="status"
          aria-live="polite"
          className={
            notice ? "mb-5 rounded-2xl bg-muted p-4 text-sm" : "sr-only"
          }
        >
          {notice}
        </div>
        <article lang={post.language}>
          <header className="mb-7">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-full bg-primary/10 px-3 py-1.5">
                {t("reader.category_" + post.category)}
              </span>
              <span className="px-1 text-muted-foreground">
                {{ en: "English", si: "සිංහල", pa: "Pāli" }[post.language]}
              </span>
            </div>
            <h1 className="text-[1.8rem] font-bold leading-[1.5] tracking-tight sm:text-[2.5rem]">
              {post.title}
            </h1>
            {post.excerpt && article && !article.videoOnly && (
              <p
                className="mt-4 leading-[1.85] text-muted-foreground"
                style={{ fontSize: size }}
              >
                {post.excerpt}
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm leading-relaxed text-muted-foreground">
              {post.authorName && (
                <span className="font-medium text-foreground">
                  {post.authorName}
                </span>
              )}
              {dateLabel && (
                <time dateTime={new Date(published).toISOString()}>
                  {dateLabel}
                </time>
              )}
              {post.readTime > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} aria-hidden="true" />
                  {t("interface.reading_minutes", { count: post.readTime })}
                </span>
              )}
            </div>
          </header>
          {post.featuredImage && article && !article.videoOnly && (
            <Image
              src={post.featuredImage}
              alt=""
              width={1200}
              height={800}
              priority
              className="mb-8 max-h-[420px] w-full rounded-3xl bg-muted object-contain"
            />
          )}
          {article && article.sections.length > 1 && (
            <details className="mb-8 rounded-2xl border border-border bg-muted/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold leading-relaxed">
                {t("reader.contents")}
              </summary>
              <nav
                aria-label={t("reader.contents")}
                className="mt-3 flex flex-col"
              >
                {article.sections.map((section) => (
                  <a
                    key={section.id}
                    href={"#" + section.id}
                    className={`min-h-11 py-2 text-sm leading-relaxed underline-offset-4 hover:underline ${section.level === 3 ? "pl-4 text-muted-foreground" : ""}`}
                    onClick={(event) => {
                      event.preventDefault();
                      const heading = document.getElementById(section.id);
                      heading?.scrollIntoView({ block: "start" });
                      heading?.focus({ preventScroll: true });
                    }}
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </details>
          )}
          {contentError ? (
            <p role="alert">{t("reader.content_error")}</p>
          ) : article ? (
            <div
              className="reader-content"
              style={{ fontSize: size }}
              dangerouslySetInnerHTML={articleMarkup}
            />
          ) : (
            <p role="status" className="animate-pulse text-muted-foreground">
              {t("common.loading")}
            </p>
          )}
          {article?.videoOnly && post.excerpt && (
            <p
              className="mt-6 leading-[1.95] text-muted-foreground"
              style={{ fontSize: size }}
            >
              {post.excerpt}
            </p>
          )}
          {post.tags?.length > 0 && (
            <ul
              aria-label={t("reader.topics")}
              className="mt-10 flex flex-wrap gap-2"
            >
              {post.tags.map((tag, index) => (
                <li
                  key={tag + index}
                  className="max-w-full break-words rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </article>
        <footer className="mt-10 space-y-5 border-t border-border pt-8">
          <div className="flex items-start gap-3">
            <BookOpen
              size={23}
              className="mt-1 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-semibold">{t("reader.reflect_title")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t("reader.reflect_description")}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="app-card flex min-h-14 items-center justify-between gap-2 px-4 py-3 text-sm font-medium"
            >
              {t("reader.more_articles")}
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <Link
              href="/dhamma/saved"
              className="app-card flex min-h-14 items-center justify-between gap-2 px-4 py-3 text-sm font-medium"
            >
              {t("reader.saved_articles")}
              {saved ? (
                <Check size={18} aria-hidden="true" />
              ) : (
                <Bookmark size={18} aria-hidden="true" />
              )}
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
