import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { FIREBASE_CONFIG } from '@/constants';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Note: Emulators are disabled for production Firebase project
// To use emulators, set NODE_ENV=development and uncomment the code below
/*
if (process.env.NODE_ENV === 'development') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
  } catch {
    console.log('Auth emulator already connected or not available');
  }
  
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch {
    console.log('Firestore emulator already connected or not available');
  }
  
  try {
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch {
    console.log('Storage emulator already connected or not available');
  }
  
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch {
    console.log('Functions emulator already connected or not available');
  }
}
*/

export default app;
