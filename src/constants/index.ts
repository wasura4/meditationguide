// Export theme configuration
export { THEME, getThemeColor } from './theme';

// App Configuration
export const APP_CONFIG = {
  name: 'Meditation Guide',
  version: '1.0.0',
  description: 'Theravada Buddhist Meditation Web App',
  author: 'Wasura Edirisuriya',
  website: 'https://meditationguide.com',
} as const;

// Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBVMyRrFlhOoywnV4dPWEexqTcquUBKSgY",
  authDomain: "nirvanaya-web.firebaseapp.com",
  projectId: "nirvanaya-web",
  storageBucket: "nirvanaya-web.firebasestorage.app",
  messagingSenderId: "902030886680",
  appId: "1:902030886680:web:418b907b8b4311e71dc06d",
  measurementId: "G-V2VSFJTQ09"
} as const;

// Default Meditation Types
export const DEFAULT_MEDITATION_TYPES = [
  // Theravada Buddhist Meditations
  {
    id: 'anapanasathi',
    name: 'Anapanasathi Meditation',
    description: 'Mindfulness of breathing - the foundation of Buddhist meditation practice',
    category: 'theravada' as const,
    defaultDuration: 20,
    order: 1,
    tags: ['breathing', 'mindfulness', 'foundation'],
  },
  {
    id: 'maithree',
    name: 'Maithree Meditation',
    description: 'Loving-kindness meditation to develop compassion and goodwill',
    category: 'theravada' as const,
    defaultDuration: 15,
    order: 2,
    tags: ['loving-kindness', 'compassion', 'metta'],
  },
  {
    id: 'buddhanussathi',
    name: 'Buddhanussathi Meditation',
    description: 'Recollection of the Buddha\'s qualities for inspiration and devotion',
    category: 'theravada' as const,
    defaultDuration: 15,
    order: 3,
    tags: ['recollection', 'devotion', 'inspiration'],
  },
  {
    id: 'asubha',
    name: 'Asubha Meditation',
    description: 'Contemplation of the unattractive nature of the body for detachment',
    category: 'theravada' as const,
    defaultDuration: 20,
    order: 4,
    tags: ['contemplation', 'detachment', 'body'],
  },
  {
    id: 'vipassana',
    name: 'Vipassana Meditation',
    description: 'Insight meditation to develop wisdom and understanding of reality',
    category: 'theravada' as const,
    defaultDuration: 30,
    order: 5,
    tags: ['insight', 'wisdom', 'reality'],
  },
  
  // Traditional Categories (for future expansion)
  {
    id: 'breathing',
    name: 'Breathing Meditation',
    description: 'Focus on your breath to cultivate mindfulness and concentration',
    category: 'traditional' as const,
    defaultDuration: 10,
    order: 6,
    tags: ['breathing', 'calm', 'focus'],
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness Meditation',
    description: 'Observe thoughts and sensations without judgment',
    category: 'traditional' as const,
    defaultDuration: 15,
    order: 7,
    tags: ['mindfulness', 'observation', 'non-judgment'],
  },
  {
    id: 'loving-kindness',
    name: 'Loving-Kindness Meditation',
    description: 'Cultivate compassion and loving-kindness towards yourself and others',
    category: 'traditional' as const,
    defaultDuration: 20,
    order: 8,
    tags: ['loving-kindness', 'compassion', 'love'],
  },
  {
    id: 'body-scan',
    name: 'Body Scan Meditation',
    description: 'Systematically scan your body to develop body awareness',
    category: 'traditional' as const,
    defaultDuration: 15,
    order: 9,
    tags: ['body', 'awareness', 'systematic'],
  },
  {
    id: 'walking',
    name: 'Walking Meditation',
    description: 'Practice mindfulness while walking slowly and deliberately',
    category: 'traditional' as const,
    defaultDuration: 30,
    order: 10,
    tags: ['walking', 'movement', 'mindfulness'],
  },
] as const;

// Navigation Items
export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'home',
  },
  {
    label: 'Meditate',
    href: '/meditate',
    icon: 'lotus',
  },
  {
    label: 'Logbook',
    href: '/logbook',
    icon: 'book-open',
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: 'bar-chart-3',
  },
  {
    label: 'Kamatahan',
    href: '/kamatahan',
    icon: 'music',
  },
  {
    label: 'Dhamma',
    href: '/dhamma',
    icon: 'lightbulb',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: 'settings',
  },
] as const;

// Meditation Categories
export const MEDITATION_CATEGORIES = [
  'theravada',
  'traditional',
  'modern',
  'specialized',
] as const;

