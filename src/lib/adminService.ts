import { collection, query, getDocs, getDoc, doc, updateDoc, orderBy, limit, startAfter, Timestamp, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './firebase';
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
        users.push({
          id: docSnapshot.id,
          email: data.email || '',
          displayName: data.displayName || '',
          photoURL: data.photoURL || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          preferences: data.preferences || {
            theme: 'light',
            language: 'en',
            notifications: {
              email: true,
              push: true,
            },
          },
        } as User);
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
      const q = query(collection(db, 'users'), orderBy('displayName', 'asc'));
      const querySnapshot = await getDocs(q);
      const users: User[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const displayName = (data.displayName || '').toLowerCase();
        const email = (data.email || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        if (displayName.includes(search) || email.includes(search)) {
          users.push({
            id: docSnapshot.id,
            email: data.email || '',
            displayName: data.displayName || '',
            photoURL: data.photoURL || null,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            preferences: data.preferences || {
              theme: 'light',
              language: 'en',
              notifications: {
                email: true,
                push: true,
              },
            },
          } as User);
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
        return {
          id: userDoc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          photoURL: data.photoURL || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          preferences: data.preferences || {
            theme: 'light',
            language: 'en',
            notifications: {
              email: true,
              push: true,
            },
          },
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user');
    }
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

  // Delete user (soft delete by deactivating)
  static async deleteUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: false,
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  // Get comprehensive admin analytics
  static async getAdminAnalytics(timeRange: '7d' | '30d' | '90d' | 'all' = '30d'): Promise<{
    users: {
      total: number;
      active: number;
      new: number;
      growth: number;
    };
    sessions: {
      total: number;
      completed: number;
      average: number;
      growth: number;
    };
    engagement: {
      dailyActive: number[];
      weeklyActive: number[];
      monthlyActive: number;
      retentionRate: number;
    };
    meditation: {
      totalMinutes: number;
      averageSession: number;
      popularTypes: Array<{ type: string; count: number; percentage: number }>;
    };
    content: {
      audioFiles: number;
      dhammaPosts: number;
      totalViews: number;
    };
    trends: {
      userGrowth: Array<{ date: string; count: number }>;
      sessionGrowth: Array<{ date: string; count: number }>;
    };
  }> {
    try {
      // Get date range
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Get all users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      // Get all sessions
      const sessionsQuery = query(collection(db, 'meditation_sessions'), orderBy('createdAt', 'desc'));
      const sessionsSnapshot = await getDocs(sessionsQuery);

      const allUsers: User[] = [];
      const allSessions: MeditationSession[] = [];

      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        allUsers.push({
          id: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          photoURL: data.photoURL || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          preferences: data.preferences || {
            theme: 'light',
            language: 'en',
            notifications: { email: true, push: true },
          },
        } as User);
      });

      sessionsSnapshot.forEach((doc) => {
        const data = doc.data();
        allSessions.push({
          id: doc.id,
          userId: data.userId,
          typeId: data.typeId || '',
          typeName: data.typeName || '',
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate() || new Date(),
          duration: data.duration || 0,
          status: data.status || 'completed',
          tags: data.tags || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as MeditationSession);
      });

      // Filter by time range
      const filteredUsers = allUsers.filter(u => u.createdAt >= startDate);
      const filteredSessions = allSessions.filter(s => s.createdAt >= startDate);
      const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));

      // Calculate metrics
      const totalUsers = allUsers.length;
      const activeUsers = new Set(allSessions.map(s => s.userId)).size;
      const newUsers = filteredUsers.length;
      const previousNewUsers = allUsers.filter(u => 
        u.createdAt >= previousPeriodStart && u.createdAt < startDate
      ).length;
      const userGrowth = previousNewUsers > 0 
        ? ((newUsers - previousNewUsers) / previousNewUsers) * 100 
        : newUsers > 0 ? 100 : 0;

      const totalSessions = allSessions.length;
      const completedSessions = allSessions.filter(s => s.status === 'completed').length;
      const averageSession = totalSessions > 0 
        ? Math.round(allSessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions)
        : 0;
      const previousSessions = allSessions.filter(s => 
        s.createdAt >= previousPeriodStart && s.createdAt < startDate
      ).length;
      const sessionGrowth = previousSessions > 0
        ? ((filteredSessions.length - previousSessions) / previousSessions) * 100
        : filteredSessions.length > 0 ? 100 : 0;

      // Calculate daily active users for last 7 days
      const dailyActive: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        const dayUsers = new Set(
          allSessions
            .filter(s => s.createdAt >= dayStart && s.createdAt <= dayEnd)
            .map(s => s.userId)
        ).size;
        dailyActive.push(dayUsers);
      }

      // Calculate weekly active users for last 4 weeks
      const weeklyActive: number[] = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekUsers = new Set(
          allSessions
            .filter(s => s.createdAt >= weekStart && s.createdAt < weekEnd)
            .map(s => s.userId)
        ).size;
        weeklyActive.push(weekUsers);
      }

      // Calculate popular meditation types
      const typeCounts: Record<string, number> = {};
      allSessions.forEach(s => {
        typeCounts[s.typeName] = (typeCounts[s.typeName] || 0) + 1;
      });
      const popularTypes = Object.entries(typeCounts)
        .map(([type, count]) => ({
          type,
          count,
          percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate trends
      const userGrowthTrend: Array<{ date: string; count: number }> = [];
      const sessionGrowthTrend: Array<{ date: string; count: number }> = [];
      
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        userGrowthTrend.push({
          date: dateStr,
          count: allUsers.filter(u => u.createdAt >= dayStart && u.createdAt <= dayEnd).length,
        });
        
        sessionGrowthTrend.push({
          date: dateStr,
          count: allSessions.filter(s => s.createdAt >= dayStart && s.createdAt <= dayEnd).length,
        });
      }

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          new: newUsers,
          growth: Math.round(userGrowth),
        },
        sessions: {
          total: totalSessions,
          completed: completedSessions,
          average: averageSession,
          growth: Math.round(sessionGrowth),
        },
        engagement: {
          dailyActive,
          weeklyActive,
          monthlyActive: activeUsers,
          retentionRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
        },
        meditation: {
          totalMinutes: allSessions.reduce((sum, s) => sum + s.duration, 0),
          averageSession: averageSession,
          popularTypes,
        },
        content: {
          audioFiles: 0, // TODO: Get from audio collection
          dhammaPosts: 0, // TODO: Get from dhamma_posts collection
          totalViews: 0, // TODO: Get from analytics
        },
        trends: {
          userGrowth: userGrowthTrend,
          sessionGrowth: sessionGrowthTrend,
        },
      };
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      throw new Error('Failed to fetch admin analytics');
    }
  }

  // Get admin stats (simplified version for dashboard)
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const usersQuery = query(collection(db, 'users'));
      const sessionsQuery = query(collection(db, 'meditation_sessions'));
      const audioQuery = query(collection(db, 'kamatahan_audio'));
      const postsQuery = query(collection(db, 'dhamma_posts'));

      const [usersSnapshot, sessionsSnapshot, audioSnapshot, postsSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(sessionsQuery),
        getDocs(audioQuery),
        getDocs(postsQuery),
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

      return {
        totalUsers,
        totalSessions,
        totalAudioFiles: audioSnapshot.size,
        totalDhammaPosts: postsSnapshot.size,
        activeUsersToday,
        newUsersThisWeek,
        totalMeditationMinutes: totalMinutes,
        popularAudioFiles: [],
        popularDhammaPosts: [],
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw new Error('Failed to fetch admin stats');
    }
  }
}

