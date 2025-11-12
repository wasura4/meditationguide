'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserPreferences } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAnonymously: () => Promise<void>;
  upgradeAnonymousAccount: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const defaultPreferences: UserPreferences = {
  theme: 'system',
  timeFormat: '12h',
  defaultMeditationType: 'breathing',
  language: 'en',
  notifications: {
    sessionEnd: true,
    dailyReminder: false,
    weeklyReport: true,
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Convert Firebase user to our User type
  const createUserFromFirebase = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
         if (userDoc.exists()) {
       const userData = userDoc.data();
       return {
         ...userData,
         id: firebaseUser.uid,
         email: firebaseUser.email || '',
         displayName: firebaseUser.displayName || userData.displayName || 'Anonymous User',
         photoURL: firebaseUser.photoURL || userData.photoURL || null,
         role: userData.role || 'user',
         createdAt: userData.createdAt?.toDate() || new Date(),
         updatedAt: userData.updatedAt?.toDate() || new Date(),
         lastLoginAt: new Date(),
         preferences: userData.preferences || defaultPreferences,
         isAnonymous: firebaseUser.isAnonymous,
       } as User;
    } else {
      // Create new user document
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Anonymous User',
        photoURL: firebaseUser.photoURL || null,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        preferences: defaultPreferences,
        isAnonymous: firebaseUser.isAnonymous,
      };

      // Filter out undefined values before saving to Firestore
      const userDataToSave = Object.fromEntries(
        Object.entries(newUser).filter(([, value]) => value !== undefined)
      );

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userDataToSave,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      });

      return newUser;
    }
  };

  // Update user preferences
  const updateUserPreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user) throw new Error('No user logged in');
    
    const updatedPreferences = { ...user.preferences, ...preferences };
    const updatedUser = { ...user, preferences: updatedPreferences };
    
    await updateDoc(doc(db, 'users', user.id), {
      preferences: updatedPreferences,
      updatedAt: new Date(),
    });
    
    setUser(updatedUser);
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    
    await updateDoc(doc(db, 'users', user.id), {
      ...updates,
      updatedAt: new Date(),
    });
    
    setUser(updatedUser);
  };

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userData = await createUserFromFirebase(result.user);
      setUser(userData);
      setFirebaseUser(result.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register new user
  const register = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, { displayName });
      
      const userData = await createUserFromFirebase(result.user);
      setUser(userData);
      setFirebaseUser(result.user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userData = await createUserFromFirebase(result.user);
      setUser(userData);
      setFirebaseUser(result.user);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  // Login anonymously
  const loginAnonymously = async () => {
    try {
      const result = await signInAnonymously(auth);
      const userData = await createUserFromFirebase(result.user);
      setUser(userData);
      setFirebaseUser(result.user);
    } catch (error) {
      console.error('Anonymous login error:', error);
      throw error;
    }
  };

  // Upgrade anonymous account
  const upgradeAnonymousAccount = async (email: string, password: string) => {
    if (!firebaseUser?.isAnonymous) {
      throw new Error('User is not anonymous');
    }

    try {
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(firebaseUser, credential);
      
      // Update profile with display name
      await updateProfile(result.user, { 
        displayName: user?.displayName || 'User'
      });
      
      const userData = await createUserFromFirebase(result.user);
      setUser(userData);
      setFirebaseUser(result.user);
    } catch (error) {
      console.error('Account upgrade error:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await createUserFromFirebase(firebaseUser);
          setUser(userData);
          setFirebaseUser(firebaseUser);
        } catch (error) {
          console.error('Error creating user from Firebase:', error);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Keep a lightweight auth cookie for server-side redirects (middleware)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!loading && user) {
      // 90 days
      document.cookie = `ni_auth=1; Path=/; Max-Age=7776000; SameSite=Lax`;
    } else if (!loading && !user) {
      document.cookie = `ni_auth=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  }, [loading, user]);

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    login,
    register,
    loginWithGoogle,
    loginAnonymously,
    upgradeAnonymousAccount,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserPreferences,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
