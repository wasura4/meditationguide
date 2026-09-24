"use client";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import type { KamatahanAudio } from "@/types/admin";
import { moveTrack, isPublishedAudio } from "@/lib/editorial";
import { adminInput } from "./LibraryToolbar";
export function PlaylistTrackPicker({
  tracks,
  ids,
  onChange,
  disabled = false,
}: {
  tracks: KamatahanAudio[];
  ids: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const byId = useMemo(
    () => new Map(tracks.map((track) => [track.id, track])),
    [tracks],
  );
  const available = tracks.filter(
    (track) =>
      !ids.includes(track.id) &&
      track.status !== "archived" &&
      [track.title, track.category]
        .join(" ")
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-4">
      <legend className="mb-3 text-sm font-semibold">
        Playback order · {ids.length} recordings
      </legend>
      <ol className="divide-y divide-border rounded-2xl border border-border">
        {ids.map((id, index) => {
          const track = byId.get(id);
          return (
            <li
              key={id}
              className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-3 gap-y-1 p-3 sm:flex sm:items-center"
            >
              <span className="w-6 shrink-0 text-center text-sm text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium sm:truncate">
                  {track?.title || "Unavailable recording"}
                </p>
                {(!track || !isPublishedAudio(track)) && (
                  <p className="text-xs text-muted-foreground">
                    {track
                      ? "Hidden from public playback"
                      : "Reference retained until you remove it"}
                  </p>
                )}
              </div>
              <div className="col-start-2 flex shrink-0 justify-end">
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"
                  disabled={index === 0}
                  aria-label={`Move recording ${index + 1} up`}
                  onClick={() => onChange(moveTrack(ids, id, -1))}
                >
                  <ArrowUp size={17} />
                </button>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"
                  disabled={index === ids.length - 1}
                  aria-label={`Move recording ${index + 1} down`}
                  onClick={() => onChange(moveTrack(ids, id, 1))}
                >
                  <ArrowDown size={17} />
                </button>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted"
                  aria-label={`Remove recording ${index + 1}`}
                  onClick={() => onChange(ids.filter((value) => value !== id))}
                >
                  <X size={17} />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {!ids.length && (
        <p className="text-sm text-muted-foreground">
          Choose recordings below, then arrange them in the order listeners will
          hear them.
        </p>
      )}
      <label className="block space-y-2 text-sm">
        <span>Find a recording to add</span>
        <input
          className={adminInput}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search recordings…"
        />
      </label>
      <div className="max-h-64 overflow-y-auto rounded-2xl border border-border divide-y divide-border">
        {available.map((track) => (
          <button
            key={track.id}
            type="button"
            onClick={() => onChange([...ids, track.id])}
            className="flex min-h-14 w-full items-center justify-between gap-3 p-3 text-left text-sm hover:bg-muted"
          >
            <span className="min-w-0">
              <span className="block font-medium">{track.title}</span>
              <span className="text-xs text-muted-foreground">
                {track.language?.toUpperCase()} ·{" "}
                {track.durationFormatted ||
                  `${Math.round((track.duration || 0) / 60)} min`}
              </span>
            </span>
            <span className="shrink-0 text-primary">Add</span>
          </button>
        ))}
        {!available.length && (
          <p className="p-4 text-sm text-muted-foreground">
            No more matching recordings.
          </p>
        )}
      </div>
    </fieldset>
  );
}
