import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * GET handler to read user's subscription status.
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || '';
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST handler to update or mock user's subscription status.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, stripeCustomerId, planStatus, subscriptionEndsAt } = body;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  try {
    await adminDb.collection('users').doc(userId).set({
      stripeCustomerId: stripeCustomerId || null,
      planStatus: planStatus || 'trialling',
      subscriptionEndsAt: subscriptionEndsAt || null,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ 
      message: 'Subscription updated successfully', 
      subscription: { stripeCustomerId, planStatus, subscriptionEndsAt }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
