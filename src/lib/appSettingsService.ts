import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export type AdminTheme = {
  // core tokens
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  // semantic surfaces
  headerBg?: string;
  brandGradFrom?: string;
  brandGradTo?: string;
};

export const DEFAULT_ADMIN_THEME: AdminTheme = {
  primary: '#6b9e7a',
  secondary: '#a68b7a',
  background: '#ffffff',
  foreground: '#171717',
  accent: '#f1f5f9',
  accentForeground: '#334155',
  muted: '#f8fafc',
  mutedForeground: '#64748b',
  border: '#e2e8f0',
  input: '#e2e8f0',
  ring: '#6b9e7a',
  headerBg: '#111827',
  brandGradFrom: '#8b5cf6',
  brandGradTo: '#3b82f6',
};

const THEME_DOC = doc(db, 'app_settings', 'theme');

export async function getAdminTheme(): Promise<AdminTheme> {
  try {
    const snap = await getDoc(THEME_DOC);
    if (snap.exists()) {
      const data = snap.data() as Partial<AdminTheme>;
      return { ...DEFAULT_ADMIN_THEME, ...data } as AdminTheme;
    }
  } catch (e) {
    // fall back to defaults
  }
  return { ...DEFAULT_ADMIN_THEME };
}

export async function setAdminTheme(theme: AdminTheme): Promise<void> {
  await setDoc(
    THEME_DOC,
    {
      ...theme,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
