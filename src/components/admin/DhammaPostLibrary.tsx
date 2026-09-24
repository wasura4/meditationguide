"use client";
import { useMemo, useState } from "react";
import {
  Archive,
  BookOpen,
  History,
  Undo2,
  FilePenLine,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAdminLibrary } from "@/hooks/useAdminLibrary";
import { DhammaService } from "@/lib/dhammaService";
import type { DhammaPost } from "@/types/admin";
import { LibraryToolbar, LibraryFooter } from "./LibraryToolbar";
import { AdminDialog } from "./AdminDialog";
import { ArticleHistory } from "./ArticleHistory";
import { ArticleSummary } from "./ArticlePreview";
export default function DhammaPostLibrary({
  onEditPost,
}: {
  onEditPost: (post: DhammaPost) => void;
  onRefresh?: () => void;
}) {
  const { adminUser, hasPermission } = useAdminAuth();
  const [status, setStatus] = useState("all"),
    [search, setSearch] = useState(""),
    [history, setHistory] = useState<DhammaPost | null>(null),
    [target, setTarget] = useState<DhammaPost | null>(null),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const library = useAdminLibrary("dhamma_posts", status);
  const posts = useMemo(
    () =>
      library.records.map(
        (data) =>
          ({
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(0),
            updatedAt: data.updatedAt?.toDate?.() || new Date(0),
            publishedAt: data.publishedAt?.toDate?.(),
            tags: data.tags || [],
          }) as DhammaPost,
      ),
    [library.records],
  );
  const visible = posts.filter((post) =>
    [post.title, post.excerpt, ...post.tags]
      .join(" ")
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  const changeStatus = async () => {
    if (!target || !adminUser || saving || !hasPermission("dhamma", "update"))
      return;
    setSaving(true);
    setError("");
    try {
      await DhammaService.setStatus(
        target,
        target.status === "archived" ? "draft" : "archived",
        adminUser.id,
      );
      setTarget(null);
      library.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The article could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-5">
      <LibraryToolbar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        statuses={["draft", "published", "archived"]}
        loading={library.loading}
        onRefresh={library.reload}
      />
      {library.error && (
        <div role="alert" className="app-card p-5">
          <p>Articles could not load. Check your connection or access.</p>
          <Button className="mt-3" variant="outline" onClick={library.reload}>
            Retry
          </Button>
        </div>
      )}
      <div className="app-card divide-y divide-border overflow-hidden">
        {visible.map((post) => (
          <article key={post.id} className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary sm:flex">
                <BookOpen size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-muted px-3 py-1 font-medium capitalize">
                    {post.status}
                  </span>
                  <span className="px-1 py-1 text-muted-foreground">
                    {post.language?.toUpperCase()} · {post.category}
                  </span>
                  {post.featured && (
                    <span className="px-1 py-1 text-muted-foreground">
                      Featured
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold leading-relaxed">
                  {post.title}
                </h3>
                <div className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  <ArticleSummary content={post.excerpt || post.content} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Updated {post.updatedAt.toLocaleDateString()} ·{" "}
                  {post.authorName || "Administrator"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 sm:pl-16">
              <Button
                variant="outline"
                disabled={!hasPermission("dhamma", "update")}
                onClick={() => onEditPost(post)}
              >
                <FilePenLine size={16} className="mr-2" />
                Edit article
              </Button>
              <Button variant="ghost" onClick={() => setHistory(post)}>
                <History size={16} className="mr-2" />
                History
              </Button>
              {post.status === "published" && (
                <Link
                  href={`/dhamma/${post.id}`}
                  target="_blank"
                  className="inline-flex min-h-11 items-center gap-2 px-3 text-sm"
                >
                  <ExternalLink size={16} />
                  View article
                </Link>
              )}
              <Button
                variant="ghost"
                disabled={!hasPermission("dhamma", "update")}
                onClick={() => {
                  setTarget(post);
                  setError("");
                }}
              >
                {post.status === "archived" ? (
                  <Undo2 size={16} className="mr-2" />
                ) : (
                  <Archive size={16} className="mr-2" />
                )}
                {post.status === "archived" ? "Restore draft" : "Archive"}
              </Button>
            </div>
          </article>
        ))}
      </div>
      {library.loading && !posts.length && (
        <p role="status" className="p-8 text-center text-muted-foreground">
          Loading articles…
        </p>
      )}
      {!library.loading && !library.error && !visible.length && (
        <div className="app-card p-8 text-center">
          <BookOpen className="mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold">No articles shown</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {library.hasMore
              ? "Load more items or adjust your search."
              : "Try another status or create an article."}
          </p>
        </div>
      )}
      <LibraryFooter
        count={visible.length}
        loaded={posts.length}
        more={library.hasMore}
        loading={library.loading}
        onMore={library.loadMore}
      />
      {target && (
        <AdminDialog
          title={
            target.status === "archived" ? "Restore article" : "Archive article"
          }
          onClose={() => setTarget(null)}
          busy={saving}
        >
          <p className="font-medium leading-relaxed">{target.title}</p>
          <p className="my-4 text-sm leading-relaxed text-muted-foreground">
            {target.status === "archived"
              ? "This returns the article to drafts. Review it before publishing again."
              : "This hides the article from readers and saved articles. Its content and history remain available, so you can restore it later."}
          </p>
          {error && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button loading={saving} onClick={changeStatus}>
            {target.status === "archived"
              ? "Restore as draft"
              : "Archive article"}
          </Button>
        </AdminDialog>
      )}
      {history && (
        <ArticleHistory
          key={history.id}
          post={history}
          onClose={() => setHistory(null)}
          onRestored={() => {
            setHistory(null);
            library.reload();
          }}
        />
      )}
    </div>
  );
}
