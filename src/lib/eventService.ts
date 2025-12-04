import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { MeditationEvent, EventParticipation, EventStats } from '@/types';

const EVENTS_COLLECTION = 'meditation_events';
const PARTICIPATION_COLLECTION = 'event_participation';

export class EventService {
  // Create a new event
  static async createEvent(
    eventData: Omit<MeditationEvent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const eventsRef = collection(db, EVENTS_COLLECTION);
      const now = Timestamp.now();

      // Remove undefined fields to avoid Firestore errors
      const cleanedData: Record<string, unknown> = {
        title: eventData.title,
        description: eventData.description,
        startDate: Timestamp.fromDate(eventData.startDate),
        endDate: Timestamp.fromDate(eventData.endDate),
        isActive: eventData.isActive,
        createdBy: eventData.createdBy,
        createdAt: now,
        updatedAt: now,
      };

      // Only add optional fields if they have values
      if (eventData.titleEn) cleanedData.titleEn = eventData.titleEn;
      if (eventData.descriptionEn) cleanedData.descriptionEn = eventData.descriptionEn;
      if (eventData.meditationType) cleanedData.meditationType = eventData.meditationType;
      if (eventData.bannerImageUrl) cleanedData.bannerImageUrl = eventData.bannerImageUrl;
      if (eventData.goalMinutes !== undefined) cleanedData.goalMinutes = eventData.goalMinutes;

      const docRef = await addDoc(eventsRef, cleanedData);

      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Update an existing event
  static async updateEvent(
    eventId: string,
    updates: Partial<Omit<MeditationEvent, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<void> {
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, eventId);
      const updateData: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
      };

      // Only include fields that are not undefined
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.titleEn !== undefined) updateData.titleEn = updates.titleEn;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.descriptionEn !== undefined) updateData.descriptionEn = updates.descriptionEn;
      if (updates.meditationType !== undefined) updateData.meditationType = updates.meditationType;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      if (updates.bannerImageUrl !== undefined) updateData.bannerImageUrl = updates.bannerImageUrl;
      if (updates.goalMinutes !== undefined) updateData.goalMinutes = updates.goalMinutes;

      if (updates.startDate) {
        updateData.startDate = Timestamp.fromDate(updates.startDate);
      }
      if (updates.endDate) {
        updateData.endDate = Timestamp.fromDate(updates.endDate);
      }

      await updateDoc(eventRef, updateData);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  // Delete an event
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Get a single event by ID
  static async getEvent(eventId: string): Promise<MeditationEvent | null> {
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, eventId);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        return null;
      }

      const data = eventSnap.data();
      return {
        id: eventSnap.id,
        ...data,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as MeditationEvent;
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  }

  // Get all events
  static async getAllEvents(): Promise<MeditationEvent[]> {
    try {
      const eventsRef = collection(db, EVENTS_COLLECTION);
      const q = query(eventsRef, orderBy('startDate', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as MeditationEvent;
      });
    } catch (error) {
      console.error('Error getting all events:', error);
      throw error;
    }
  }

  // Get active events (current date is between startDate and endDate)
  static async getActiveEvents(): Promise<MeditationEvent[]> {
    try {
      const now = Timestamp.now();
      const eventsRef = collection(db, EVENTS_COLLECTION);

      console.log('[EventService] Fetching active events...');
      console.log('[EventService] Current date:', now.toDate());

      // Get all events and filter client-side for date range
      const q = query(
        eventsRef,
        where('isActive', '==', true),
        orderBy('startDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      console.log('[EventService] Found events with isActive=true:', querySnapshot.size);

      const allEvents = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as MeditationEvent;
      });

      console.log('[EventService] All isActive events:', allEvents);

      // Filter for active date range
      const currentDate = now.toDate();
      const activeEvents = allEvents.filter(
        (event) => {
          const isActive = event.startDate <= currentDate && event.endDate >= currentDate;
          console.log(`[EventService] Event "${event.title}":`, {
            startDate: event.startDate,
            endDate: event.endDate,
            currentDate,
            isActive
          });
          return isActive;
        }
      );

      console.log('[EventService] Filtered active events:', activeEvents.length);
      return activeEvents;
    } catch (error) {
      console.error('Error getting active events:', error);
      throw error;
    }
  }

  // Get upcoming events
  static async getUpcomingEvents(): Promise<MeditationEvent[]> {
    try {
      const now = Timestamp.now();
      const eventsRef = collection(db, EVENTS_COLLECTION);

      const q = query(
        eventsRef,
        where('isActive', '==', true),
        where('startDate', '>', now),
        orderBy('startDate', 'asc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as MeditationEvent;
      });
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      throw error;
    }
  }

  // Get past events
  static async getPastEvents(): Promise<MeditationEvent[]> {
    try {
      const now = Timestamp.now();
      const eventsRef = collection(db, EVENTS_COLLECTION);

      const q = query(
        eventsRef,
        where('endDate', '<', now),
        orderBy('endDate', 'desc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as MeditationEvent;
      });
    } catch (error) {
      console.error('Error getting past events:', error);
      throw error;
    }
  }

  // Record user participation in an event (called when session is completed)
  static async recordParticipation(
    eventId: string,
    userId: string,
    sessionMinutes: number
  ): Promise<void> {
    try {
      const participationRef = collection(db, PARTICIPATION_COLLECTION);
      const participationId = `${eventId}_${userId}`;
      const participationDocRef = doc(participationRef, participationId);

      const participationSnap = await getDoc(participationDocRef);
      const now = Timestamp.now();

      if (participationSnap.exists()) {
        // Update existing participation
        const currentData = participationSnap.data();
        await updateDoc(participationDocRef, {
          totalMinutes: currentData.totalMinutes + sessionMinutes,
          sessionCount: currentData.sessionCount + 1,
          lastSessionAt: now,
          updatedAt: now,
        });
      } else {
        // Create new participation record using setDoc for new documents
        const batch = writeBatch(db);
        batch.set(participationDocRef, {
          eventId,
          userId,
          totalMinutes: sessionMinutes,
          sessionCount: 1,
          firstSessionAt: now,
          lastSessionAt: now,
          createdAt: now,
          updatedAt: now,
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('Error recording participation:', error);
      throw error;
    }
  }

  // Get user's participation in an event
  static async getUserParticipation(
    eventId: string,
    userId: string
  ): Promise<EventParticipation | null> {
    try {
      const participationId = `${eventId}_${userId}`;
      const participationRef = doc(db, PARTICIPATION_COLLECTION, participationId);
      const participationSnap = await getDoc(participationRef);

      if (!participationSnap.exists()) {
        return null;
      }

      const data = participationSnap.data();
      return {
        ...data,
        firstSessionAt: data.firstSessionAt?.toDate(),
        lastSessionAt: data.lastSessionAt?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as EventParticipation;
    } catch (error) {
      console.error('Error getting user participation:', error);
      throw error;
    }
  }

  // Get event statistics
  static async getEventStats(eventId: string): Promise<EventStats> {
    try {
      // Get all participation records for this event
      const participationRef = collection(db, PARTICIPATION_COLLECTION);
      const q = query(participationRef, where('eventId', '==', eventId));
      const participationSnap = await getDocs(q);

      let totalMinutes = 0;
      let totalSessions = 0;
      const participants: Array<{
        userId: string;
        minutes: number;
        sessions: number;
      }> = [];

      participationSnap.forEach((doc) => {
        const data = doc.data();
        totalMinutes += data.totalMinutes;
        totalSessions += data.sessionCount;
        participants.push({
          userId: data.userId,
          minutes: data.totalMinutes,
          sessions: data.sessionCount,
        });
      });

      // Sort participants by minutes for top contributors
      participants.sort((a, b) => b.minutes - a.minutes);

      // Get user display names for top 10 contributors
      const topContributors = await Promise.all(
        participants.slice(0, 10).map(async (p) => {
          try {
            const userRef = doc(db, 'users', p.userId);
            const userSnap = await getDoc(userRef);
            const displayName = userSnap.exists()
              ? userSnap.data().displayName || 'Anonymous'
              : 'Anonymous';

            return {
              userId: p.userId,
              displayName,
              minutes: p.minutes,
              sessions: p.sessions,
            };
          } catch {
            return {
              userId: p.userId,
              displayName: 'Anonymous',
              minutes: p.minutes,
              sessions: p.sessions,
            };
          }
        })
      );

      // Get event sessions for daily progress
      const sessionsRef = collection(db, 'meditation_sessions');
      const sessionsQuery = query(sessionsRef, where('eventId', '==', eventId));
      const sessionsSnap = await getDocs(sessionsQuery);

      const dailyProgressMap = new Map<
        string,
        { minutes: number; participants: Set<string>; sessions: number }
      >();

      sessionsSnap.forEach((doc) => {
        const data = doc.data();
        const dateKey = data.startTime.toDate().toISOString().split('T')[0];

        if (!dailyProgressMap.has(dateKey)) {
          dailyProgressMap.set(dateKey, {
            minutes: 0,
            participants: new Set(),
            sessions: 0,
          });
        }

        const dayData = dailyProgressMap.get(dateKey)!;
        dayData.minutes += data.duration;
        dayData.participants.add(data.userId);
        dayData.sessions += 1;
      });

      const dailyProgress = Array.from(dailyProgressMap.entries())
        .map(([date, data]) => ({
          date,
          minutes: data.minutes,
          participants: data.participants.size,
          sessions: data.sessions,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        eventId,
        totalParticipants: participants.length,
        totalMinutes,
        totalSessions,
        averageMinutesPerUser:
          participants.length > 0 ? totalMinutes / participants.length : 0,
        topContributors,
        dailyProgress,
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error getting event stats:', error);
      throw error;
    }
  }
}
