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

// Dhamma reads per user/post
const READS = 'dhamma_reads';

export async function recordDhammaRead(postId: string, userId: string) {
  try {
    await addDoc(collection(db, READS), {
      postId,
      userId,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('recordDhammaRead failed', e);
  }
}

export async function getUserAudioSessionCount(userId: string): Promise<number> {
  try {
    const q = query(collection(db, LISTENS), where('userId', '==', userId));
    const snap = await getCountFromServer(q);
    return snap.data().count || 0;
  } catch (e) {
    console.warn('getUserAudioSessionCount failed', e);
    return 0;
  }
}

export async function getUserDhammaReadsCount(userId: string): Promise<number> {
  try {
    const q = query(collection(db, READS), where('userId', '==', userId));
    const snap = await getCountFromServer(q);
    return snap.data().count || 0;
  } catch (e) {
    console.warn('getUserDhammaReadsCount failed', e);
    return 0;
  }
}
