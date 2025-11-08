import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PathProgress } from '@/types';

const USERS_COLLECTION = 'users';

export class UserPathService {
  /**
   * Get user's path progress
   */
  static async getUserPath(userId: string): Promise<PathProgress | null> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return null;
      }

      const data = userSnap.data();

      // If pathProgress doesn't exist, initialize it
      if (!data.pathProgress) {
        const initialProgress: PathProgress = {
          currentStage: 1,
          updatedAt: new Date(),
          history: []
        };

        // Save initial progress
        await updateDoc(userRef, {
          pathProgress: {
            currentStage: 1,
            updatedAt: serverTimestamp(),
            history: []
          }
        });

        return initialProgress;
      }

      // Convert Firestore timestamps to Date objects
      return {
        currentStage: data.pathProgress.currentStage,
        updatedAt: data.pathProgress.updatedAt?.toDate() || new Date(),
        history: (data.pathProgress.history || []).map((entry: {
          stage: number;
          updatedAt?: Timestamp;
          notes?: string;
        }) => ({
          stage: entry.stage,
          updatedAt: entry.updatedAt?.toDate() || new Date(),
          notes: entry.notes
        }))
      };
    } catch (error) {
      console.error('Error fetching user path:', error);
      throw error;
    }
  }

  /**
   * Update user's current stage
   */
  static async updateCurrentStage(
    userId: string,
    newStage: number,
    notes?: string
  ): Promise<void> {
    try {
      if (newStage < 1 || newStage > 8) {
        throw new Error('Invalid stage number. Must be between 1 and 8.');
      }

      const userRef = doc(db, USERS_COLLECTION, userId);

      // Create history entry with current timestamp
      // Note: Cannot use serverTimestamp() inside arrayUnion()
      const now = Timestamp.now();
      const historyEntry: {
        stage: number;
        updatedAt: Timestamp;
        notes?: string;
      } = {
        stage: newStage,
        updatedAt: now
      };

      if (notes) {
        historyEntry.notes = notes;
      }

      await updateDoc(userRef, {
        'pathProgress.currentStage': newStage,
        'pathProgress.updatedAt': serverTimestamp(),
        'pathProgress.history': arrayUnion(historyEntry)
      });
    } catch (error) {
      console.error('Error updating path stage:', error);
      throw error;
    }
  }

  /**
   * Move to next stage
   */
  static async moveToNextStage(userId: string, notes?: string): Promise<number> {
    try {
      const currentPath = await this.getUserPath(userId);

      if (!currentPath) {
        throw new Error('User path not found');
      }

      if (currentPath.currentStage >= 8) {
        throw new Error('Already at final stage (Nibbana)');
      }

      const newStage = currentPath.currentStage + 1;
      await this.updateCurrentStage(userId, newStage, notes);

      return newStage;
    } catch (error) {
      console.error('Error moving to next stage:', error);
      throw error;
    }
  }

  /**
   * Move to previous stage (for corrections)
   */
  static async moveToPreviousStage(userId: string, notes?: string): Promise<number> {
    try {
      const currentPath = await this.getUserPath(userId);

      if (!currentPath) {
        throw new Error('User path not found');
      }

      if (currentPath.currentStage <= 1) {
        throw new Error('Already at first stage');
      }

      const newStage = currentPath.currentStage - 1;
      await this.updateCurrentStage(userId, newStage, notes);

      return newStage;
    } catch (error) {
      console.error('Error moving to previous stage:', error);
      throw error;
    }
  }

  /**
   * Reset path to beginning
   */
  static async resetPath(userId: string): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);

      // Create reset entry with current timestamp
      const now = Timestamp.now();

      await updateDoc(userRef, {
        'pathProgress.currentStage': 1,
        'pathProgress.updatedAt': serverTimestamp(),
        // Keep history but add reset entry
        'pathProgress.history': arrayUnion({
          stage: 1,
          updatedAt: now,
          notes: 'Path reset to beginning'
        })
      });
    } catch (error) {
      console.error('Error resetting path:', error);
      throw error;
    }
  }
}
