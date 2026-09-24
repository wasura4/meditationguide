"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Play } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppPage } from "@/components/app/AppPage";
import { AudioArtwork } from "@/components/audio/AudioArtwork";
import { AudioTrackRow } from "@/components/audio/AudioTrackRow";
import { ListeningState } from "@/components/audio/ListeningState";
import { PlaylistService, type PlaylistDoc } from "@/lib/playlistService";
import { audioTime } from "@/lib/audioPresentation";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlayer } from "@/contexts/PlayerContext";

export default function GuidePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <ProtectedRoute>
      <GuideContent key={id} id={id} />
    </ProtectedRoute>
  );
}

function GuideContent({ id }: { id: string }) {
  const { t } = useLanguage();
  const player = usePlayer();
  const [guide, setGuide] = useState<PlaylistDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    PlaylistService.getById(id)
      .then((row) => {
        if (active) setGuide(row?.isPublic ? row : null);
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
  }, [id, attempt]);
  const current = player.guide?.id === id;
  return (
    <AppPage title={t("listen.guide_details")} backHref="/kamatahan">
      {loading || error ? (
        <ListeningState
          loading={loading}
          error={error}
          retry={() => setAttempt((value) => value + 1)}
        />
      ) : !guide ? (
        <ListeningState empty="listen.guide_unavailable" />
      ) : (
        <>
          <div className="listen-guide-hero grid items-center gap-6 rounded-3xl border border-border p-5 sm:grid-cols-[220px_1fr] sm:p-7">
            <AudioArtwork
              src={guide.thumbnailUrl}
              className="mx-auto aspect-square w-full max-w-64 rounded-3xl shadow-sm"
            />
            <div className="min-w-0 text-center sm:text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("listen.curated_guide")}
              </p>
              <h2 className="break-words text-2xl font-bold leading-relaxed">
                {guide.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {guide.authorName}
              </p>
              <p className="mt-4 text-sm tabular-nums text-muted-foreground">
                {t("listen.track_count", { count: guide.audioFiles.length })} ·{" "}
                {audioTime(
                  guide.audioFiles.reduce(
                    (sum, track) =>
                      sum +
                      (Number.isFinite(track.duration) ? track.duration : 0),
                    0,
                  ),
                )}
              </p>
              <button
                type="button"
                disabled={!guide.audioFiles.length}
                onClick={() => {
                  player.start(guide, current ? player.index : 0);
                  player.setExpanded(true);
                }}
                className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Play size={18} fill="currentColor" />
                {t(current ? "listen.continue" : "listen.play_guide")}
              </button>
            </div>
          </div>
          {guide.description && (
            <p className="my-6 whitespace-pre-line text-sm leading-loose text-muted-foreground">
              {guide.description}
            </p>
          )}
          <h2 className="app-section-title mb-3 mt-7">
            {t("listen.in_this_guide")}
          </h2>
          {guide.audioFiles.length ? (
            <div className="divide-y divide-border rounded-3xl border border-border bg-card p-2">
              {guide.audioFiles.map((track, index) => (
                <AudioTrackRow
                  key={`${track.id}-${index}`}
                  guide={guide}
                  index={index}
                  numbered
                />
              ))}
            </div>
          ) : (
            <ListeningState empty="listen.no_recordings" />
          )}
        </>
      )}
    </AppPage>
  );
}
