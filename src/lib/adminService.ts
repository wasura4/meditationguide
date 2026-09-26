import { collection, query, getDocs, getDoc, doc, updateDoc, orderBy, limit, startAfter, Timestamp, QueryDocumentSnapshot, getCountFromServer, where } from 'firebase/firestore';
import { db } from './firebase';
import { normalizeAdminProfile } from './adminUserProfile';
import { analyticsStart, buildAdminAnalytics, type AdminTimeRange } from './adminAnalytics';
import { User } from '@/types';
import { AdminStats } from '@/types/admin';
import { MeditationService } from './meditationService';
import { MeditationSession } from '@/types';

export class AdminService {
  // Get all users with pagination
  static async getUsers(pageSize: number = 50, lastDoc?: QueryDocumentSnapshot): Promise<{ users: User[]; lastDoc: QueryDocumentSnapshot | undefined }> {
    try {
      let q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const querySnapshot = await getDocs(q);
      const users: User[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        users.push(normalizeAdminProfile(docSnapshot.id, data));
      });

      const lastDocument = querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : undefined;
      return { users, lastDoc: lastDocument };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  // Search users
  static async searchUsers(searchTerm: string): Promise<User[]> {
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const users: User[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const displayName = (data.displayName || '').toLowerCase();
        const email = (data.email || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        if (displayName.includes(search) || email.includes(search) || docSnapshot.id.toLowerCase().includes(search)) {
          users.push(normalizeAdminProfile(docSnapshot.id, data));
        }
      });

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return normalizeAdminProfile(userDoc.id, data);
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user');
    }
  }

  // Full history for profile totals; do not silently cap lifetime figures.
  static async getUserPracticeHistory(userId: string): Promise<MeditationSession[]> {
    return MeditationService.getAllUserSessions(userId);
  }

  // Get user sessions
  static async getUserSessions(userId: string, limitCount: number = 100): Promise<MeditationSession[]> {
    try {
      return await MeditationService.getUserSessions(userId, limitCount);
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw new Error('Failed to fetch user sessions');
    }
  }

  // Update user
  static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  // All totals and rankings use the selected window; content inventory remains lifetime.
  static async getAdminAnalytics(timeRange: AdminTimeRange = '30d') {
    const now = new Date();
    const from = analyticsStart(timeRange, now);
    const countActivity = (name: string) => getCountFromServer(query(collection(db, name), ...(from ? [where('createdAt', '>=', from)] : []), where('createdAt', '<=', now)));
    const [usersSnapshot, sessionsSnapshot, audioCount, postsCount, reads, listens] = await Promise.all([
      getDocs(collection(db, 'users')), getDocs(collection(db, 'meditation_sessions')),
      getCountFromServer(collection(db, 'kamatahan_audio')), getCountFromServer(collection(db, 'dhamma_posts')),
      countActivity('dhamma_reads'), countActivity('audio_listens'),
    ]);
    // Missing dates must not appear as new registrations or sessions today.
    const date = (value: {toDate?:()=>Date} | undefined) => value?.toDate?.() || new Date(NaN);
    const users = usersSnapshot.docs.map(snapshot => {
      const data = snapshot.data();
      return {...data, id:snapshot.id, displayName:data.displayName||'', email:data.email||'', createdAt:date(data.createdAt), updatedAt:date(data.updatedAt)} as User;
    });
    const sessions = sessionsSnapshot.docs.map(snapshot => {
      const data = snapshot.data();
      return {...data, id:snapshot.id, createdAt:date(data.createdAt)} as MeditationSession;
    });
    return {...buildAdminAnalytics(users,sessions,timeRange,now),content:{audioFiles:audioCount.data().count,dhammaPosts:postsCount.data().count,totalViews:reads.data().count,totalAudioListens:listens.data().count}};
  }

  // Get admin stats (simplified version for dashboard)
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const usersQuery = query(collection(db, 'users'));
      const sessionsQuery = query(collection(db, 'meditation_sessions'));
      const audioQuery = query(collection(db, 'kamatahan_audio'));
      const postsQuery = query(collection(db, 'dhamma_posts'));
      const audioListensQuery = query(collection(db, 'audio_listens'));

      const [usersSnapshot, sessionsSnapshot, audioSnapshot, postsSnapshot, audioListensSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(sessionsQuery),
        getDocs(audioQuery),
        getDocs(postsQuery),
        getDocs(audioListensQuery),
      ]);

      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalUsers = usersSnapshot.size;
      const activeUsersToday = new Set(
        sessionsSnapshot.docs
          .filter(d => d.data().createdAt?.toDate() >= todayStart)
          .map(d => d.data().userId)
      ).size;
      const newUsersThisWeek = usersSnapshot.docs.filter(
        d => d.data().createdAt?.toDate() >= weekStart
      ).length;

      const totalSessions = sessionsSnapshot.size;
      const totalMinutes = sessionsSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().duration || 0), 0
      );

      // Calculate audio listening statistics
      const totalAudioListens = audioListensSnapshot.size;

      return {
        totalUsers,
        totalSessions,
        totalAudioFiles: audioSnapshot.size,
        totalDhammaPosts: postsSnapshot.size,
        activeUsersToday,
        newUsersThisWeek,
        totalMeditationMinutes: totalMinutes,
        totalAudioListens,
        popularAudioFiles: [],
        popularDhammaPosts: [],
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw new Error('Failed to fetch admin stats');
    }
  }

  // Get users grouped by path stage
  static async getUsersByStage(): Promise<Record<number, User[]>> {
    try {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);

      const usersByStage: Record<number, User[]> = {};

      // Initialize all stages
      for (let stage = 1; stage <= 8; stage++) {
        usersByStage[stage] = [];
      }

      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        const user: User = {
          id: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          photoURL: data.photoURL || null,
          role: data.role || 'user',
          lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
          isAnonymous: data.isAnonymous || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          preferences: data.preferences || {
            theme: 'light',
            language: 'en',
            notifications: { email: true, push: true },
          },
          pathProgress: data.pathProgress ? {
            currentStage: data.pathProgress.currentStage,
            updatedAt: data.pathProgress.updatedAt?.toDate() || new Date(),
            history: []
          } : undefined,
        };

        // Add user to their current stage
        if (user.pathProgress && user.pathProgress.currentStage >= 1 && user.pathProgress.currentStage <= 8) {
          usersByStage[user.pathProgress.currentStage].push(user);
        }
      });

      return usersByStage;
    } catch (error) {
      console.error('Error fetching users by stage:', error);
      throw new Error('Failed to fetch users by stage');
    }
  }
}
