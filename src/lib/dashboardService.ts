import { MeditationService } from './meditationService';
import { MeditationSession } from '@/types';
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval, format } from 'date-fns';

export interface DashboardStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  thisWeekMinutes: number;
  lastWeekMinutes: number;
  favoriteMeditationType: string;
  dhammaPostsRead: number;
  audioSessions: number;
  averageSessionLength: number;
  weeklyGoal: number;
  weeklyGoalProgress: number;
  meditationTypes: Array<{
    typeId: string;
    typeName: string;
    sessions: number;
    minutes: number;
  }>;
  recentSessions: MeditationSession[];
}

export class DashboardService {
  static async getUserDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      // Get all user sessions
      const allSessions = await MeditationService.getUserSessions(userId, 1000);
      
      if (allSessions.length === 0) {
        return this.getEmptyStats();
      }

      // Calculate basic stats
      const totalSessions = allSessions.length;
      const totalMinutes = allSessions.reduce((sum, session) => sum + session.duration, 0);
      const averageSessionLength = Math.round(totalMinutes / totalSessions);

      // Calculate weekly stats
      const now = new Date();
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
      const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const lastWeekStart = subWeeks(thisWeekStart, 1);
      const lastWeekEnd = subWeeks(thisWeekEnd, 1);

      const thisWeekSessions = allSessions.filter(session => 
        isWithinInterval(session.createdAt, { start: thisWeekStart, end: thisWeekEnd })
      );
      const lastWeekSessions = allSessions.filter(session => 
        isWithinInterval(session.createdAt, { start: lastWeekStart, end: lastWeekEnd })
      );

      const thisWeekMinutes = thisWeekSessions.reduce((sum, session) => sum + session.duration, 0);
      const lastWeekMinutes = lastWeekSessions.reduce((sum, session) => sum + session.duration, 0);

      // Calculate favorite meditation type
      const typeCounts: Record<string, { sessions: number; minutes: number; name: string }> = {};
      allSessions.forEach(session => {
        if (!typeCounts[session.typeId]) {
          typeCounts[session.typeId] = { sessions: 0, minutes: 0, name: session.typeName };
        }
        typeCounts[session.typeId].sessions += 1;
        typeCounts[session.typeId].minutes += session.duration;
      });

      const favoriteType = Object.entries(typeCounts).reduce((a, b) => 
        a[1].sessions > b[1].sessions ? a : b
      )[0];

      // Calculate streaks
      const { currentStreak, longestStreak } = this.calculateStreaks(allSessions);

      // Get meditation types breakdown
      const meditationTypes = Object.entries(typeCounts).map(([typeId, data]) => ({
        typeId,
        typeName: data.name,
        sessions: data.sessions,
        minutes: data.minutes,
      }));

      // Get recent sessions (last 5)
      const recentSessions = allSessions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

      // Weekly goal (200 minutes per week)
      const weeklyGoal = 200;
      const weeklyGoalProgress = Math.min((thisWeekMinutes / weeklyGoal) * 100, 100);

      // For now, we'll use placeholder values for Dhamma posts and audio sessions
      // These can be enhanced later when we implement user activity tracking
      const dhammaPostsRead = 0; // TODO: Implement user reading tracking
      const audioSessions = 0; // TODO: Implement audio session tracking

      return {
        totalSessions,
        totalMinutes,
        currentStreak,
        longestStreak,
        thisWeekMinutes,
        lastWeekMinutes,
        favoriteMeditationType: typeCounts[favoriteType]?.name || 'Unknown',
        dhammaPostsRead,
        audioSessions,
        averageSessionLength,
        weeklyGoal,
        weeklyGoalProgress,
        meditationTypes,
        recentSessions,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return this.getEmptyStats();
    }
  }

  private static calculateStreaks(sessions: MeditationSession[]): { currentStreak: number; longestStreak: number } {
    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

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

    return { currentStreak, longestStreak };
  }

  private static getEmptyStats(): DashboardStats {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      thisWeekMinutes: 0,
      lastWeekMinutes: 0,
      favoriteMeditationType: 'None yet',
      dhammaPostsRead: 0,
      audioSessions: 0,
      averageSessionLength: 0,
      weeklyGoal: 200,
      weeklyGoalProgress: 0,
      meditationTypes: [],
      recentSessions: [],
    };
  }

  // Get weekly progress data for charts
  static async getWeeklyProgressData(userId: string, weeks: number = 8): Promise<Array<{
    week: string;
    minutes: number;
    sessions: number;
    goal: number;
  }>> {
    try {
      const allSessions = await MeditationService.getUserSessions(userId, 1000);
      const weeklyData = [];

      for (let i = 0; i < weeks; i++) {
        const weekStart = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        
        const weekSessions = allSessions.filter(session => 
          isWithinInterval(session.createdAt, { start: weekStart, end: weekEnd })
        );

        const weekMinutes = weekSessions.reduce((sum, session) => sum + session.duration, 0);
        const weekLabel = format(weekStart, 'MMM dd');

        weeklyData.unshift({
          week: weekLabel,
          minutes: weekMinutes,
          sessions: weekSessions.length,
          goal: 200,
        });
      }

      return weeklyData;
    } catch (error) {
      console.error('Error getting weekly progress data:', error);
      return [];
    }
  }

  // Get meditation type distribution for pie charts
  static async getMeditationTypeDistribution(userId: string): Promise<Array<{
    type: string;
    sessions: number;
    minutes: number;
    percentage: number;
  }>> {
    try {
      const allSessions = await MeditationService.getUserSessions(userId, 1000);
      
      if (allSessions.length === 0) {
        return [];
      }

      const typeCounts: Record<string, { sessions: number; minutes: number; name: string }> = {};
      allSessions.forEach(session => {
        if (!typeCounts[session.typeId]) {
          typeCounts[session.typeId] = { sessions: 0, minutes: 0, name: session.typeName };
        }
        typeCounts[session.typeId].sessions += 1;
        typeCounts[session.typeId].minutes += session.duration;
      });

      const totalSessions = allSessions.length;
      
      return Object.entries(typeCounts).map(([, data]) => ({
        type: data.name,
        sessions: data.sessions,
        minutes: data.minutes,
        percentage: Math.round((data.sessions / totalSessions) * 100),
      }));
    } catch (error) {
      console.error('Error getting meditation type distribution:', error);
      return [];
    }
  }
}
