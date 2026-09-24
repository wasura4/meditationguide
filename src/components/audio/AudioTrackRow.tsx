"use client";

import { Pause, Play, AudioLines } from "lucide-react";
import { usePlayer, type PlayableGuide } from "@/contexts/PlayerContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { audioTime } from "@/lib/audioPresentation";
import { AudioArtwork } from "./AudioArtwork";

export function AudioTrackRow({
  guide,
  index,
  numbered = false,
}: {
  guide: PlayableGuide;
  index: number;
  numbered?: boolean;
}) {
  const player = usePlayer();
  const { t } = useLanguage();
  const track = guide.audioFiles[index];
  const active = player.guide?.id === guide.id && player.index === index;
  const playing = active && player.isPlaying;
  return (
    <div
      className={`listen-track flex items-center gap-3 rounded-2xl p-3 sm:gap-4 ${active ? "bg-primary/10" : "hover:bg-muted/60"}`}
    >
      {numbered ? (
        <span
          className="w-6 shrink-0 text-center text-sm tabular-nums text-muted-foreground"
          aria-hidden="true"
        >
          {playing ? <AudioLines size={20} /> : index + 1}
        </span>
      ) : (
        <AudioArtwork
          src={guide.thumbnailUrl}
          className="h-14 w-14 rounded-xl"
        />
      )}
      <button
        type="button"
        className="min-h-11 min-w-0 flex-1 text-left"
        onClick={() => {
          if (!active) player.start(guide, index);
          player.setExpanded(true);
        }}
        aria-label={`${t("interface.expand_player")}: ${track.title}`}
      >
        <span className="block break-words text-sm font-semibold leading-relaxed sm:text-base">
          {track.title}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {guide.authorName || t(`listen.category.${track.category}`)} ·{" "}
          {t(`listen.language.${track.language}`)} ·{" "}
          {track.duration > 0
            ? audioTime(track.duration)
            : t("listen.duration_unknown")}
        </span>
      </button>
      <button
        type="button"
        className="app-icon-button shrink-0"
        onClick={() => (active ? player.toggle() : player.start(guide, index))}
        aria-label={`${playing ? t("interface.pause") : t("interface.play")}: ${track.title}`}
      >
        {playing ? (
          <Pause size={19} fill="currentColor" />
        ) : (
          <Play size={19} fill="currentColor" />
        )}
      </button>
    </div>
  );
}
