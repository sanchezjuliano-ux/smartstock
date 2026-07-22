import { adminDb, adminAuth } from './firebase-admin';

export interface SubscriptionStatus {
  active: boolean;
  planStatus: 'active' | 'trialling' | 'canceled' | 'none';
  stripeCustomerId?: string | null;
  subscriptionEndsAt?: string | null;
  reason?: string;
}

/**
 * Core back-end check to validate if a user's subscription is active or trialling.
 * Prevents access to inventory read/write operations if the subscription is invalid or expired.
 */
export async function validateUserSubscription(userId: string): Promise<SubscriptionStatus> {
  if (!userId) {
    return { active: false, planStatus: 'none', reason: 'User ID is missing' };
  }

  if (!adminDb) {
    // Graceful fallback for environments where Firebase Admin is not fully initialized
    console.warn('Firebase Admin is not fully initialized. Permitting operation in development fallback mode.');
    return { active: true, planStatus: 'active', reason: 'Admin DB not initialized, development fallback' };
  }

  try {
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      // In a commercial SaaS, we auto-create a user doc with 'trialling' status
      const defaultStatus: SubscriptionStatus = {
        active: true,
        planStatus: 'trialling',
        stripeCustomerId: null,
        subscriptionEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
      };

      await userDocRef.set({
        name: 'New Pantry SaaS User',
        email: '',
        role: 'user',
        planStatus: defaultStatus.planStatus,
        stripeCustomerId: defaultStatus.stripeCustomerId,
        subscriptionEndsAt: defaultStatus.subscriptionEndsAt,
        createdAt: new Date().toISOString()
      });

      return {
        ...defaultStatus,
        reason: 'New user created. 14-day free trial started.'
      };
    }

    const userData = userDoc.data();
    if (!userData) {
      return { active: false, planStatus: 'none', reason: 'User data is empty' };
    }

    const planStatus = userData.planStatus || 'none';
    const subscriptionEndsAtStr = userData.subscriptionEndsAt;
    const stripeCustomerId = userData.stripeCustomerId || null;

    // A plan is active if it is 'active' or 'trialling'
    let active = planStatus === 'active' || planStatus === 'trialling';

    // If subscription has an end date, verify it hasn't expired
    if (active && subscriptionEndsAtStr) {
      const endsAt = new Date(subscriptionEndsAtStr);
      if (isNaN(endsAt.getTime())) {
        console.warn(`Invalid subscriptionEndsAt date string: ${subscriptionEndsAtStr}`);
      } else if (endsAt < new Date()) {
        active = false;
        return {
          active: false,
          planStatus: 'canceled',
          stripeCustomerId,
          subscriptionEndsAt: subscriptionEndsAtStr,
          reason: 'Subscription has expired.'
        };
      }
    }

    return {
      active,
      planStatus,
      stripeCustomerId,
      subscriptionEndsAt: subscriptionEndsAtStr,
      reason: active ? 'Subscription is valid and active.' : 'Subscription is inactive or canceled.'
    };
  } catch (error: any) {
    console.error('Error validating user subscription:', error);
    return {
      active: false,
      planStatus: 'none',
      reason: `Internal verification error: ${error.message}`
    };
  }
}

/**
 * Back-end route middleware handler.
 * Wraps a standard NextRequest handler with subscription authorization.
 */
import { NextRequest, NextResponse } from 'next/server';

export function withSubscriptionCheck(
  handler: (req: NextRequest, context: any, subscription: SubscriptionStatus) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    // In a real application, the userId is retrieved from the verified auth token.
    // For local testing, preview, and complete full-stack integration, we'll extract it
    // from custom headers or standard Firebase JWT request authorization.
    const authHeader = req.headers.get('Authorization');
    let userId = '';

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (adminAuth) {
        try {
          const decodedToken = await adminAuth.verifyIdToken(token);
          userId = decodedToken.uid;
        } catch (e) {
          return NextResponse.json({ error: 'Unauthorized: Invalid Firebase ID Token' }, { status: 401 });
        }
      } else {
        // Fallback for development if token verification is simulated
        userId = token;
      }
    } else {
      // Allow fallback to custom header or query param for ease of use/integration in testing
      userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const subscription = await validateUserSubscription(userId);

    if (!subscription.active) {
      return NextResponse.json({
        error: 'Payment Required: Active SaaS subscription is required to read/write pantry inventory',
        subscription
      }, { status: 402 });
    }

    return handler(req, context, subscription);
  };
}
