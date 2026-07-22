'use client';

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

let lastLocalTimestamp = 0;
let isUpdatingFromRemote = false;

export async function saveSharedData(partialData: Partial<SharedData>) {
  if (typeof window === 'undefined') return;
  if (isUpdatingFromRemote) return;

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

  lastLocalTimestamp = Date.now();

  // Notify local tabs/window
  window.dispatchEvent(new Event('pantry_data_updated'));

  // Sync ONLY partialData to central cloud server API endpoint
  try {
    await fetch('/api/pantry/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partialData),
    });
  } catch (err) {
    console.warn('[Sync] Server sync warning:', err);
  }
}

export function subscribeSharedData(callback: (data: SharedData) => void) {
  if (typeof window === 'undefined') return () => {};

  const handleLocalUpdate = () => {
    callback(getInitialSharedData());
  };

  window.addEventListener('storage', handleLocalUpdate);
  window.addEventListener('pantry_data_updated', handleLocalUpdate);

  // Poll server every 1.5 seconds for multi-device instant sync
  let lastServerUpdatedStr = '';

  const checkRemoteSync = async () => {
    try {
      const res = await fetch('/api/pantry/sync', { cache: 'no-store' });
      if (!res.ok) return;

      const serverData = await res.json();
      if (!serverData || !serverData.lastUpdated) return;

      if (serverData.lastUpdated !== lastServerUpdatedStr) {
        lastServerUpdatedStr = serverData.lastUpdated;

        // Ignore if local changes were made in the last 800ms
        if (Date.now() - lastLocalTimestamp < 800) return;

        isUpdatingFromRemote = true;
        try {
          if (Array.isArray(serverData.profiles)) {
            localStorage.setItem('virtual_pantry_profiles', JSON.stringify(serverData.profiles));
          }
          if (Array.isArray(serverData.inventory)) {
            localStorage.setItem('virtual_pantry_inventory', JSON.stringify(serverData.inventory));
          }
          if (Array.isArray(serverData.history)) {
            localStorage.setItem('virtual_pantry_history', JSON.stringify(serverData.history));
          }
          if (Array.isArray(serverData.categories)) {
            localStorage.setItem('virtual_pantry_categories', JSON.stringify(serverData.categories));
          }
          callback(getInitialSharedData());
        } finally {
          setTimeout(() => {
            isUpdatingFromRemote = false;
          }, 150);
        }
      }
    } catch (e) {
      // Ignore network hiccup
    }
  };

  // Immediate initial check
  checkRemoteSync();

  // Poll every 1.5s
  const intervalId = setInterval(checkRemoteSync, 1500);

  return () => {
    window.removeEventListener('storage', handleLocalUpdate);
    window.removeEventListener('pantry_data_updated', handleLocalUpdate);
    clearInterval(intervalId);
  };
}
