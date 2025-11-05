import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
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
}

interface PlaylistFirestore {
  name?: string;
  description?: string;
  audioFiles?: KamatahanAudio[];
  isPublic?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  userId?: string;
}

export class PlaylistService {
  private static COLLECTION = 'playlists';

  static async getAll(): Promise<PlaylistDoc[]> {
    const q = query(collection(db, this.COLLECTION));
    const snap = await getDocs(q);
    const items: PlaylistDoc[] = [];
    snap.forEach((d) => {
      const data = d.data() as PlaylistFirestore;
      items.push({
        id: d.id,
        name: data.name || '',
        description: data.description || '',
        audioFiles: (data.audioFiles as KamatahanAudio[]) || [],
        isPublic: Boolean(data.isPublic),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        createdBy: data.createdBy || data.userId || '',
      });
    });
    return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static async getPublic(): Promise<PlaylistDoc[]> {
    const q = query(collection(db, this.COLLECTION), where('isPublic', '==', true));
    const snap = await getDocs(q);
    const items: PlaylistDoc[] = [];
    snap.forEach((d) => {
      const data = d.data() as PlaylistFirestore;
      items.push({
        id: d.id,
        name: data.name || '',
        description: data.description || '',
        audioFiles: (data.audioFiles as KamatahanAudio[]) || [],
        isPublic: Boolean(data.isPublic),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        createdBy: data.createdBy || data.userId || '',
      });
    });
    return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static async create(params: {
    name: string;
    description: string;
    audioFiles: KamatahanAudio[];
    createdBy: string;
    isPublic?: boolean;
  }): Promise<string> {
    const docRef = await addDoc(collection(db, this.COLLECTION), {
      name: params.name.trim(),
      description: params.description.trim(),
      audioFiles: params.audioFiles || [],
      isPublic: params.isPublic ?? true,
      createdBy: params.createdBy,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  static async update(id: string, updates: Partial<Omit<PlaylistDoc, 'id' | 'createdAt'>>): Promise<void> {
    const ref = doc(db, this.COLLECTION, id);
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(ref, updateData);
  }

  static async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, this.COLLECTION, id));
  }
}
