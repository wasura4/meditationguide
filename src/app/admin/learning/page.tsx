"use client";
import { useState } from "react";
import Link from "next/link";
import { Route, Users, Plus, FilePenLine } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { LearningEditor } from "@/components/admin/LearningEditor";
import {
  LibraryToolbar,
  LibraryFooter,
} from "@/components/admin/LibraryToolbar";
import { Button } from "@/components/ui/button";
import { useAdminLibrary } from "@/hooks/useAdminLibrary";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import type { Teacher, LearningPath } from "@/lib/learning";
export default function LearningAdminPage() {
  const [kind, setKind] = useState<"teacher" | "path">("path");
  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/learning">
        <div className="space-y-6">
          <header>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Learning studio
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Teachers & learning paths
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Connect your teachings into clear, thoughtful sequences. Publish a
              teacher profile, choose lessons, and help learners find their next
              step.
            </p>
          </header>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Learning collection"
          >
            <Button
              variant={kind === "path" ? "default" : "outline"}
              aria-pressed={kind === "path"}
              onClick={() => setKind("path")}
            >
              <Route size={17} className="mr-2" />
              Learning paths
            </Button>
            <Button
              variant={kind === "teacher" ? "default" : "outline"}
              aria-pressed={kind === "teacher"}
              onClick={() => setKind("teacher")}
            >
              <Users size={17} className="mr-2" />
              Teachers
            </Button>
            <Link
              href="/learn"
              className="inline-flex min-h-11 items-center px-3 text-sm text-primary"
            >
              View learner library
            </Link>
          </div>
          <LearningCollection key={kind} kind={kind} />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
function LearningCollection({ kind }: { kind: "teacher" | "path" }) {
  const { hasPermission } = useAdminAuth();
  const [status, setStatus] = useState("all"),
    [search, setSearch] = useState(""),
    [editing, setEditing] = useState<{ item?: Teacher | LearningPath } | null>(
      null,
    );
  const library = useAdminLibrary(
    kind === "teacher" ? "teachers" : "learning_paths",
    status,
  );
  const items = (
    library.records as unknown as (Teacher | LearningPath)[]
  ).filter((item) =>
    ("name" in item
      ? [item.name, item.nameEn]
      : [item.title, item.titleEn, item.topic]
    )
      .join(" ")
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          disabled={!hasPermission("content", "create")}
          onClick={() => setEditing({})}
        >
          <Plus size={17} className="mr-2" />
          {kind === "teacher" ? "New teacher" : "New learning path"}
        </Button>
      </div>
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
          <p>
            Could not load this collection. Check your access and connection.
          </p>
          <Button className="mt-3" variant="outline" onClick={library.reload}>
            Retry
          </Button>
        </div>
      )}
      <div className="app-card divide-y divide-border">
        {items.map((item) => (
          <article key={item.id} className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-muted px-3 py-1 capitalize">
                {item.status}
              </span>
              {"lessons" in item && (
                <span className="text-muted-foreground">
                  {item.lessons.length} lessons · {item.level} ·{" "}
                  {item.language.toUpperCase()}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold leading-relaxed">
              {"name" in item ? item.name : item.title}
            </h2>
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {"bio" in item ? item.bio : item.description}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing({ item })}>
                <FilePenLine size={16} className="mr-2" />
                {hasPermission("content", "update") ? "Edit" : "Details"}
              </Button>
              {item.status === "published" && (
                <Link
                  href={
                    kind === "teacher"
                      ? `/teachers/${item.id}`
                      : `/learn/${item.id}`
                  }
                  className="inline-flex min-h-11 items-center px-3 text-sm text-primary"
                >
                  View published page
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
      {library.loading && !items.length && (
        <p role="status" className="p-8 text-center text-muted-foreground">
          Loading…
        </p>
      )}
      {!library.loading && !library.error && !items.length && (
        <div className="app-card p-8 text-center">
          <Route className="mx-auto mb-3 text-primary" />
          <h2 className="font-semibold">
            {kind === "teacher"
              ? "Introduce your teachers"
              : "Create a thoughtful learning journey"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {search || status !== "all"
              ? "No matching items. Try another filter."
              : "Start with a draft. Nothing is shown to learners until you publish it."}
          </p>
        </div>
      )}
      <LibraryFooter
        count={items.length}
        loaded={library.records.length}
        more={library.hasMore}
        loading={library.loading}
        onMore={library.loadMore}
      />
      {editing && (
        <LearningEditor
          kind={kind}
          item={editing.item}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            library.reload();
          }}
        />
      )}
    </div>
  );
}
