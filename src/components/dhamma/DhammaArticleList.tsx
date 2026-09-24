"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DhammaService } from "@/lib/dhammaService";
import type { DhammaPost } from "@/types/admin";
import { Search, Clock, BookOpen, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DhammaPostCard } from "./DhammaPostCard";

export function DhammaArticleList() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<DhammaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    DhammaService.getPublishedPosts()
      .then((data) => {
        if (!cancelled) setPosts(data);
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
  }, [attempt]);

  const categories = useMemo(
    () => ["all", ...new Set(posts.map((p) => p.category).filter(Boolean))],
    [posts],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return posts.filter(
      (post) =>
        (!query ||
          `${post.title} ${post.excerpt || ""}`
            .toLocaleLowerCase()
            .includes(query)) &&
        (activeCategory === "all" || post.category === activeCategory),
    );
  }, [posts, search, activeCategory]);
  const isFiltering = search.trim() !== "" || activeCategory !== "all";
  const featured = !isFiltering
    ? posts.find((post) => post.featured)
    : undefined;
  const articles = filtered.filter((post) => post.id !== featured?.id);

  return (
    <div className="space-y-6">
      <div role="search" className="relative">
        <Search
          size={19}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label={t("dhamma.search")}
          placeholder={t("dhamma.search")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-h-12 w-full rounded-2xl border border-border bg-background py-3 pl-12 pr-14 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {search && (
          <button
            type="button"
            aria-label={t("interface.clear_search")}
            onClick={() => setSearch("")}
            className="absolute right-1 top-1 flex h-10 w-11 items-center justify-center rounded-xl"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <div
        role="group"
        aria-label={t("dhamma.categories")}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={activeCategory === category}
            onClick={() => setActiveCategory(category)}
            className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${activeCategory === category ? "border-primary/40 bg-primary/15 text-foreground" : "border-border bg-background text-muted-foreground"}`}
          >
            {category === "all"
              ? t("dhamma.filters.all")
              : t("reader.category_" + category)}
          </button>
        ))}
      </div>
      {loading ? (
        <p
          role="status"
          className="app-card p-8 text-center text-sm text-muted-foreground"
        >
          {t("common.loading")}
        </p>
      ) : error ? (
        <div role="alert" className="app-card p-6">
          <p>{t("interface.content_error")}</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-3 min-h-11 font-semibold underline"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : (
        <>
          {featured && (
            <section aria-labelledby="featured-title">
              <h2 id="featured-title" className="app-section-title mb-3">
                {t("interface.featured_reading")}
              </h2>
              <Link
                href={`/dhamma/${featured.id}`}
                aria-label={featured.title}
                className="app-card grid overflow-hidden sm:grid-cols-2"
              >
                <div className="relative min-h-44 bg-primary/10">
                  {featured.featuredImage ? (
                    <Image
                      src={featured.featuredImage}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 480px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-44 items-center justify-center">
                      <BookOpen
                        size={48}
                        strokeWidth={1}
                        className="text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
                <div className="p-5 sm:p-6">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {t("reader.category_" + featured.category)}
                  </p>
                  <h3 className="text-xl font-semibold leading-relaxed">
                    {featured.title}
                  </h3>
                  {featured.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {featured.excerpt}
                    </p>
                  )}
                  {featured.readTime > 0 && (
                    <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock size={14} aria-hidden="true" />
                      {t("interface.reading_minutes", {
                        count: featured.readTime,
                      })}
                    </p>
                  )}
                </div>
              </Link>
            </section>
          )}
          {articles.length > 0 && (
            <section aria-labelledby="articles-title">
              <h2 id="articles-title" className="app-section-title mb-3">
                {isFiltering
                  ? t("interface.search_results", { count: articles.length })
                  : t("interface.latest_teachings")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((post) => (
                  <DhammaPostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
          {filtered.length === 0 && (
            <div role="status" className="app-card p-8 text-center">
              <BookOpen
                size={32}
                className="mx-auto mb-3 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="font-semibold">{t("dhamma.no_posts")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isFiltering
                  ? t("interface.no_results")
                  : t("interface.no_teachings")}
              </p>
              {isFiltering && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("all");
                  }}
                  className="mt-4 min-h-11 rounded-xl bg-muted px-5 text-sm font-semibold"
                >
                  {t("interface.clear_filters")}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
