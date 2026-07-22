import { NextRequest, NextResponse } from 'next/server';
import { withSubscriptionCheck } from '@/lib/subscription';
import { adminDb } from '@/lib/firebase-admin';

/**
 * GET handler to retrieve inventory items.
 * Protected by subscription middleware.
 */
export const GET = withSubscriptionCheck(async (req: NextRequest, _context: any, subscription) => {
  const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  try {
    const itemsSnapshot = await adminDb.collection('items')
      .where('userId', '==', userId)
      .get();

    const items = itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ items, subscription });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

/**
 * POST handler to create/add an inventory item.
 * Protected by subscription middleware.
 */
export const POST = withSubscriptionCheck(async (req: NextRequest, _context: any, subscription) => {
  const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
  const body = await req.json();

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  try {
    const newItem = {
      ...body,
      userId,
      createdAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('items').add(newItem);

    return NextResponse.json({ 
      id: docRef.id, 
      item: newItem,
      message: 'Item created successfully in Firestore',
      subscription 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
