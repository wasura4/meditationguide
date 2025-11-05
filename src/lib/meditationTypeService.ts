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
import { MeditationType } from '@/types';

export class MeditationTypeService {
  private static COLLECTION = 'meditation_types';

  // Create a new meditation type (admin only)
  static async createType(typeData: Omit<MeditationType, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const typeToSave = {
        ...typeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), typeToSave);
      return docRef.id;
    } catch (error) {
      console.error('Error creating meditation type:', error);
      throw new Error('Failed to create meditation type');
    }
  }

  // Update an existing meditation type (admin only)
  static async updateType(typeId: string, updates: Partial<Omit<MeditationType, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const typeRef = doc(db, this.COLLECTION, typeId);
      await updateDoc(typeRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating meditation type:', error);
      throw new Error('Failed to update meditation type');
    }
  }

  // Delete a meditation type (admin only)
  static async deleteType(typeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, typeId));
    } catch (error) {
      console.error('Error deleting meditation type:', error);
      throw new Error('Failed to delete meditation type');
    }
  }

  // Get all active meditation types (public)
  static async getActiveTypes(): Promise<MeditationType[]> {
    try {
      // Try with composite index first (isActive + order)
      try {
        const q = query(
          collection(db, this.COLLECTION),
          where('isActive', '==', true),
          orderBy('order', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const types: MeditationType[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          types.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as MeditationType);
        });

        return types;
      } catch (indexError: any) {
        // If composite index is missing, fallback to client-side filtering
        if (indexError.code === 'failed-precondition' || indexError.message?.includes('index')) {
          console.warn('Composite index missing, using client-side filter:', indexError);
          
          // Get all types and filter client-side
          const allTypesQuery = query(
            collection(db, this.COLLECTION),
            orderBy('order', 'asc')
          );
          
          const allSnapshot = await getDocs(allTypesQuery);
          const types: MeditationType[] = [];

          allSnapshot.forEach((doc) => {
            const data = doc.data();
            // Only include active types
            if (data.isActive === true) {
              types.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
              } as MeditationType);
            }
          });

          return types;
        }
        throw indexError;
      }
    } catch (error) {
      console.error('Error fetching active meditation types:', error);
      throw new Error('Failed to fetch meditation types');
    }
  }

  // Get all meditation types (admin only)
  static async getAllTypes(): Promise<MeditationType[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        orderBy('order', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const types: MeditationType[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        types.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as MeditationType);
      });

      return types;
    } catch (error) {
      console.error('Error fetching all meditation types:', error);
      throw new Error('Failed to fetch meditation types');
    }
  }

  // Get a single meditation type by ID
  static async getTypeById(typeId: string): Promise<MeditationType | null> {
    try {
      const typeDoc = await getDoc(doc(db, this.COLLECTION, typeId));

      if (typeDoc.exists()) {
        const data = typeDoc.data();
        return {
          id: typeDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as MeditationType;
      }

      return null;
    } catch (error) {
      console.error('Error fetching meditation type:', error);
      throw new Error('Failed to fetch meditation type');
    }
  }

  // Get meditation types by category
  static async getTypesByCategory(category: string): Promise<MeditationType[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const types: MeditationType[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        types.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as MeditationType);
      });

      return types;
    } catch (error) {
      console.error('Error fetching meditation types by category:', error);
      throw new Error('Failed to fetch meditation types by category');
    }
  }

  // Toggle meditation type active status (admin only)
  static async toggleTypeStatus(typeId: string, isActive: boolean): Promise<void> {
    try {
      const typeRef = doc(db, this.COLLECTION, typeId);
      await updateDoc(typeRef, {
        isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error toggling meditation type status:', error);
      throw new Error('Failed to toggle meditation type status');
    }
  }

  // Update type order (admin only)
  static async updateTypeOrder(typeId: string, order: number): Promise<void> {
    try {
      const typeRef = doc(db, this.COLLECTION, typeId);
      await updateDoc(typeRef, {
        order,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating meditation type order:', error);
      throw new Error('Failed to update meditation type order');
    }
  }
}