// Meditation Category Details
export const MEDITATION_CATEGORY_DETAILS = [
  {
    id: 'theravada',
    name: 'Theravada Buddhist',
    description: 'Traditional Buddhist meditation practices',
    color: 'blue',
    icon: '🌿',
  },
  {
    id: 'traditional',
    name: 'Traditional',
    description: 'Classic meditation techniques',
    color: 'green',
    icon: '🧘‍♀️',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary meditation approaches',
    color: 'purple',
    icon: '✨',
  },
  {
    id: 'specialized',
    name: 'Specialized',
    description: 'Specific purpose meditations',
    color: 'orange',
    icon: '🎯',
  },
] as const;

// Audio Categories
export const AUDIO_CATEGORIES = [
  'meditation',
  'dhamma-talks',
  'chanting',
  'nature-sounds',
  'guided-meditation',
  'music',
] as const;

// Dhamma Categories
export const DHAMMA_CATEGORIES = [
  'four-noble-truths',
  'eightfold-path',
  'meditation-instructions',
  'buddhist-philosophy',
  'daily-practice',
  'sutta-study',
] as const;

// Timer Settings
export const TIMER_SETTINGS = {
  minDuration: 1, // 1 minute
  maxDuration: 120, // 2 hours
  defaultDuration: 15, // 15 minutes
  intervalBells: [5, 10, 15, 20, 30, 45, 60], // minutes
} as const;

// Theme Colors - Calming Meditation Design System
export const THEME_COLORS = {
  primary: {
    50: '#f0f7f4',   // Soft sage green
    100: '#d9ebe4',  // Light sage
    500: '#6b9e7a',  // Calming green
    600: '#5a8a68',  // Medium green
    700: '#4a7365',  // Deep sage
    900: '#2d4a3a',  // Forest green
  },
  secondary: {
    50: '#f5f3f0',   // Warm beige
    100: '#e8e0d8',  // Light beige
    500: '#a68b7a',  // Muted terracotta
    600: '#8b6f5f',  // Medium terracotta
    700: '#6d5549',  // Deep terracotta
    900: '#3d2f28',  // Dark earth
  },
  success: {
    50: '#f0f9f4',   // Mint green
    100: '#d4edda',  // Light mint
    500: '#7fb88c',  // Soft green
    600: '#6ba37a',  // Medium green
    700: '#568466',  // Deep green
    900: '#2d4a35',  // Forest
  },
  warning: {
    50: '#fff8f0',   // Soft cream
    100: '#ffeccf',  // Light peach
    500: '#d4a574',  // Warm sand
    600: '#b88d5f',  // Medium sand
    700: '#94704d',  // Deep sand
    900: '#5c4532',  // Dark sand
  },
  error: {
    50: '#fef5f5',   // Soft rose
    100: '#fde2e2',  // Light rose
    500: '#d88a8a',  // Muted rose
    600: '#c27373',  // Medium rose
    700: '#9d5c5c',  // Deep rose
    900: '#5d3636',  // Dark rose
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  theme: 'nirvanaya-theme',
  userPreferences: 'nirvanaya-user-preferences',
  meditationHistory: 'nirvanaya-meditation-history',
  audioQueue: 'nirvanaya-audio-queue',
  lastSession: 'nirvanaya-last-session',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
  },
  meditation: {
    sessions: '/api/meditation/sessions',
    types: '/api/meditation/types',
    stats: '/api/meditation/stats',
  },
  audio: {
    tracks: '/api/audio/tracks',
    playlists: '/api/audio/playlists',
    upload: '/api/audio/upload',
  },
  dhamma: {
    posts: '/api/dhamma/posts',
    categories: '/api/dhamma/categories',
  },
  user: {
    profile: '/api/user/profile',
    preferences: '/api/user/preferences',
    stats: '/api/user/stats',
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  auth: {
    invalidCredentials: 'Invalid email or password',
    userNotFound: 'User not found',
    emailInUse: 'Email already in use',
    weakPassword: 'Password is too weak',
    networkError: 'Network error. Please try again.',
  },
  meditation: {
    sessionNotFound: 'Meditation session not found',
    invalidDuration: 'Invalid meditation duration',
    sessionInProgress: 'You have a session in progress',
  },
  general: {
    somethingWentWrong: 'Something went wrong. Please try again.',
    unauthorized: 'You are not authorized to perform this action.',
    notFound: 'The requested resource was not found.',
  },
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  auth: {
    loginSuccess: 'Successfully logged in',
    registerSuccess: 'Account created successfully',
    logoutSuccess: 'Successfully logged out',
  },
  meditation: {
    sessionStarted: 'Meditation session started',
    sessionCompleted: 'Meditation session completed',
    sessionSaved: 'Session notes saved',
  },
  general: {
    saved: 'Changes saved successfully',
    deleted: 'Item deleted successfully',
    updated: 'Updated successfully',
  },
} as const;
