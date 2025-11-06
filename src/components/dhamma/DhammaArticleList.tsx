"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DhammaService } from "@/lib/dhammaService";
import { DhammaPost } from "@/types/admin";

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
      <div className="py-12 text-center text-muted-foreground">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--ring)] mx-auto"></div>
        <p className="mt-3">Loading articles…</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md md:max-w-3xl mx-auto">
      {/* Search */}
      <div className="relative mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for articles…"
          className="w-full rounded-xl bg-muted/60 border border-border px-4 py-3 pl-11 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <svg className="w-5 h-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
        </svg>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3 py-1.5 rounded-full border text-sm whitespace-nowrap transition-colors ${
              activeCategory === c
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent'
                : 'bg-background text-foreground border-border hover:bg-muted'
            }`}
          >
            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Featured */}
      {featured && (
        <article
          onClick={() => router.push(`/dhamma/${featured.id}`)}
          className="rounded-xl overflow-hidden bg-card text-card-foreground border border-border shadow-sm cursor-pointer"
        >
          {featured.featuredImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={featured.featuredImage} alt={featured.title} className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-40 bg-gradient-to-br from-muted to-muted/40" />
          )}
          <div className="p-4">
            <p className="text-xs font-semibold text-[var(--primary)]">Featured Article</p>
            <h2 className="mt-1 text-lg font-semibold">{featured.title}</h2>
            {featured.excerpt && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{featured.excerpt}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{featured.readTime || 5} min read</p>
          </div>
        </article>
      )}

      {/* Recent */}
      <h3 className="mt-8 mb-3 text-base font-semibold">Recent Articles</h3>
      <div className="space-y-3">
        {recent.map((p) => (
          <div
            key={p.id}
            onClick={() => router.push(`/dhamma/${p.id}`)}
            className="flex gap-3 rounded-xl bg-card text-card-foreground border border-border p-3 items-center cursor-pointer hover:bg-muted/40 transition"
          >
            {p.featuredImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.featuredImage} alt={p.title} className="w-16 h-16 rounded-md object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-md bg-muted" />
            )}
            <div className="flex-1 min-w-0">
              {p.category && (
                <div className="text-[10px] font-semibold tracking-wide uppercase text-[var(--primary)]">{p.category}</div>
              )}
              <div className="text-sm font-medium truncate">{p.title}</div>
              <div className="text-xs text-muted-foreground">{p.readTime || 5} min read</div>
            </div>
          </div>
        ))}
        {recent.length === 0 && (
          <p className="text-sm text-muted-foreground">No articles found.</p>
        )}
      </div>
    </div>
  );
}

