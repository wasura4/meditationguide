"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDocFromServer,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AdminUser } from "@/types/admin";
import { canAdminAccess, normalizeAdmin } from "@/lib/adminAccess";
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
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    try {
      localStorage.removeItem("adminUser");
    } catch {}
    let stopProfile: (() => void) | undefined;
    let verificationTimer: ReturnType<typeof setTimeout> | undefined;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopProfile?.();
      clearTimeout(verificationTimer);
      setFirebaseUser(user);
      setAdminUser(null);
      setError(null);
      setLoading(Boolean(user));
      if (!user) return;
      verificationTimer = setTimeout(() => {
        setAdminUser(null);
        setError(
          "Administrator access could not be verified. Check your connection and reload.",
        );
        setLoading(false);
      }, 15000);
      stopProfile = onSnapshot(
        doc(db, "admin_users", user.uid),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (auth.currentUser?.uid !== user.uid) return;
          // Cached roles may have been revoked. Only a server-confirmed profile grants access.
          if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites)
            return;
          clearTimeout(verificationTimer);
          const profile = snapshot.exists()
            ? normalizeAdmin(snapshot.id, snapshot.data())
            : null;
          setAdminUser(profile);
          setError(
            profile
              ? null
              : "This account does not have active administrator access.",
          );
          setLoading(false);
        },
        () => {
          if (auth.currentUser?.uid !== user.uid) return;
          clearTimeout(verificationTimer);
          setAdminUser(null);
          setError(
            "Administrator access could not be verified. Check your connection and reload.",
          );
          setLoading(false);
        },
      );
    });
    return () => {
      clearTimeout(verificationTimer);
      stopProfile?.();
      stopAuth();
    };
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const result = await signInWithEmailAndPassword(auth, email, password);
    const snapshot = await getDocFromServer(
      doc(db, "admin_users", result.user.uid),
    );
    const profile = snapshot.exists()
      ? normalizeAdmin(snapshot.id, snapshot.data())
      : null;
    if (!profile)
      throw new Error(
        "This account does not have active administrator access.",
      );
    await updateDoc(snapshot.ref, { lastLogin: serverTimestamp() });
  }, []);
  const logout = useCallback(async () => {
    await signOut(auth);
    setAdminUser(null);
  }, []);
  const hasPermission = useCallback(
    (resource: string, action: string) =>
      canAdminAccess(adminUser, resource, action),
    [adminUser],
  );
  const value = useMemo(
    () => ({
      adminUser,
      firebaseUser,
      loading,
      error,
      login,
      logout,
      hasPermission,
      isSuperAdmin: adminUser?.role === "super_admin",
    }),
    [adminUser, firebaseUser, loading, error, login, logout, hasPermission],
  );
  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("AdminAuthProvider is required");
  return context;
}
