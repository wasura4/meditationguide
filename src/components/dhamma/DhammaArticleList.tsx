"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DhammaService } from "@/lib/dhammaService";
import { DhammaPost } from "@/types/admin";
import { Search, Clock, Star, TrendingUp } from "lucide-react";

export function DhammaArticleList() {
  const router = useRouter();
  const [posts, setPosts] = useState<DhammaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await DhammaService.getPublishedPosts();
        setPosts(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.category && set.add(p.category));
    return ["all", ...Array.from(set)];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesQ = !q ||
        p.title?.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q);
      const matchesCat = activeCategory === "all" || p.category === activeCategory;
      return matchesQ && matchesCat;
    });
  }, [posts, search, activeCategory]);

  const featured = useMemo(() => {
    const f = filtered.find((p) => p.featured);
    return f || filtered[0];
  }, [filtered]);

  const recent = useMemo(() => {
    if (!featured) return filtered;
    return filtered.filter((p) => p.id !== featured.id);
  }, [filtered, featured]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground font-medium">Loading articles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by title or content..."
            className="w-full rounded-xl bg-muted/60 border border-border px-12 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeCategory === c
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                  : 'bg-background text-foreground border-border hover:bg-muted hover:border-primary/30'
              }`}
            >
              {c === 'all' ? '✨ All Articles' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Article */}
      {featured && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h3 className="text-lg font-bold text-foreground">Featured Article</h3>
          </div>
          <article
            onClick={() => router.push(`/dhamma/${featured.id}`)}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
          >
            <div className="relative h-64 sm:h-80 overflow-hidden">
              {featured.featuredImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.featuredImage}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-semibold shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Featured
                </span>
              </div>
            </div>
            <div className="p-6">
              {featured.category && (
                <div className="inline-block px-3 py-1 mb-3 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                  {featured.category}
                </div>
              )}
              <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p className="text-muted-foreground line-clamp-2 mb-4">{featured.excerpt}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{featured.readTime || 5} min read</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Trending</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      )}

      {/* Recent Articles Grid */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground mb-4">Recent Articles</h3>
      </div>

      {recent.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recent.map((p) => (
            <article
              key={p.id}
              onClick={() => router.push(`/dhamma/${p.id}`)}
              className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                {p.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.featuredImage}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-5">
                {p.category && (
                  <div className="inline-block px-2.5 py-0.5 mb-2 rounded-md bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                    {p.category}
                  </div>
                )}
                <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {p.title}
                </h3>
                {p.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.excerpt}</p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{p.readTime || 5} min read</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No articles found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try adjusting your search or filter to find what you&apos;re looking for.
          </p>
        </div>
      )}
    </div>
  );
}
