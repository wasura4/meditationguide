"use client";

import type { KamatahanAudio } from "@/types/admin";
import { AudioTrackRow } from "./AudioTrackRow";

/** Individual recordings use the same persistent player as curated guides. */
export function AudioPlayer({ audio }: { audio: KamatahanAudio }) {
  return (
    <AudioTrackRow
      guide={{
        id: `audio:${audio.id}`,
        name: audio.title,
        audioFiles: [audio],
      }}
      index={0}
    />
  );
}
