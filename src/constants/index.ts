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

// Theme Colors - Apple Style Design System
export const THEME_COLORS = {
  primary: {
    50: '#f2f2f7',   // System Gray 6
    100: '#e5e5ea',  // System Gray 5
    500: '#007aff',  // System Blue
    600: '#005bd3',  // System Blue (darker)
    700: '#004085',  // System Blue (darkest)
    900: '#1c1c1e',  // System Gray
  },
  secondary: {
    50: '#f2f2f7',   // System Gray 6
    100: '#e5e5ea',  // System Gray 5
    500: '#8e8e93',  // System Gray 3
    600: '#636366',  // System Gray 2
    700: '#48484a',  // System Gray
    900: '#1c1c1e',  // System Gray
  },
  success: {
    50: '#f2f2f7',   // System Gray 6
    100: '#e5e5ea',  // System Gray 5
    500: '#34c759',  // System Green
    600: '#28a745',  // System Green (darker)
    700: '#1e7e34',  // System Green (darkest)
    900: '#155724',  // System Green (dark)
  },
  warning: {
    50: '#f2f2f7',   // System Gray 6
    100: '#e5e5ea',  // System Gray 5
    500: '#ff9500',  // System Orange
    600: '#e8890b',  // System Orange (darker)
    700: '#b86400',  // System Orange (darkest)
    900: '#8b4513',  // System Orange (dark)
  },
  error: {
    50: '#f2f2f7',   // System Gray 6
    100: '#e5e5ea',  // System Gray 5
    500: '#ff3b30',  // System Red
    600: '#dc3545',  // System Red (darker)
    700: '#bd2130',  // System Red (darkest)
    900: '#721c24',  // System Red (dark)
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
