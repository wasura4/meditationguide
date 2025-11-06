import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  documentId,
} from 'firebase/firestore';
import { db } from './firebase';
import { KamatahanAudio } from '@/types/admin';

export interface PlaylistDoc {
  id: string;
  name: string;
  description: string;
  audioFiles: KamatahanAudio[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // admin uid
  thumbnailUrl?: string;
  authorName?: string;
}

interface PlaylistFirestore {
  name?: string;
  description?: string;
  // New efficient storage: store only IDs
  audioIds?: string[];
  // Legacy field support (some older docs may still have full objects)
  audioFiles?: KamatahanAudio[];
  isPublic?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  userId?: string;
  thumbnailUrl?: string;
  authorName?: string;
}

export class PlaylistService {
  private static COLLECTION = 'playlists';

  private static async getTracksByIds(ids: string[]): Promise<KamatahanAudio[]> {
    if (!ids || ids.length === 0) return [];
    const unique = Array.from(new Set(ids));
    const chunks: string[][] = [];
    for (let i = 0; i < unique.length; i += 10) chunks.push(unique.slice(i, i + 10));

    const results: KamatahanAudio[] = [];
    for (const chunk of chunks) {
      const q = query(collection(db, 'kamatahan_audio'), where(documentId(), 'in', chunk));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        const data = d.data() as Omit<KamatahanAudio, 'id'>;
        results.push({ ...data, id: d.id });
      });
    }
    // Preserve requested order
    const map = new Map(results.map((a) => [a.id, a] as const));
    return unique.map((id) => map.get(id)).filter(Boolean) as KamatahanAudio[];
  }

  static async getAll(): Promise<PlaylistDoc[]> {
    const q = query(collection(db, this.COLLECTION));
    const snap = await getDocs(q);
    const raw: Array<{ id: string; data: PlaylistFirestore }> = [];
    snap.forEach((d) => raw.push({ id: d.id, data: d.data() as PlaylistFirestore }));

    // Build docs and fetch tracks per playlist
    const results: PlaylistDoc[] = [];
    for (const it of raw) {
      const legacy = (it.data.audioFiles as KamatahanAudio[]) || [];
      const audioIds = (it.data.audioIds && it.data.audioIds.length)
        ? it.data.audioIds
        : legacy.map((x) => x?.id).filter(Boolean) as string[];
      const tracks = await this.getTracksByIds(audioIds);
      results.push({
        id: it.id,
        name: it.data.name || '',
        description: it.data.description || '',
        audioFiles: tracks,
        isPublic: Boolean(it.data.isPublic),
        createdAt: it.data.createdAt?.toDate?.() || new Date(),
        updatedAt: it.data.updatedAt?.toDate?.() || new Date(),
        createdBy: it.data.createdBy || it.data.userId || '',
        thumbnailUrl: it.data.thumbnailUrl,
        authorName: it.data.authorName,
      });
    }
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static async getPublic(): Promise<PlaylistDoc[]> {
    const q = query(collection(db, this.COLLECTION), where('isPublic', '==', true));
    const snap = await getDocs(q);
    const results: PlaylistDoc[] = [];
    for (const d of snap.docs) {
      const data = d.data() as PlaylistFirestore;
      const legacy = (data.audioFiles as KamatahanAudio[]) || [];
      const audioIds = (data.audioIds && data.audioIds.length) ? data.audioIds : legacy.map((x) => x?.id).filter(Boolean) as string[];
      const tracks = await this.getTracksByIds(audioIds);
      results.push({
        id: d.id,
        name: data.name || '',
        description: data.description || '',
        audioFiles: tracks,
        isPublic: Boolean(data.isPublic),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        createdBy: data.createdBy || data.userId || '',
        thumbnailUrl: data.thumbnailUrl,
        authorName: data.authorName,
      });
    }
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static async create(params: {
    name: string;
    description: string;
    audioFiles: KamatahanAudio[];
    createdBy: string;
    isPublic?: boolean;
    thumbnailUrl?: string;
    authorName?: string;
  }): Promise<string> {
    const docRef = await addDoc(collection(db, this.COLLECTION), {
      name: params.name.trim(),
      description: params.description.trim(),
      audioIds: (params.audioFiles || []).map((x) => x.id),
      isPublic: params.isPublic ?? true,
      createdBy: params.createdBy,
      userId: params.createdBy, // keep compatibility with rules and user queries
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      thumbnailUrl: params.thumbnailUrl || null,
      authorName: params.authorName || null,
    });
    return docRef.id;
  }

  static async update(id: string, updates: Partial<Omit<PlaylistDoc, 'id' | 'createdAt'>>): Promise<void> {
    const ref = doc(db, this.COLLECTION, id);
    const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
    if (typeof updates.name === 'string') updateData.name = updates.name.trim();
    if (typeof updates.description === 'string') updateData.description = updates.description;
    if (typeof updates.isPublic === 'boolean') updateData.isPublic = updates.isPublic;
    if (typeof updates.thumbnailUrl === 'string') updateData.thumbnailUrl = updates.thumbnailUrl;
    if (typeof updates.authorName === 'string' || updates.authorName === null) updateData.authorName = updates.authorName || null;
    if (Array.isArray(updates.audioFiles)) updateData.audioIds = updates.audioFiles.map((x) => x.id);
    await updateDoc(ref, updateData);
  }

  static async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, this.COLLECTION, id));
  }

  static async getById(id: string): Promise<PlaylistDoc | null> {
    const d = await getDoc(doc(db, this.COLLECTION, id));
    if (!d.exists()) return null;
    const data = d.data() as PlaylistFirestore;
    const legacy = (data.audioFiles as KamatahanAudio[]) || [];
    const audioIds = (data.audioIds && data.audioIds.length) ? data.audioIds : legacy.map((x) => x?.id).filter(Boolean) as string[];
    const tracks = await this.getTracksByIds(audioIds);
    return {
      id: d.id,
      name: data.name || '',
      description: data.description || '',
      audioFiles: tracks,
      isPublic: Boolean(data.isPublic),
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
      createdBy: data.createdBy || data.userId || '',
      thumbnailUrl: data.thumbnailUrl,
      authorName: data.authorName,
    };
  }
}
