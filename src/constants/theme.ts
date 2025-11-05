/**
 * ═══════════════════════════════════════════════════════════════
 * CENTRALIZED THEME CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 * 
 * 🎨 THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL APP COLORS
 * 
 * To change the entire app's color scheme:
 * 1. Update the colors below in this file
 * 2. Sync the values to src/app/globals.css CSS variables
 * 3. See THEME_GUIDE.md for detailed instructions
 * 
 * ⚠️ IMPORTANT: After updating colors here, you must also update
 *    the corresponding CSS variables in src/app/globals.css
 * 
 * Example: To change primary color to blue:
 *   - Change primary.500 from '#6b9e7a' to '#3b82f6'
 *   - Update --color-primary-500 in globals.css
 * ═══════════════════════════════════════════════════════════════
 */

export const THEME = {
  // Primary Colors
  primary: {
    50: '#f0f7f4',
    100: '#d9ede5',
    200: '#b3dbc9',
    300: '#8dc9ac',
    400: '#6b9e7a', // Main primary
    500: '#6b9e7a',
    600: '#5a8a68',
    700: '#497656',
    800: '#386244',
    900: '#274e32',
  },
  
  // Secondary Colors
  secondary: {
    50: '#faf7f5',
    100: '#f5efeb',
    200: '#ebdfd7',
    300: '#e1cfc3',
    400: '#d7bfaf',
    500: '#a68b7a', // Main secondary
    600: '#8a7364',
    700: '#6e5b4e',
    800: '#524338',
    900: '#362b22',
  },
  
  // Background Colors
  background: {
    light: '#ffffff',
    dark: '#f8f9fa',
    card: '#ffffff',
    sidebar: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Text Colors
  text: {
    primary: '#171717',
    secondary: '#64748b',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
    muted: '#64748b',
  },
  
  // Border Colors
  border: {
    light: '#e2e8f0',
    medium: '#cbd5e1',
    dark: '#94a3b8',
  },
  
  // Accent Colors (for status, icons, etc.)
  accent: {
    blue: {
      light: '#dbeafe',
      medium: '#3b82f6',
      dark: '#1e40af',
    },
    green: {
      light: '#d1fae5',
      medium: '#10b981',
      dark: '#047857',
    },
    purple: {
      light: '#e9d5ff',
      medium: '#8b5cf6',
      dark: '#6d28d9',
    },
    yellow: {
      light: '#fef3c7',
      medium: '#f59e0b',
      dark: '#d97706',
    },
    red: {
      light: '#fee2e2',
      medium: '#ef4444',
      dark: '#dc2626',
    },
    orange: {
      light: '#fed7aa',
      medium: '#f97316',
      dark: '#ea580c',
    },
  },
  
  // Status Colors
  status: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  
  // Gray Scale
  gray: {
    50: '#f8f9fa',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
} as const;

/**
 * Helper function to get CSS variable value
 */
export const getThemeColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = THEME;
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) return '';
  }
  
  return typeof value === 'string' ? value : '';
};

/**
 * Export theme colors as CSS variable format
 */
export const themeToCSSVars = () => {
  const vars: Record<string, string> = {};
  
  // Primary
  Object.entries(THEME.primary).forEach(([key, value]) => {
    vars[`--color-primary-${key}`] = value;
  });
  
  // Secondary
  Object.entries(THEME.secondary).forEach(([key, value]) => {
    vars[`--color-secondary-${key}`] = value;
  });
  
  // Background
  Object.entries(THEME.background).forEach(([key, value]) => {
    vars[`--color-background-${key}`] = value;
  });
  
  // Text
  Object.entries(THEME.text).forEach(([key, value]) => {
    vars[`--color-text-${key}`] = value;
  });
  
  // Border
  Object.entries(THEME.border).forEach(([key, value]) => {
    vars[`--color-border-${key}`] = value;
  });
  
  // Gray
  Object.entries(THEME.gray).forEach(([key, value]) => {
    vars[`--color-gray-${key}`] = value;
  });
  
  return vars;
};

