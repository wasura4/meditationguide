import { addDoc, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { getCountFromServer } from 'firebase/firestore';
import { db } from './firebase';

const LISTENS = 'audio_listens';

export async function recordAudioListen(audioId: string, userId?: string) {
  try {
    await addDoc(collection(db, LISTENS), {
      audioId,
      userId: userId || null,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    // Non-fatal in UI; swallow to avoid interrupting playback
    console.warn('recordAudioListen failed', e);
  }
}

export async function getAudioListenCount(audioId: string): Promise<number> {
  try {
    const q = query(collection(db, LISTENS), where('audioId', '==', audioId));
    const snap = await getCountFromServer(q);
    return snap.data().count || 0;
  } catch (e) {
    console.warn('getAudioListenCount failed', e);
    return 0;
  }
}

