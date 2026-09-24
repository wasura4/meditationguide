import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { DhammaService } from "@/lib/dhammaService";
import { DhammaPost } from "@/types/admin";

const favCol = (userId: string) => collection(db, "users", userId, "favorites");

export async function toggleFavorite(
  userId: string,
  postId: string,
): Promise<"added" | "removed"> {
  const exists = await isFavorited(userId, postId);
  await setFavorite(userId, postId, !exists);
  return exists ? "removed" : "added";
}

export async function setFavorite(
  userId: string,
  postId: string,
  saved: boolean,
): Promise<void> {
  const reference = doc(db, "users", userId, "favorites", postId);
  if (saved) await setDoc(reference, { postId, createdAt: serverTimestamp() });
  else await deleteDoc(reference);
}

export async function isFavorited(
  userId: string,
  postId: string,
): Promise<boolean> {
  return (await getDoc(doc(db, "users", userId, "favorites", postId))).exists();
}

export async function getFavoritePosts(userId: string): Promise<DhammaPost[]> {
  const snap = await getDocs(query(favCol(userId)));
  const ids = [...snap.docs]
    .sort(
      (a, b) =>
        (b.data().createdAt?.toMillis?.() || 0) -
        (a.data().createdAt?.toMillis?.() || 0),
    )
    .map((d) => d.id);
  const posts = await Promise.all(
    ids.map((id) => DhammaService.getPostById(id)),
  );
  return posts.filter(
    (post): post is DhammaPost => post?.status === "published",
  );
}
