import { db } from '@/lib/firebase';
import { collection, deleteDoc, doc, getDocs, query, setDoc } from 'firebase/firestore';
import { DhammaService } from '@/lib/dhammaService';
import { DhammaPost } from '@/types/admin';

const favCol = (userId: string) => collection(db, 'users', userId, 'favorites');

export async function toggleFavorite(userId: string, postId: string): Promise<'added'|'removed'> {
  const d = doc(db, 'users', userId, 'favorites', postId);
  const exists = await getDocs(query(favCol(userId))).then(s => s.docs.some(x => x.id === postId));
  if (exists) {
    await deleteDoc(d);
    return 'removed';
  } else {
    await setDoc(d, { postId, createdAt: new Date() });
    return 'added';
  }
}

export async function isFavorited(userId: string, postId: string): Promise<boolean> {
  return getDocs(query(favCol(userId))).then(s => s.docs.some(x => x.id === postId));
}

export async function getFavoritePosts(userId: string): Promise<DhammaPost[]> {
  const snap = await getDocs(query(favCol(userId)));
  const ids = snap.docs.map(d => d.id);
  const posts = await Promise.all(ids.map(id => DhammaService.getPostById(id)));
  return posts.filter(Boolean) as DhammaPost[];
}

