"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DhammaService } from "@/lib/dhammaService";
import { DhammaPost } from "@/types/admin";
import { Search, Clock, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { DhammaPostCard } from "./DhammaPostCard";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

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
      <div className="mb-12 space-y-8">
        {/* Search Bar */}
        <div className="relative group max-w-2xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by title or content..."
            className="w-full rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 px-14 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-lg"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide justify-center px-4">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 backdrop-blur-md border ${activeCategory === c
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-105'
                  : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground hover:border-white/20'
                }`}
            >
              {c === 'all' ? '✨ All Articles' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Article */}
      {featured && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-4 px-1">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h3 className="text-lg font-bold text-foreground">Featured Article</h3>
          </div>
          <article
            onClick={() => router.push(`/dhamma/${featured.id}`)}
            className="group relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer"
          >
            <div className="relative h-64 sm:h-96 overflow-hidden">
              {featured.featuredImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.featuredImage}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              <div className="absolute top-6 left-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/90 backdrop-blur-sm text-white text-xs font-semibold shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Featured
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                <div className="max-w-3xl">
                  {featured.category && (
                    <div className="inline-block px-3 py-1 mb-4 rounded-full bg-primary/20 backdrop-blur-md border border-primary/20 text-primary-foreground text-xs font-bold uppercase tracking-wider">
                      {featured.category}
                    </div>
                  )}
                  <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-primary-foreground transition-colors">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-white/80 text-base sm:text-lg line-clamp-2 mb-6 max-w-2xl leading-relaxed">
                      {featured.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-6 text-sm text-white/70 font-medium">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{featured.readTime || 5} min read</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Trending Now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </motion.div>
      )}

      {/* Recent Articles Grid */}
      <div className="mb-6 px-1">
        <h3 className="text-xl font-bold text-foreground">Recent Articles</h3>
      </div>

      {recent.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {recent.map((p) => (
            <motion.div key={p.id} variants={item}>
              <DhammaPostCard post={p} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <Search className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No articles found</h3>
          <p className="text-muted-foreground max-w-sm">
            We couldn&apos;t find any articles matching your search. Try adjusting your filters.
          </p>
          <button
            onClick={() => { setSearch(''); setActiveCategory('all'); }}
            className="mt-6 px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
