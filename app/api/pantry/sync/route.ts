import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface SharedPantryData {
  profiles: any[];
  inventory: any[];
  history: any[];
  categories: string[];
  lastUpdated: string;
}

const DEFAULT_PROFILES = [
  { name: 'Administrador', role: 'admin', image: 'https://picsum.photos/seed/admin/200/200', password: '123' },
  { name: 'Maria', role: 'admin', image: 'https://picsum.photos/seed/maria/200/200', password: '123' },
  { name: 'João', role: 'admin', image: 'https://picsum.photos/seed/joao/200/200', password: '123' },
];

let inMemoryPantryData: SharedPantryData = {
  profiles: DEFAULT_PROFILES,
  inventory: [],
  history: [],
  categories: [],
  lastUpdated: new Date().toISOString(),
};

const FILE_PATH = path.join(process.cwd(), 'shared_pantry_cloud.json');

function loadFromFile(): SharedPantryData {
  try {
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          profiles: Array.isArray(parsed.profiles) && parsed.profiles.length > 0 ? parsed.profiles : DEFAULT_PROFILES,
          inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
          history: Array.isArray(parsed.history) ? parsed.history : [],
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
      }
    }
  } catch (e) {
    console.warn('[Pantry API] Error reading shared_pantry_cloud.json:', e);
  }
  return inMemoryPantryData;
}

function saveToFile(data: SharedPantryData) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Pantry API] Error writing shared_pantry_cloud.json:', e);
  }
}

// Initial load on server start
inMemoryPantryData = loadFromFile();

export async function GET(req: NextRequest) {
  const current = loadFromFile();
  return NextResponse.json(current, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = loadFromFile();

    const updatedData: SharedPantryData = {
      profiles: body.profiles !== undefined && Array.isArray(body.profiles) ? body.profiles : current.profiles,
      inventory: body.inventory !== undefined && Array.isArray(body.inventory) ? body.inventory : current.inventory,
      history: body.history !== undefined && Array.isArray(body.history) ? body.history : current.history,
      categories: body.categories !== undefined && Array.isArray(body.categories) ? body.categories : current.categories,
      lastUpdated: new Date().toISOString(),
    };

    inMemoryPantryData = updatedData;
    saveToFile(updatedData);

    return NextResponse.json({
      success: true,
      lastUpdated: updatedData.lastUpdated,
      data: updatedData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update shared pantry data' }, { status: 500 });
  }
}
