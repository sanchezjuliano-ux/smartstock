import { NextRequest, NextResponse } from 'next/server';
import { INVENTORY, HISTORY_ITEMS } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface SharedPantryData {
  profiles: any[];
  inventory: any[];
  history: any[];
  categories: string[];
  subcategories: string[];
  lastUpdated: string;
}

const DEFAULT_PROFILES = [
  { name: 'Administrador', role: 'admin', image: 'https://picsum.photos/seed/admin/200/200', password: '123' },
  { name: 'Maria', role: 'admin', image: 'https://picsum.photos/seed/maria/200/200', password: '123' },
  { name: 'João', role: 'admin', image: 'https://picsum.photos/seed/joao/200/200', password: '123' },
];

let inMemoryPantryData: SharedPantryData = {
  profiles: DEFAULT_PROFILES,
  inventory: INVENTORY,
  history: HISTORY_ITEMS,
  categories: ['Despensa', 'Limpeza', 'Higiene'],
  subcategories: [],
  lastUpdated: new Date().toISOString(),
};

function deduplicateList(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter(item => {
    if (!item) return false;
    if (typeof item === 'string') {
      const lower = item.trim().toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    }
    if (item.id !== undefined && item.id !== null) {
      const key = String(item.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }
    return true;
  });
}

// Fetch from Supabase with in-memory fallback
async function getCloudData(): Promise<SharedPantryData> {
  try {
    const { data, error } = await supabase
      .from('shared_pantry')
      .select('data, updated_at')
      .eq('id', 'main')
      .single();

    if (!error && data?.data) {
      const cloudData = data.data as SharedPantryData;
      const inv = deduplicateList(Array.isArray(cloudData.inventory) ? cloudData.inventory : inMemoryPantryData.inventory);
      const cats = deduplicateList([
        'Despensa', 'Limpeza', 'Higiene',
        ...(Array.isArray(cloudData.categories) ? cloudData.categories : inMemoryPantryData.categories),
        ...inv.map((i: any) => i.category).filter(Boolean)
      ]);
      const subs = deduplicateList([
        ...(Array.isArray(cloudData.subcategories) ? cloudData.subcategories : inMemoryPantryData.subcategories),
        ...inv.map((i: any) => i.subcategory).filter(Boolean)
      ]);

      const result: SharedPantryData = {
        profiles: deduplicateList(Array.isArray(cloudData.profiles) ? cloudData.profiles : inMemoryPantryData.profiles),
        inventory: inv,
        history: deduplicateList(Array.isArray(cloudData.history) ? cloudData.history : inMemoryPantryData.history),
        categories: cats,
        subcategories: subs,
        lastUpdated: data.updated_at || cloudData.lastUpdated || new Date().toISOString(),
      };
      inMemoryPantryData = result;
      return result;
    }
  } catch (err) {
    console.warn('[Pantry API] Supabase read notice:', err);
  }

  return inMemoryPantryData;
}

// Save to Supabase with in-memory fallback
async function saveCloudData(data: SharedPantryData): Promise<void> {
  inMemoryPantryData = data;

  try {
    const { error } = await supabase
      .from('shared_pantry')
      .upsert({
        id: 'main',
        data: data,
        updated_at: data.lastUpdated,
      });

    if (error) {
      console.warn('[Pantry API] Supabase upsert notice:', error.message);
    }
  } catch (err) {
    console.warn('[Pantry API] Supabase save notice:', err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const current = await getCloudData();
    return NextResponse.json(current, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    return NextResponse.json(inMemoryPantryData);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await getCloudData();

    const incomingInv = Array.isArray(body.inventory) ? body.inventory : current.inventory;
    const cleanInv = deduplicateList(incomingInv);
    const invCategories = cleanInv.map((i: any) => i.category).filter(Boolean);
    const invSubcategories = cleanInv.map((i: any) => i.subcategory).filter(Boolean);

    const mergedCategories = deduplicateList([
      'Despensa', 'Limpeza', 'Higiene',
      ...(Array.isArray(current.categories) ? current.categories : []),
      ...(Array.isArray(body.categories) ? body.categories : []),
      ...invCategories
    ]);

    const mergedSubcategories = deduplicateList([
      ...(Array.isArray(current.subcategories) ? current.subcategories : []),
      ...(Array.isArray(body.subcategories) ? body.subcategories : []),
      ...invSubcategories
    ]);

    const updatedData: SharedPantryData = {
      profiles: body.profiles !== undefined && Array.isArray(body.profiles) ? deduplicateList(body.profiles) : current.profiles,
      inventory: cleanInv,
      history: body.history !== undefined && Array.isArray(body.history) ? deduplicateList(body.history) : current.history,
      categories: mergedCategories,
      subcategories: mergedSubcategories,
      lastUpdated: new Date().toISOString(),
    };

    await saveCloudData(updatedData);

    return NextResponse.json({
      success: true,
      lastUpdated: updatedData.lastUpdated,
      data: updatedData,
    });
  } catch (err: any) {
    return NextResponse.json({ success: true, data: inMemoryPantryData });
  }
}
