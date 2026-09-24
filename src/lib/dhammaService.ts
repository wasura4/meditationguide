import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { DhammaPost, DhammaPostFormData } from "@/types/admin";
import { saveArticleVersion } from "./editorialTransactions";
import { articleFields } from "./editorial";

export class DhammaService {
  private static COLLECTION = "dhamma_posts";

  // Create a new Dhamma post
  static async createPost(
    postData: DhammaPostFormData,
    adminUserId: string,
    adminDisplayName: string,
  ): Promise<string> {
    try {
      const postToSave = {
        ...postData,
        version: 0,
        authorId: adminUserId,
        authorName: adminDisplayName,
        viewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: postData.status === "published" ? serverTimestamp() : null,
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), postToSave);
      return docRef.id;
    } catch (error) {
      console.error("Error creating Dhamma post:", error);
      throw new Error("Failed to create Dhamma post");
    }
  }

  // Update an existing Dhamma post
  static async updatePost(
    postId: string,
    postData: DhammaPostFormData,
    actorId: string,
    expectedVersion: number,
  ): Promise<void> {
    await saveArticleVersion(db, postId, postData, actorId, expectedVersion);
  }

  static async setStatus(
    post: DhammaPost,
    status: "archived" | "draft",
    actorId: string,
  ) {
    await saveArticleVersion(
      db,
      post.id,
      { status },
      actorId,
      post.version || 0,
    );
  }

  static async getRevisions(postId: string, cursor?: QueryDocumentSnapshot) {
    const result = await getDocs(
      query(
        collection(db, this.COLLECTION, postId, "revisions"),
        orderBy("version", "desc"),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(10),
      ),
    );
    return {
      items: result.docs.map((item) => ({
        id: item.id,
        version: Number(item.data().version),
        action: String(item.data().action),
        createdAt: item.data().createdAt?.toDate() as Date | undefined,
        snapshot: articleFields(item.data().snapshot),
      })),
      cursor: result.docs.at(-1),
      hasMore: result.size === 10,
    };
  }

  static async restoreRevision(
    post: DhammaPost,
    version: number,
    actorId: string,
  ) {
    await saveArticleVersion(
      db,
      post.id,
      { status: "draft" },
      actorId,
      post.version || 0,
      version,
    );
  }

  // Get all Dhamma posts
  static async getAllPosts(): Promise<DhammaPost[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        orderBy("createdAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      const posts: DhammaPost[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          publishedAt: data.publishedAt?.toDate() || undefined,
        } as DhammaPost);
      });

      return posts;
    } catch (error) {
      console.error("Error fetching Dhamma posts:", error);
      throw new Error("Failed to fetch Dhamma posts");
    }
  }

  // Get a single Dhamma post by ID
  static async getPublishedPostById(
    postId: string,
  ): Promise<DhammaPost | null> {
    try {
      const post = await getDoc(doc(db, this.COLLECTION, postId));
      if (!post.exists() || post.data().status !== "published") return null;
      const data = post.data();
      return {
        ...data,
        id: post.id,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        publishedAt: data.publishedAt?.toDate(),
      } as DhammaPost;
    } catch (error) {
      // Archived/deleted bookmarks remain harmless; connection errors still reach the retry UI.
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "permission-denied"
      )
        return null;
      throw error;
    }
  }

  static async getPostById(postId: string): Promise<DhammaPost | null> {
    try {
      const postRef = doc(db, this.COLLECTION, postId);
      const postSnap = await getDoc(postRef);

      if (postSnap.exists()) {
        const data = postSnap.data();
        return {
          id: postSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          publishedAt: data.publishedAt?.toDate() || undefined,
        } as DhammaPost;
      }

      return null;
    } catch (error) {
      console.error("Error fetching Dhamma post:", error);
      throw new Error("Failed to fetch Dhamma post");
    }
  }

  // Get published posts for public display
  static async getPublishedPosts(): Promise<DhammaPost[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where("status", "==", "published"),
        orderBy("publishedAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      const posts: DhammaPost[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          publishedAt: data.publishedAt?.toDate() || undefined,
        } as DhammaPost);
      });

      return posts;
    } catch (error) {
      console.error("Error fetching published Dhamma posts:", error);
      throw new Error("Failed to fetch published Dhamma posts");
    }
  }

  // Increment view count for a post
  static async incrementViewCount(postId: string): Promise<void> {
    try {
      const postRef = doc(db, this.COLLECTION, postId);
      const postSnap = await getDoc(postRef);

      if (postSnap.exists()) {
        const currentViews = postSnap.data().viewCount || 0;
        await updateDoc(postRef, {
          viewCount: currentViews + 1,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error incrementing view count:", error);
      // Don't throw error for view count updates
    }
  }
}
