import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MeditationCategory, MeditationCategoryFormData } from '@/types/admin';

const COLLECTION_NAME = 'meditationCategories';

export class MeditationCategoryService {
  /**
   * Get all active meditation categories, ordered by order field
   */
  static async getActiveCategories(): Promise<MeditationCategory[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as MeditationCategory[];
    } catch (error) {
      console.error('Error fetching active categories:', error);
      throw error;
    }
  }

  /**
   * Get all meditation categories (including inactive), for admin management
   */
  static async getAllCategories(): Promise<MeditationCategory[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as MeditationCategory[];
    } catch (error) {
      console.error('Error fetching all categories:', error);
      throw error;
    }
  }

  /**
   * Get a single category by ID
   */
  static async getCategoryById(id: string): Promise<MeditationCategory | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as MeditationCategory;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  /**
   * Create a new meditation category
   */
  static async createCategory(
    formData: MeditationCategoryFormData,
    adminId: string
  ): Promise<string> {
    try {
      // Get the highest order number and increment
      const allCategories = await this.getAllCategories();
      const maxOrder = allCategories.length > 0
        ? Math.max(...allCategories.map(c => c.order))
        : 0;

      const categoryData = {
        name: formData.name,
        nameEn: formData.nameEn,
        description: formData.description,
        color: formData.color,
        order: formData.order ?? maxOrder + 1,
        isActive: formData.isActive ?? true,
        createdBy: adminId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), categoryData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Update an existing meditation category
   */
  static async updateCategory(
    id: string,
    formData: Partial<MeditationCategoryFormData>
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: Record<string, unknown> = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Delete a meditation category
   * Note: Should check if any meditation types use this category before deleting
   */
  static async deleteCategory(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Toggle category active status
   */
  static async toggleActiveStatus(id: string, isActive: boolean): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error toggling category status:', error);
      throw error;
    }
  }

  /**
   * Reorder categories
   */
  static async reorderCategories(categoryOrders: { id: string; order: number }[]): Promise<void> {
    try {
      const updatePromises = categoryOrders.map(({ id, order }) => {
        const docRef = doc(db, COLLECTION_NAME, id);
        return updateDoc(docRef, {
          order,
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw error;
    }
  }

  /**
   * Check if a category is being used by any meditation types
   */
  static async isCategoryInUse(categoryId: string): Promise<boolean> {
    try {
      const meditationTypesQuery = query(
        collection(db, 'meditationTypes'),
        where('category', '==', categoryId),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(meditationTypesQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking category usage:', error);
      return false;
    }
  }
}
