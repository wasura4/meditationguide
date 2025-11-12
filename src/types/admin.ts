export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'content_admin' | 'moderator';
  permissions: AdminPermission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminPermission {
  resource: 'audio' | 'dhamma' | 'users' | 'analytics' | 'settings' | 'content';
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface KamatahanAudio {
  id: string;
  title: string;
  description: string;
  category: 'meditation' | 'dhamma_talk' | 'chanting' | 'guided_meditation' | 'background';
  duration: number; // in seconds
  durationFormatted?: string; // MM:SS format
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  language: 'en' | 'si' | 'pa';
  isPublic: boolean;
  status: 'active' | 'inactive' | 'draft';
  uploadedBy: string; // admin ID
  createdAt: Date;
  updatedAt: Date;
  // Optional analytics field (not directly written by users)
  listenCount?: number;
}

export interface DhammaPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string; // URL to the featured image
  category: 'meditation' | 'buddhism' | 'philosophy' | 'practice' | 'teachings';
  tags: string[];
  language: 'en' | 'si' | 'pa';
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  authorId: string; // admin ID
  authorName: string;
  readTime: number; // estimated reading time in minutes
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
}

export interface DhammaPostFormData {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  category: 'meditation' | 'buddhism' | 'philosophy' | 'practice' | 'teachings';
  tags: string[];
  language: 'en' | 'si' | 'pa';
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalAudioFiles: number;
  totalDhammaPosts: number;
  activeUsersToday: number;
  newUsersThisWeek: number;
  totalMeditationMinutes: number;
  totalAudioListens: number;
  totalAudioListeningMinutes: number;
  popularAudioFiles: KamatahanAudio[];
  popularDhammaPosts: DhammaPost[];
}

export interface ContentUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface MeditationCategory {
  id: string;
  name: string; // Sinhala name
  nameEn: string; // English name
  description: string;
  color: string; // Tailwind color name (e.g., 'violet', 'blue', 'amber')
  order: number; // Display order
  isActive: boolean;
  createdBy: string; // admin ID
  createdAt: Date;
  updatedAt: Date;
}

export interface MeditationCategoryFormData {
  name: string;
  nameEn: string;
  description: string;
  color: string;
  order?: number;
  isActive?: boolean;
}
