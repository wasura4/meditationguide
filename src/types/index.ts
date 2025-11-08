// Core User Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  preferences: UserPreferences;
  isAnonymous: boolean;
}

export type UserRole = 'owner' | 'admin' | 'editor' | 'user';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  timeFormat: '12h' | '24h';
  defaultMeditationType: string;
  language: 'en' | 'si';
  appearance?: {
    accent: 'green' | 'blue' | 'violet' | 'amber' | 'rose' | 'teal';
    radius: number; // px
  };
  notifications: {
    sessionEnd: boolean;
    dailyReminder: boolean;
    weeklyReport: boolean;
  };
}

// Meditation Types
export interface MeditationType {
  id: string;
  name: string;
  description: string;
  category: string; // Dynamic category ID
  defaultDuration: number; // in minutes
  isActive: boolean;
  order: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MeditationSession {
  id: string;
  userId: string;
  typeId: string;
  typeName: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  notes?: string;
  rating?: number; // 1-5
  mood?: 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult';
  distractions?: string[];
  insights?: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Audio/Kamatahan Types
export interface AudioTrack {
  id: string;
  title: string;
  description: string;
  artist?: string;
  duration: number; // in seconds
  audioUrl: string;
  thumbnailUrl?: string;
  category: string;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  playCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: string[]; // track IDs
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Dhamma Content Types
export interface DhammaPost {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  category: string;
  tags: string[];
  author: string;
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Types
export interface UserStats {
  userId: string;
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionLength: number;
  favoriteType: string;
  lastSessionDate?: Date;
  updatedAt: Date;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  sessions: number;
  totalMinutes: number;
  types: Record<string, number>; // typeId -> minutes
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

export interface MeditationFormData {
  typeId: string;
  duration: number;
  notes?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Timer Types
export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  elapsed: number; // in seconds
  total: number; // in seconds
  startTime?: Date;
  pauseTime?: Date;
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  isActive?: boolean;
  children?: NavItem[];
}
