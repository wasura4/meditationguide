"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Search } from "lucide-react";
import { PlaylistService, type PlaylistDoc } from "@/lib/playlistService";
import { audioTime } from "@/lib/audioPresentation";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { AudioArtwork } from "./AudioArtwork";
import { ListeningState } from "./ListeningState";

export function PlaylistManager() {
  const { t } = useLanguage();
  const { start, setExpanded } = usePlayer();
  const params = useSearchParams();
  const requested = params.get("start");
  const handled = useRef<string | null>(null);
  const [guides, setGuides] = useState<PlaylistDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [teacher, setTeacher] = useState("all");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    PlaylistService.getPublic()
      .then((rows) => {
        if (active) setGuides(rows);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  useEffect(() => {
    if (!requested) {
      handled.current = null;
      return;
    }
    if (loading || error || handled.current === requested) return;
    const guide = guides.find((item) => item.id === requested);
    handled.current = requested;
    if (guide?.audioFiles.length) {
      start(guide);
      setExpanded(true);
    }
  }, [requested, loading, error, guides, start, setExpanded]);
  const teachers = useMemo(
    () =>
      [
        ...new Set(
          guides
            .map((guide) => guide.authorName)
            .filter((name): name is string => !!name),
        ),
      ].sort(),
    [guides],
  );
  const results = useMemo(
    () =>
      guides.filter(
        (guide) =>
          (teacher === "all" || guide.authorName === teacher) &&
          `${guide.name} ${guide.description} ${guide.authorName || ""}`
            .toLocaleLowerCase()
            .includes(search.trim().toLocaleLowerCase()),
      ),
    [guides, teacher, search],
  );
  return (
    <div className="space-y-5">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_220px]">
        <label className="listen-search">
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("listen.search_guides")}
            aria-label={t("listen.search_guides")}
          />
        </label>
        <label className="listen-filter">
          {t("listen.teacher")}
          <select
            value={teacher}
            onChange={(event) => setTeacher(event.target.value)}
          >
            <option value="all">{t("listen.all_teachers")}</option>
            {teachers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading || error ? (
        <ListeningState
          loading={loading}
          error={error}
          retry={() => setAttempt((value) => value + 1)}
        />
      ) : (
        <>
          {requested &&
            !guides.some(
              (guide) => guide.id === requested && guide.audioFiles.length,
            ) && (
              <p role="status" className="rounded-2xl bg-muted p-4 text-sm">
                {t("listen.guide_unavailable")}
              </p>
            )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" role="status">
              {t("listen.guide_count", { count: results.length })}
            </p>
            {(search || teacher !== "all") && (
              <button
                type="button"
                className="min-h-11 text-sm font-medium underline underline-offset-4"
                onClick={() => {
                  setSearch("");
                  setTeacher("all");
                }}
              >
                {t("listen.clear_filters")}
              </button>
            )}
          </div>
          {results.length ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              {results.map((guide) => (
                <Link
                  key={guide.id}
                  href={`/kamatahan/guides/${encodeURIComponent(guide.id)}`}
                  className="group min-w-0 rounded-3xl border border-border bg-card p-2.5 transition-colors hover:bg-muted/50 sm:p-3"
                >
                  <AudioArtwork
                    src={guide.thumbnailUrl}
                    className="aspect-square w-full rounded-2xl"
                  />
                  <div className="px-1 pb-2 pt-4">
                    <h2 className="break-words text-sm font-semibold leading-relaxed sm:text-base">
                      {guide.name}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {guide.authorName || t("listen.curated_guide")}
                    </p>
                    <p className="mt-3 text-xs tabular-nums text-muted-foreground">
                      {t("listen.track_count", {
                        count: guide.audioFiles.length,
                      })}{" "}
                      ·{" "}
                      {audioTime(
                        guide.audioFiles.reduce(
                          (sum, track) =>
                            sum +
                            (Number.isFinite(track.duration)
                              ? track.duration
                              : 0),
                          0,
                        ),
                      )}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
                      {t("listen.view_guide")}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <ListeningState
              empty={
                search || teacher !== "all"
                  ? "listen.no_matches"
                  : "listen.no_guides"
              }
            />
          )}
        </>
      )}
    </div>
  );
}
