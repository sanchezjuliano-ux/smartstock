'use client';

import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const PANTRY_DOC_ID = 'shared_pantry_data';

export interface SharedData {
  profiles: any[];
  inventory: any[];
  history: any[];
  categories: string[];
}

export function getInitialSharedData(): SharedData {
  if (typeof window === 'undefined') {
    return { profiles: [], inventory: [], history: [], categories: [] };
  }

  const getStored = (key: string, fallback: any) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  return {
    profiles: getStored('virtual_pantry_profiles', []),
    inventory: getStored('virtual_pantry_inventory', []),
    history: getStored('virtual_pantry_history', []),
    categories: getStored('virtual_pantry_categories', []),
  };
}

export function saveSharedData(partialData: Partial<SharedData>) {
  if (typeof window === 'undefined') return;

  if (partialData.profiles !== undefined) {
    localStorage.setItem('virtual_pantry_profiles', JSON.stringify(partialData.profiles));
  }
  if (partialData.inventory !== undefined) {
    localStorage.setItem('virtual_pantry_inventory', JSON.stringify(partialData.inventory));
  }
  if (partialData.history !== undefined) {
    localStorage.setItem('virtual_pantry_history', JSON.stringify(partialData.history));
  }
  if (partialData.categories !== undefined) {
    localStorage.setItem('virtual_pantry_categories', JSON.stringify(partialData.categories));
  }

  // Notify other tabs and components in same window
  window.dispatchEvent(new Event('pantry_data_updated'));

  // Sync to Firebase Firestore asynchronously
  try {
    const currentAll = getInitialSharedData();
    const docRef = doc(db, 'pantry', PANTRY_DOC_ID);
    setDoc(docRef, {
      ...currentAll,
      lastUpdated: new Date().toISOString(),
    }, { merge: true }).catch((err) => {
      console.warn('Firestore sync warning:', err.message);
    });
  } catch (err) {
    console.warn('Firestore save skipped:', err);
  }
}

export function subscribeSharedData(callback: (data: SharedData) => void) {
  if (typeof window === 'undefined') return () => {};

  const handleLocalUpdate = () => {
    callback(getInitialSharedData());
  };

  window.addEventListener('storage', handleLocalUpdate);
  window.addEventListener('pantry_data_updated', handleLocalUpdate);

  // Subscribe to real-time Firebase Firestore updates
  let unsubscribeFirestore = () => {};
  try {
    const docRef = doc(db, 'pantry', PANTRY_DOC_ID);
    unsubscribeFirestore = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data) {
          if (data.profiles && Array.isArray(data.profiles)) {
            localStorage.setItem('virtual_pantry_profiles', JSON.stringify(data.profiles));
          }
          if (data.inventory && Array.isArray(data.inventory)) {
            localStorage.setItem('virtual_pantry_inventory', JSON.stringify(data.inventory));
          }
          if (data.history && Array.isArray(data.history)) {
            localStorage.setItem('virtual_pantry_history', JSON.stringify(data.history));
          }
          if (data.categories && Array.isArray(data.categories)) {
            localStorage.setItem('virtual_pantry_categories', JSON.stringify(data.categories));
          }
          callback(getInitialSharedData());
        }
      }
    }, (error) => {
      console.warn('Firestore subscription notice:', error.message);
    });
  } catch (e) {
    console.warn('Firestore subscription init skipped:', e);
  }

  return () => {
    window.removeEventListener('storage', handleLocalUpdate);
    window.removeEventListener('pantry_data_updated', handleLocalUpdate);
    unsubscribeFirestore();
  };
}
