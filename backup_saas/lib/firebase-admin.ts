import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../firebase-applet-config.json';

if (getApps().length === 0) {
  try {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } catch (error) {
    console.warn('Firebase Admin basic init warning. Retrying with default application parameters:', error);
    try {
      initializeApp();
    } catch (err) {
      console.error('Firebase Admin critical initialization failure:', err);
    }
  }
}

// Safely export services
const adminDb = getApps().length > 0 ? getFirestore() : null;
const adminAuth = getApps().length > 0 ? getAuth() : null;

export { adminDb, adminAuth };
export { getApps };
