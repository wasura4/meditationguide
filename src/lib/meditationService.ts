import { doc, getDoc, getDocs, collection, query, where, orderBy, limit, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { MeditationSession } from '@/types';
import { EventService } from './eventService';

export class MeditationService {
  // Save a new meditation session
  static async saveSession(session: Omit<MeditationSession, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'meditation_sessions'), {
        ...session,
        startTime: session.startTime,
        endTime: session.endTime,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });

      // If this session is part of an event, record participation
      if (session.eventId && session.status === 'completed') {
        try {
          await EventService.recordParticipation(
            session.eventId,
            session.userId,
            session.duration
          );
        } catch (eventError) {
          console.error('Error recording event participation:', eventError);
          // Don't fail the session save if event participation fails
        }
      }

      return docRef.id;
    } catch (error) {
      console.error('Error saving meditation session:', error);
      throw new Error('Failed to save meditation session');
    }
  }

  // Update an existing session (e.g., with reflection notes)
  static async updateSession(sessionId: string, updates: Partial<MeditationSession>): Promise<void> {
    try {
      const sessionRef = doc(db, 'meditation_sessions', sessionId);
      await updateDoc(sessionRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating meditation session:', error);
      throw new Error('Failed to update meditation session');
    }
  }

  // Get a single session by ID
  static async getSession(sessionId: string): Promise<MeditationSession | null> {
    try {
      const sessionDoc = await getDoc(doc(db, 'meditation_sessions', sessionId));
      if (sessionDoc.exists()) {
        const data = sessionDoc.data();
        return {
          ...data,
          startTime: data.startTime.toDate(),
          endTime: data.endTime?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as MeditationSession;
      }
      return null;
    } catch (error) {
      console.error('Error getting meditation session:', error);
      throw new Error('Failed to get meditation session');
    }
  }

  // Get user's meditation sessions
  static async getUserSessions(userId: string, limitCount: number = 50): Promise<MeditationSession[]> {
    try {
      // First try with ordering (requires index)
      try {
        const sessionsQuery = query(
          collection(db, 'meditation_sessions'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        const querySnapshot = await getDocs(sessionsQuery);
        const sessions: MeditationSession[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          sessions.push({
            ...data,
            id: doc.id,
            startTime: data.startTime.toDate(),
            endTime: data.endTime?.toDate(),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          } as MeditationSession);
        });

        return sessions;
      } catch (indexError: unknown) {
        // If index doesn't exist, fall back to simple query and sort in memory
        const error = indexError as { code?: string; message?: string };
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          console.log('Index not ready, using fallback query...');
          
          const sessionsQuery = query(
            collection(db, 'meditation_sessions'),
            where('userId', '==', userId),
            limit(limitCount)
          );

          const querySnapshot = await getDocs(sessionsQuery);
          const sessions: MeditationSession[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            sessions.push({
              ...data,
              id: doc.id,
              startTime: data.startTime.toDate(),
              endTime: data.endTime?.toDate(),
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate(),
            } as MeditationSession);
          });

          // Sort in memory (less efficient but works without index)
          return sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        
        // Re-throw if it's not an index error
        throw indexError;
      }
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw new Error('Failed to get user sessions');
    }
  }

  // Get sessions by date range
  static async getSessionsByDateRange(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<MeditationSession[]> {
    try {
      const sessionsQuery = query(
        collection(db, 'meditation_sessions'),
        where('userId', '==', userId),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(sessionsQuery);
      const sessions: MeditationSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          ...data,
          id: doc.id,
          startTime: data.startTime.toDate(),
          endTime: data.endTime?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as MeditationSession);
      });

      return sessions;
    } catch (error) {
      console.error('Error getting sessions by date range:', error);
      throw new Error('Failed to get sessions by date range');
    }
  }

  // Get sessions by meditation type
  static async getSessionsByType(userId: string, typeId: string): Promise<MeditationSession[]> {
    try {
      const sessionsQuery = query(
        collection(db, 'meditation_sessions'),
        where('userId', '==', userId),
        where('typeId', '==', typeId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(sessionsQuery);
      const sessions: MeditationSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          ...data,
          id: doc.id,
          startTime: data.startTime.toDate(),
          endTime: data.endTime?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as MeditationSession);
      });

      return sessions;
    } catch (error) {
      console.error('Error getting sessions by type:', error);
      throw new Error('Failed to get sessions by type');
    }
  }

  // Delete a session
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'meditation_sessions', sessionId));
    } catch (error) {
      console.error('Error deleting meditation session:', error);
      throw new Error('Failed to delete meditation session');
    }
  }

  // Get user statistics
  static async getUserStats(userId: string): Promise<{
    totalSessions: number;
    totalMinutes: number;
    averageSessionLength: number;
    favoriteType: string;
    currentStreak: number;
    longestStreak: number;
  }> {
    try {
      const sessions = await this.getUserSessions(userId, 1000); // Get more sessions for accurate stats
      
      if (sessions.length === 0) {
        return {
          totalSessions: 0,
          totalMinutes: 0,
          averageSessionLength: 0,
          favoriteType: '',
          currentStreak: 0,
          longestStreak: 0,
        };
      }

      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
      const averageSessionLength = Math.round(totalMinutes / totalSessions);

      // Calculate favorite type
      const typeCounts: Record<string, number> = {};
      sessions.forEach(session => {
        typeCounts[session.typeId] = (typeCounts[session.typeId] || 0) + 1;
      });
      const favoriteType = Object.entries(typeCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];

      // Calculate streaks
      const sortedSessions = sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      for (const session of sortedSessions) {
        const sessionDate = new Date(session.createdAt);
        sessionDate.setHours(0, 0, 0, 0);

        if (lastDate === null) {
          lastDate = sessionDate;
          tempStreak = 1;
          currentStreak = 1;
        } else {
          const diffTime = Math.abs(lastDate.getTime() - sessionDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            tempStreak++;
            if (tempStreak === 2) { // First session of current streak
              currentStreak = tempStreak;
            } else if (tempStreak > currentStreak) {
              currentStreak = tempStreak;
            }
          } else if (diffDays > 1) {
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
            tempStreak = 1;
          }
        }
        lastDate = sessionDate;
      }

      // Check if current streak is longer than longest
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      return {
        totalSessions,
        totalMinutes,
        averageSessionLength,
        favoriteType,
        currentStreak,
        longestStreak,
      };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      throw new Error('Failed to calculate user stats');
    }
  }
}
