import {
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  documentId,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";
import { explainVersionConflict } from "./editorialTransactions";
import type { KamatahanAudio } from "@/types/admin";
import {
  assertVersion,
  isPublishedAudio,
  playlistTrackIds,
  orderedTracks,
} from "./editorial";
export interface PlaylistDoc {
  id: string;
  name: string;
  description: string;
  audioFiles: KamatahanAudio[];
  audioIds?: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  thumbnailUrl?: string;
  authorName?: string;
  version?: number;
  archived?: boolean;
}
type RawPlaylist = { id: string; data: Record<string, unknown> };
export class PlaylistService {
  private static async hydrate(
    raw: RawPlaylist[],
    publicOnly = false,
  ): Promise<PlaylistDoc[]> {
    const ids = [
      ...new Set(raw.flatMap((item) => playlistTrackIds(item.data))),
    ];
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
    const snapshots = await Promise.all(
      chunks.map((chunk) =>
        getDocs(
          query(
            collection(db, "kamatahan_audio"),
            where(documentId(), "in", chunk),
          ),
        ),
      ),
    );
    const allTracks = snapshots.flatMap((snapshot) =>
      snapshot.docs.map(
        (item) => ({ ...item.data(), id: item.id }) as KamatahanAudio,
      ),
    );
    const date = (value: unknown) =>
      value instanceof Timestamp ? value.toDate() : new Date(0);
    return raw
      .filter((item) => !publicOnly || item.data.archived !== true)
      .map(({ id, data }) => {
        const audioIds = playlistTrackIds(data);
        let tracks = orderedTracks(audioIds, allTracks);
        if (publicOnly) tracks = tracks.filter(isPublishedAudio);
        return {
          id,
          name: String(data.name || ""),
          description: String(data.description || ""),
          audioIds,
          audioFiles: tracks,
          isPublic: data.isPublic === true,
          createdAt: date(data.createdAt),
          updatedAt: date(data.updatedAt),
          createdBy: String(data.createdBy || data.userId || ""),
          thumbnailUrl:
            typeof data.thumbnailUrl === "string"
              ? data.thumbnailUrl
              : undefined,
          authorName:
            typeof data.authorName === "string" ? data.authorName : undefined,
          version: typeof data.version === "number" ? data.version : 0,
          archived: data.archived === true,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  static async getAll() {
    const snapshot = await getDocs(collection(db, "playlists"));
    return this.hydrate(
      snapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
    );
  }
  static async getPublic() {
    const snapshot = await getDocs(
      query(collection(db, "playlists"), where("isPublic", "==", true)),
    );
    return this.hydrate(
      snapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
      true,
    );
  }
  static async getById(id: string) {
    const snapshot = await getDoc(doc(db, "playlists", id));
    if (!snapshot.exists()) return null;
    return (
      (await this.hydrate([{ id, data: snapshot.data() }], true))[0] || null
    );
  }
  static async create(params: {
    name: string;
    description: string;
    audioFiles: KamatahanAudio[];
    audioIds?: string[];
    createdBy: string;
    isPublic?: boolean;
    thumbnailUrl?: string;
    authorName?: string;
  }) {
    if (!params.name.trim()) throw new Error("Give the playlist a name.");
    const reference = await addDoc(collection(db, "playlists"), {
      name: params.name.trim(),
      description: params.description.trim(),
      audioIds: playlistTrackIds(params),
      isPublic: params.isPublic ?? true,
      createdBy: params.createdBy,
      userId: params.createdBy,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      thumbnailUrl: params.thumbnailUrl || null,
      authorName: params.authorName || null,
      version: 0,
      archived: false,
    });
    return reference.id;
  }
  static async update(
    id: string,
    updates: Partial<Omit<PlaylistDoc, "id" | "createdAt">>,
    expectedVersion: number,
  ): Promise<void> {
    if (typeof updates.name === "string" && !updates.name.trim())
      throw new Error("Give the playlist a name.");
    const data: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
      version: expectedVersion + 1,
    };
    if (typeof updates.name === "string") data.name = updates.name.trim();
    for (const field of ["description", "thumbnailUrl", "authorName"] as const)
      if (typeof updates[field] === "string") data[field] = updates[field];
    for (const field of ["isPublic", "archived"] as const)
      if (typeof updates[field] === "boolean") data[field] = updates[field];
    if (updates.audioIds || updates.audioFiles)
      data.audioIds = playlistTrackIds(updates);
    if (updates.archived === true) data.isPublic = false;
    const reference = doc(db, "playlists", id);
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(reference);
      if (!existing.exists())
        throw new Error("This playlist no longer exists.");
      assertVersion(existing.data().version, expectedVersion);
      if (
        existing.data().archived === true &&
        updates.isPublic === true &&
        updates.archived !== false
      )
        throw new Error("Restore the playlist before publishing.");
      transaction.update(reference, data);
    }).catch((error) =>
      explainVersionConflict(reference, expectedVersion, error),
    );
  }
  static async archive(playlist: PlaylistDoc) {
    await this.update(
      playlist.id,
      { archived: !playlist.archived, isPublic: false },
      playlist.version || 0,
    );
  }
}
