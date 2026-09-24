"use client";
import { useEffect, useRef, useState } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { DhammaService } from "@/lib/dhammaService";
import type { DhammaPost } from "@/types/admin";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminDialog } from "./AdminDialog";
import { ArticlePreview } from "./ArticlePreview";
import { Button } from "@/components/ui/button";
type Revision = Awaited<
  ReturnType<typeof DhammaService.getRevisions>
>["items"][number];
export function ArticleHistory({
  post,
  onClose,
  onRestored,
}: {
  post: DhammaPost;
  onClose: () => void;
  onRestored: () => void;
}) {
  const { adminUser, hasPermission } = useAdminAuth();
  const [items, setItems] = useState<Revision[]>([]),
    [selected, setSelected] = useState<Revision | null>(null),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [more, setMore] = useState(false);
  const cursor = useRef<QueryDocumentSnapshot | undefined>(undefined),
    mounted = useRef(true),
    busy = useRef(false);
  const load = async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await DhammaService.getRevisions(post.id, cursor.current);
      if (!mounted.current) return;
      setItems((previous) => [...previous, ...result.items]);
      cursor.current = result.cursor;
      setMore(result.hasMore);
    } catch {
      if (mounted.current)
        setError(
          "Version history could not load. Check your access and connection, then retry.",
        );
    } finally {
      busy.current = false;
      if (mounted.current) setLoading(false);
    }
  };
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);
  const restore = async () => {
    if (!selected || !adminUser || saving || !hasPermission("dhamma", "update"))
      return;
    setSaving(true);
    setError("");
    try {
      await DhammaService.restoreRevision(post, selected.version, adminUser.id);
      onRestored();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The revision could not be restored.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <AdminDialog title="Article history" onClose={onClose} busy={saving}>
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          A checkpoint keeps the previous article before every edit, archive, or
          restoration. Restoring creates a draft for review and saves the
          current version in history.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              disabled={saving}
              type="button"
              aria-pressed={selected?.id === item.id}
              onClick={() => setSelected(item)}
              className={`w-full rounded-xl border p-4 text-left ${selected?.id === item.id ? "border-primary bg-muted" : "border-border"}`}
            >
              <span className="block font-medium">
                Checkpoint {item.version} · before {item.action}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {item.createdAt?.toLocaleString() || "Date unavailable"} ·{" "}
                {item.snapshot.status}
              </span>
              <span className="mt-2 block truncate text-sm">
                {item.snapshot.title}
              </span>
            </button>
          ))}
        </div>
        {!loading && !error && !items.length && (
          <p className="rounded-xl bg-muted p-5 text-sm">
            No checkpoints yet. History begins with the first edit after this
            upgrade.
          </p>
        )}
        {(loading || more || error) && (
          <Button variant="outline" loading={loading} onClick={load}>
            Load history
          </Button>
        )}
        {selected && (
          <>
            <ArticlePreview
              content={selected.snapshot.content}
              title={selected.snapshot.title}
            />
            <p className="text-sm text-muted-foreground">
              “{post.title}” will become a draft. It will be hidden from readers
              until you publish it again.
            </p>
            <Button
              loading={saving}
              disabled={!hasPermission("dhamma", "update")}
              onClick={restore}
            >
              Restore checkpoint {selected.version} as draft
            </Button>
          </>
        )}
      </div>
    </AdminDialog>
  );
}
