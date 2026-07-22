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

export async function saveSharedData(partialData: Partial<SharedData>) {
  if (typeof window === 'undefined') return;

  const current = getInitialSharedData();
  const updatedData: SharedData = {
    profiles: partialData.profiles !== undefined ? partialData.profiles : current.profiles,
    inventory: partialData.inventory !== undefined ? partialData.inventory : current.inventory,
    history: partialData.history !== undefined ? partialData.history : current.history,
    categories: partialData.categories !== undefined ? partialData.categories : current.categories,
  };

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

  // Notify current browser window / other tabs
  window.dispatchEvent(new Event('pantry_data_updated'));

  // Sync to Cloud Firestore
  try {
    const docRef = doc(db, 'pantry', PANTRY_DOC_ID);
    await setDoc(docRef, {
      ...updatedData,
      lastUpdated: new Date().toISOString(),
    }, { merge: true });
  } catch (err: any) {
    console.warn('Firestore save warning:', err?.message || err);
  }
}

export function subscribeSharedData(callback: (data: SharedData) => void) {
  if (typeof window === 'undefined') return () => {};

  const handleLocalUpdate = () => {
    callback(getInitialSharedData());
  };

  window.addEventListener('storage', handleLocalUpdate);
  window.addEventListener('pantry_data_updated', handleLocalUpdate);

  // Subscribe to real-time Cloud Firestore updates
  let unsubscribeFirestore = () => {};
  try {
    const docRef = doc(db, 'pantry', PANTRY_DOC_ID);
    unsubscribeFirestore = onSnapshot(docRef, (snapshot) => {
      // Ignore local pending writes to prevent loop race condition
      if (snapshot.metadata.hasPendingWrites) return;

      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data) {
          let updated = false;
          if (data.profiles && Array.isArray(data.profiles) && data.profiles.length > 0) {
            localStorage.setItem('virtual_pantry_profiles', JSON.stringify(data.profiles));
            updated = true;
          }
          if (data.inventory && Array.isArray(data.inventory) && data.inventory.length > 0) {
            localStorage.setItem('virtual_pantry_inventory', JSON.stringify(data.inventory));
            updated = true;
          }
          if (data.history && Array.isArray(data.history) && data.history.length > 0) {
            localStorage.setItem('virtual_pantry_history', JSON.stringify(data.history));
            updated = true;
          }
          if (data.categories && Array.isArray(data.categories)) {
            localStorage.setItem('virtual_pantry_categories', JSON.stringify(data.categories));
            updated = true;
          }
          if (updated) {
            callback(getInitialSharedData());
          }
        }
      } else {
        // Seed Firestore if document doesn't exist yet
        const local = getInitialSharedData();
        if (local.profiles.length > 0) {
          setDoc(docRef, { ...local, lastUpdated: new Date().toISOString() }, { merge: true }).catch(() => {});
        }
      }
    }, (error) => {
      console.warn('Firestore subscription notice:', error.message);
    });
  } catch (e) {
    console.warn('Firestore subscription init error:', e);
  }

  return () => {
    window.removeEventListener('storage', handleLocalUpdate);
    window.removeEventListener('pantry_data_updated', handleLocalUpdate);
    unsubscribeFirestore();
  };
}
