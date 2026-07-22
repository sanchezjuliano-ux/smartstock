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

let isReceivingRemoteUpdate = false;

export async function saveSharedData(partialData: Partial<SharedData>) {
  if (typeof window === 'undefined') return;
  if (isReceivingRemoteUpdate) return;

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

  // Notify local tabs/window
  window.dispatchEvent(new Event('pantry_data_updated'));

  // Sync to Cloud Firestore in real time
  try {
    const docRef = doc(db, 'pantry', PANTRY_DOC_ID);
    await setDoc(docRef, {
      profiles: updatedData.profiles,
      inventory: updatedData.inventory,
      history: updatedData.history,
      categories: updatedData.categories,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Firestore real-time save error:', err?.message || err);
  }
}

export function subscribeSharedData(callback: (data: SharedData) => void) {
  if (typeof window === 'undefined') return () => {};

  const handleLocalUpdate = () => {
    callback(getInitialSharedData());
  };

  window.addEventListener('storage', handleLocalUpdate);
  window.addEventListener('pantry_data_updated', handleLocalUpdate);

  // Real-time Cloud Firestore listener for all devices
  let unsubscribeFirestore = () => {};
  try {
    const docRef = doc(db, 'pantry', PANTRY_DOC_ID);
    unsubscribeFirestore = onSnapshot(docRef, (snapshot) => {
      // Ignore local pending writes to avoid writer loop
      if (snapshot.metadata.hasPendingWrites) return;

      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data) {
          isReceivingRemoteUpdate = true;
          try {
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
          } finally {
            setTimeout(() => {
              isReceivingRemoteUpdate = false;
            }, 100);
          }
        }
      } else {
        // Seed Firestore if document doesn't exist yet
        const local = getInitialSharedData();
        setDoc(docRef, {
          profiles: local.profiles,
          inventory: local.inventory,
          history: local.history,
          categories: local.categories,
          lastUpdated: new Date().toISOString(),
        }).catch(() => {});
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
