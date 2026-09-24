"use client";
import { useState } from "react";
import Link from "next/link";
import { Route, Users, ChevronRight, BookOpen } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppPage } from "@/components/app/AppPage";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminLibrary } from "@/hooks/useAdminLibrary";
import {
  learningText,
  LEARNING_TOPICS,
  LEARNING_LEVELS,
  type Teacher,
  type LearningPath,
} from "@/lib/learning";
export default function LearningPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"paths" | "teachers">("paths");
  return (
    <ProtectedRoute>
      <AppPage
        title={t("learning.title")}
        subtitle={t("learning.subtitle")}
        backHref="/dhamma"
      >
        <div
          role="group"
          aria-label={t("learning.browse")}
          className="mb-6 flex gap-2 rounded-2xl bg-muted p-1"
        >
          <button
            className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold ${tab === "paths" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            aria-pressed={tab === "paths"}
            onClick={() => setTab("paths")}
          >
            {t("learning.paths")}
          </button>
          <button
            className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold ${tab === "teachers" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            aria-pressed={tab === "teachers"}
            onClick={() => setTab("teachers")}
          >
            {t("learning.teachers")}
          </button>
        </div>
        <Catalog key={tab} tab={tab} />
      </AppPage>
    </ProtectedRoute>
  );
}
function Catalog({ tab }: { tab: "paths" | "teachers" }) {
  const { t, language } = useLanguage(),
    library = useAdminLibrary(
      tab === "paths" ? "learning_paths" : "teachers",
      "published",
    );
  const [search, setSearch] = useState(""),
    [topic, setTopic] = useState("all"),
    [level, setLevel] = useState("all");
  const items = (
    library.records as unknown as (Teacher | LearningPath)[]
  ).filter(
    (item) =>
      ("title" in item ? [item.title, item.titleEn] : [item.name, item.nameEn])
        .join(" ")
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()) &&
      (!("topic" in item) ||
        ((topic === "all" || topic === item.topic) &&
          (level === "all" || level === item.level))),
  );
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <label className="block">
          <span className="sr-only">{t("learning.search")}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("learning.search")}
            className="min-h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm"
          />
        </label>
        {tab === "paths" && (
          <div className="grid grid-cols-2 gap-3">
            <select
              aria-label={t("learning.topic")}
              className="min-h-11 rounded-xl border border-input bg-card px-3 text-sm"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            >
              <option value="all">{t("learning.all_topics")}</option>
              {LEARNING_TOPICS.map((value) => (
                <option key={value} value={value}>
                  {t(`learning.topic_${value}`)}
                </option>
              ))}
            </select>
            <select
              aria-label={t("learning.level")}
              className="min-h-11 rounded-xl border border-input bg-card px-3 text-sm"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            >
              <option value="all">{t("learning.all_levels")}</option>
              {LEARNING_LEVELS.map((value) => (
                <option key={value} value={value}>
                  {t(`learning.level_${value}`)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {library.error ? (
        <div role="alert" className="app-card p-6">
          <p>{t("learning.load_error")}</p>
          <Button variant="outline" className="mt-4" onClick={library.reload}>
            {t("common.retry")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={
                "title" in item ? `/learn/${item.id}` : `/teachers/${item.id}`
              }
              className="app-card group flex flex-col p-5 transition-colors hover:bg-muted/40"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-primary">
                  {"title" in item ? <Route size={23} /> : <Users size={23} />}
                </span>
                <ChevronRight size={18} className="text-muted-foreground" />
              </div>
              {"title" in item && (
                <p className="mb-2 text-xs text-muted-foreground">
                  {t(`learning.topic_${item.topic}`)} ·{" "}
                  {t(`learning.level_${item.level}`)}
                </p>
              )}
              <h2 className="text-lg font-semibold leading-relaxed">
                {"title" in item
                  ? learningText(item.title, item.titleEn, language)
                  : learningText(item.name, item.nameEn, language)}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {"description" in item
                  ? learningText(item.description, item.descriptionEn, language)
                  : learningText(item.bio, item.bioEn, language)}
              </p>
              {"lessons" in item && (
                <p className="mt-5 flex items-center gap-2 text-xs font-medium">
                  <BookOpen size={15} />
                  {t("learning.lesson_count", {
                    count: item.lessons.length,
                  })}{" "}
                  · {t(`learning.language_${item.language}`)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
      {library.loading && !items.length && (
        <p role="status" className="p-8 text-center text-muted-foreground">
          {t("common.loading")}
        </p>
      )}
      {!library.loading && !library.error && !items.length && (
        <div className="app-card p-8 text-center">
          <Route className="mx-auto mb-4 text-primary" />
          <h2 className="font-semibold">
            {t(
              search || topic !== "all" || level !== "all"
                ? "learning.no_matches"
                : "learning.coming_soon",
            )}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("learning.empty_hint")}
          </p>
        </div>
      )}
      {library.hasMore && (
        <Button
          className="w-full"
          variant="outline"
          loading={library.loading}
          onClick={library.loadMore}
        >
          {t("learning.load_more")}
        </Button>
      )}
      <p className="text-center text-xs text-muted-foreground">
        {t("learning.loaded", { count: library.records.length })}
      </p>
    </div>
  );
}
