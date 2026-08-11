'use client';

import { supabase } from './supabase';

export interface SharedData {
  profiles: any[];
  inventory: any[];
  history: any[];
  categories: string[];
  subcategories: string[];
}

export function deduplicateInventory(items: any[]): any[] {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const result: any[] = [];

  for (const item of items) {
    if (!item) continue;
    const idKey = item.id !== undefined && item.id !== null ? String(item.id) : null;
    const nameKey = `${(item.name || '').trim().toLowerCase()}_${(item.brand || '').trim().toLowerCase()}_${(item.category || '').trim().toLowerCase()}`;

    if (idKey && seenIds.has(idKey)) continue;
    if (seenNames.has(nameKey)) continue;

    if (idKey) seenIds.add(idKey);
    seenNames.add(nameKey);
    result.push(item);
  }
  return result;
}

export function deduplicateCategories(cats: any[]): string[] {
  if (!Array.isArray(cats)) return ['Despensa', 'Limpeza', 'Higiene'];
  const distinct: string[] = [];
  const seen = new Set<string>();
  for (const cat of cats) {
    if (!cat) continue;
    const trimmed = String(cat).trim();
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      distinct.push(trimmed);
    }
  }
  return distinct.length > 0 ? distinct : ['Despensa', 'Limpeza', 'Higiene'];
}

export function deduplicateSubcategories(subs: any[]): string[] {
  if (!Array.isArray(subs)) return [];
  const distinct: string[] = [];
  const seen = new Set<string>();
  for (const sub of subs) {
    if (!sub) continue;
    const trimmed = String(sub).trim();
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      distinct.push(trimmed);
    }
  }
  return distinct;
}

export function getInitialSharedData(): SharedData {
  if (typeof window === 'undefined') {
    return { profiles: [], inventory: [], history: [], categories: [], subcategories: [] };
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
    inventory: deduplicateInventory(getStored('virtual_pantry_inventory', [])),
    history: getStored('virtual_pantry_history', []),
    categories: deduplicateCategories(getStored('virtual_pantry_categories', ['Despensa', 'Limpeza', 'Higiene'])),
    subcategories: deduplicateSubcategories(getStored('virtual_pantry_subcategories', [])),
  };
}

let lastLocalTimestamp = 0;
let isUpdatingFromRemote = false;
let globalLastServerUpdatedStr = '';

function applyDataToLocalStorage(data: Partial<SharedData>): boolean {
  let hasDiff = false;
  try {
    if (Array.isArray(data.profiles)) {
      const str = JSON.stringify(data.profiles);
      if (localStorage.getItem('virtual_pantry_profiles') !== str) {
        localStorage.setItem('virtual_pantry_profiles', str);
        hasDiff = true;
      }
    }
    if (Array.isArray(data.inventory)) {
      const cleanInv = deduplicateInventory(data.inventory);
      const str = JSON.stringify(cleanInv);
      if (localStorage.getItem('virtual_pantry_inventory') !== str) {
        localStorage.setItem('virtual_pantry_inventory', str);
        hasDiff = true;
      }
    }
    if (Array.isArray(data.history)) {
      const str = JSON.stringify(data.history);
      if (localStorage.getItem('virtual_pantry_history') !== str) {
        localStorage.setItem('virtual_pantry_history', str);
        hasDiff = true;
      }
    }
    if (Array.isArray(data.categories)) {
      const cleanCats = deduplicateCategories(data.categories);
      const str = JSON.stringify(cleanCats);
      if (localStorage.getItem('virtual_pantry_categories') !== str) {
        localStorage.setItem('virtual_pantry_categories', str);
        hasDiff = true;
      }
    }
    if (Array.isArray(data.subcategories)) {
      const cleanSubs = deduplicateSubcategories(data.subcategories);
      const str = JSON.stringify(cleanSubs);
      if (localStorage.getItem('virtual_pantry_subcategories') !== str) {
        localStorage.setItem('virtual_pantry_subcategories', str);
        hasDiff = true;
      }
    }
  } catch (err) {
    console.warn('[Sync] Local storage write warning:', err);
  }
  return hasDiff;
}

export async function saveSharedData(partialData: Partial<SharedData>) {
  if (typeof window === 'undefined') return;
  if (isUpdatingFromRemote) return;

  const sanitizedData: Partial<SharedData> = {
    ...partialData,
    inventory: partialData.inventory ? deduplicateInventory(partialData.inventory) : undefined,
    categories: partialData.categories ? deduplicateCategories(partialData.categories) : undefined,
    subcategories: partialData.subcategories ? deduplicateSubcategories(partialData.subcategories) : undefined,
  };

  applyDataToLocalStorage(sanitizedData);
  lastLocalTimestamp = Date.now();

  // Notify local tabs/window immediately
  window.dispatchEvent(new Event('pantry_data_updated'));

  // Sync to central cloud server endpoint
  try {
    const res = await fetch('/api/pantry/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedData),
    });
    if (res.ok) {
      const result = await res.json();
      if (result?.lastUpdated) {
        globalLastServerUpdatedStr = result.lastUpdated;
      }
    }
  } catch (err) {
    console.warn('[Sync] Server sync warning:', err);
  }

  // Direct client-side Supabase write
  try {
    const current = getInitialSharedData();
    const merged = { ...current, ...sanitizedData };
    const nowIso = new Date().toISOString();
    await supabase.from('shared_pantry').upsert({
      id: 'main',
      data: merged,
      updated_at: nowIso,
    });
  } catch (err) {
    // Fail silently since API route handles fallback
  }
}

export function subscribeSharedData(callback: (data: SharedData) => void) {
  if (typeof window === 'undefined') return () => {};

  const handleLocalUpdate = () => {
    callback(getInitialSharedData());
  };

  window.addEventListener('storage', handleLocalUpdate);
  window.addEventListener('pantry_data_updated', handleLocalUpdate);

  const checkRemoteSync = async () => {
    try {
      const res = await fetch('/api/pantry/sync', { cache: 'no-store' });
      if (!res.ok) return;

      const serverData = await res.json();
      if (!serverData) return;

      const remoteUpdated = serverData.lastUpdated || '';
      if (remoteUpdated !== globalLastServerUpdatedStr) {
        globalLastServerUpdatedStr = remoteUpdated;

        // Ignore if local changes were made very recently (< 1000ms)
        if (Date.now() - lastLocalTimestamp < 1000) return;

        isUpdatingFromRemote = true;
        try {
          const hasDiff = applyDataToLocalStorage(serverData);
          if (hasDiff) {
            callback(getInitialSharedData());
          }
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

  // 1. Immediate initial check from server
  checkRemoteSync();

  // 2. Setup Supabase Realtime channel for instant push updates (< 200ms)
  let channel: any = null;
  try {
    channel = supabase
      .channel('shared_pantry_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_pantry' },
        (payload: any) => {
          if (Date.now() - lastLocalTimestamp < 1000) return;
          const newData = payload.new?.data;
          if (newData && typeof newData === 'object') {
            isUpdatingFromRemote = true;
            try {
              const hasDiff = applyDataToLocalStorage(newData);
              if (hasDiff) {
                callback(getInitialSharedData());
              }
            } finally {
              setTimeout(() => {
                isUpdatingFromRemote = false;
              }, 150);
            }
          }
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('[Sync] Supabase realtime subscription warning:', err);
  }

  // 3. Fallback polling every 1.5 seconds
  const intervalId = setInterval(checkRemoteSync, 1500);

  return () => {
    window.removeEventListener('storage', handleLocalUpdate);
    window.removeEventListener('pantry_data_updated', handleLocalUpdate);
    clearInterval(intervalId);
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}
