import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import type { KamatahanAudio } from "@/types/admin";
import { playlistTrackIds } from "./editorial";
import { saveAudioMetadata, type AudioMetadata } from "./editorialTransactions";
export type { AudioMetadata } from "./editorialTransactions";
export const AdminAudioService = {
  update: (
    audio: KamatahanAudio,
    updates: Partial<AudioMetadata>,
    actorId: string,
  ) => saveAudioMetadata(db, audio.id, updates, audio.version || 0, actorId),
  async dependencies(audioId: string) {
    const snapshot = await getDocs(collection(db, "playlists"));
    return snapshot.docs
      .filter((item) => playlistTrackIds(item.data()).includes(audioId))
      .map((item) => ({
        id: item.id,
        name: String(item.data().name || "Untitled playlist"),
      }));
  },
};
