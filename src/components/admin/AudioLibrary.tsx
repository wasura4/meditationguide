"use client";
import { useState } from "react";
import { Archive, Headphones, SlidersHorizontal, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAdminLibrary } from "@/hooks/useAdminLibrary";
import type { KamatahanAudio } from "@/types/admin";
import { AudioInspector } from "./AudioInspector";
import { LibraryToolbar, LibraryFooter } from "./LibraryToolbar";
export default function AudioLibrary() {
  const { hasPermission } = useAdminAuth();
  const [status, setStatus] = useState("all"),
    [search, setSearch] = useState(""),
    [selection, setSelection] = useState<{
      audio: KamatahanAudio;
      archive: boolean;
    } | null>(null);
  const library = useAdminLibrary("kamatahan_audio", status);
  const records = library.records as unknown as KamatahanAudio[];
  const visible = records.filter((audio) =>
    [audio.title, audio.description, audio.category, audio.language]
      .join(" ")
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <div className="space-y-5">
      <LibraryToolbar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        statuses={["active", "draft", "inactive", "archived"]}
        loading={library.loading}
        onRefresh={library.reload}
      />
      {library.error && (
        <div role="alert" className="app-card p-5">
          <p>Recordings could not load. Check your connection or access.</p>
          <Button className="mt-3" variant="outline" onClick={library.reload}>
            Retry
          </Button>
        </div>
      )}
      <div className="app-card divide-y divide-border overflow-hidden">
        {visible.map((audio) => (
          <article
            key={audio.id}
            className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6"
          >
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary sm:flex">
              <Headphones size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-3 py-1 font-medium capitalize text-foreground">
                  {audio.status === "active"
                    ? "Published"
                    : audio.status || "Draft"}
                </span>
                <span>
                  {audio.language?.toUpperCase()} ·{" "}
                  {(audio.category || "").replaceAll("_", " ")}
                </span>
                <span>
                  {audio.durationFormatted ||
                    `${Math.round((audio.duration || 0) / 60)} min`}
                </span>
              </div>
              <h3 className="font-semibold leading-relaxed">{audio.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {audio.description}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setSelection({ audio, archive: false })}
              >
                <SlidersHorizontal size={16} className="mr-2" />
                Details
              </Button>
              <Button
                variant="ghost"
                disabled={!hasPermission("audio", "update")}
                onClick={() => setSelection({ audio, archive: true })}
              >
                {audio.status === "archived" ? (
                  <Undo2 size={16} />
                ) : (
                  <Archive size={16} />
                )}
                <span className="ml-2">
                  {audio.status === "archived" ? "Restore" : "Archive"}
                </span>
              </Button>
            </div>
          </article>
        ))}
      </div>
      {library.loading && !records.length && (
        <p role="status" className="p-8 text-center text-muted-foreground">
          Loading recordings…
        </p>
      )}
      {!library.loading && !library.error && !visible.length && (
        <div className="app-card p-8 text-center">
          <Headphones className="mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold">No recordings shown</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {library.hasMore
              ? "Load more recordings or adjust your search."
              : "Try another status or upload a recording."}
          </p>
        </div>
      )}
      <LibraryFooter
        count={visible.length}
        loaded={records.length}
        more={library.hasMore}
        loading={library.loading}
        onMore={library.loadMore}
      />
      {selection && (
        <AudioInspector
          key={selection.audio.id}
          {...selection}
          onClose={() => setSelection(null)}
          onSaved={() => {
            setSelection(null);
            library.reload();
          }}
        />
      )}
    </div>
  );
}
