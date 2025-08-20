import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { DhammaPost, DhammaPostFormData } from '@/types/admin';

export class DhammaService {
  private static COLLECTION = 'dhamma_posts';

  // Create a new Dhamma post
  static async createPost(postData: DhammaPostFormData, adminUserId: string, adminDisplayName: string): Promise<string> {
    try {
      const postToSave = {
        ...postData,
        authorId: adminUserId,
        authorName: adminDisplayName,
        viewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: postData.status === 'published' ? serverTimestamp() : null,
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), postToSave);
      return docRef.id;
    } catch (error) {
      console.error('Error creating Dhamma post:', error);
      throw new Error('Failed to create Dhamma post');
    }
  }

  // Update an existing Dhamma post
  static async updatePost(postId: string, postData: DhammaPostFormData): Promise<void> {
    try {
      const postRef = doc(db, this.COLLECTION, postId);
      const updateData = {
        ...postData,
        updatedAt: serverTimestamp(),
        publishedAt: postData.status === 'published' ? serverTimestamp() : null,
      };

      await updateDoc(postRef, updateData);
    } catch (error) {
      console.error('Error updating Dhamma post:', error);
      throw new Error('Failed to update Dhamma post');
    }
  }

  // Delete a Dhamma post
  static async deletePost(postId: string): Promise<void> {
    try {
      const postRef = doc(db, this.COLLECTION, postId);
      await deleteDoc(postRef);
    } catch (error) {
      console.error('Error deleting Dhamma post:', error);
      throw new Error('Failed to delete Dhamma post');
    }
  }

  // Get all Dhamma posts
  static async getAllPosts(): Promise<DhammaPost[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        orderBy('createdAt', 'desc')
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
      console.error('Error fetching Dhamma posts:', error);
      throw new Error('Failed to fetch Dhamma posts');
    }
  }

  // Get a single Dhamma post by ID
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
      console.error('Error fetching Dhamma post:', error);
      throw new Error('Failed to fetch Dhamma post');
    }
  }

  // Get published posts for public display
  static async getPublishedPosts(): Promise<DhammaPost[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc')
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
      console.error('Error fetching published Dhamma posts:', error);
      throw new Error('Failed to fetch published Dhamma posts');
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
      console.error('Error incrementing view count:', error);
      // Don't throw error for view count updates
    }
  }
}
