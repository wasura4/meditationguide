'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { AdminUser } from '@/types/admin';

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  isSuperAdmin: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);



export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // hydrate from cache to avoid long spinners
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('adminUser');
      if (cached && !adminUser) {
        try { setAdminUser(JSON.parse(cached)); setLoading(false); } catch {}
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          // Check if user is an admin
          const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
          
          if (adminDoc.exists()) {
            const adminData = adminDoc.data() as AdminUser;
            setAdminUser(adminData); if (typeof window!=="undefined") localStorage.setItem("adminUser", JSON.stringify(adminData));
          } else {
            // User is not an admin, sign them out
            await signOut(auth);
            setAdminUser(null); if (typeof window!=="undefined") localStorage.removeItem("adminUser");
          }
        } catch (err) {
          console.error('Error checking admin status:', err);
          setError('Failed to verify admin status');
        }
      } else {
        setAdminUser(null); if (typeof window!=="undefined") localStorage.removeItem("adminUser");
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if user is an admin
      const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
      
      if (!adminDoc.exists()) {
        await signOut(auth);
        throw new Error('Access denied. This account is not authorized for admin access.');
      }
      
      const adminData = adminDoc.data() as AdminUser;
      
      // Update last login
      await updateDoc(doc(db, 'admin_users', user.uid), {
        lastLogin: new Date(),
      });
      
      setAdminUser({ ...adminData, lastLogin: new Date() });
      
    } catch (err: unknown) {
      console.error('Admin login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setAdminUser(null); if (typeof window!=="undefined") localStorage.removeItem("adminUser");
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!adminUser) return false;
    
    const permission = adminUser.permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action as 'create' | 'read' | 'update' | 'delete') : false;
  };

  const isSuperAdmin = adminUser?.role === 'super_admin';

  const value: AdminAuthContextType = {
    adminUser,
    firebaseUser,
    loading,
    error,
    login,
    logout,
    hasPermission,
    isSuperAdmin,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
