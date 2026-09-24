import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { FIREBASE_CONFIG } from "@/constants";

// Explicit opt-in for disposable local UI verification. Production builds ignore this flag.
const localEmulators =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "true";
const existing = getApps().length > 0;
const app = existing
  ? getApp()
  : initializeApp(
      localEmulators
        ? {
            apiKey: "demo-key",
            authDomain: "localhost",
            projectId: "demo-learning-ui",
            storageBucket: "demo-learning-ui.appspot.com",
            appId: "demo-learning-ui",
          }
        : FIREBASE_CONFIG,
    );
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
if (localEmulators && !existing) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8185);
  // Unstarted optional emulators fail locally instead of touching hosted services.
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
export default app;
