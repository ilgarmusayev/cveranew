import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email?: string;
}

// Check and auto-cancel expired subscriptions
async function checkAndCancelExpiredSubscriptions(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: true } // Fixed: use 'subscriptions' not 'subscription'
    });

    if (!user || !user.subscriptions || user.subscriptions.length === 0) {
      return null;
    }

    // Get the most recent active subscription
    const activeSubscriptions = user.subscriptions.filter(sub => sub.status === 'active');
    if (activeSubscriptions.length === 0) {
      return null;
    }

    const latestSubscription = activeSubscriptions.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    const now = new Date();

    // Check if subscription has expired
    if (latestSubscription.expiresAt && latestSubscription.expiresAt < now) {
      console.log(`🔄 Auto-canceling expired subscription for user ${userId}`);
      
      // Update subscription status to expired AND update user tier to Free
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: latestSubscription.id },
          data: {
            status: 'expired',
            updatedAt: now
          }
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            tier: 'Free' // Update user's tier to Free when subscription expires
          }
        })
      ]);

      console.log(`✅ Subscription ${latestSubscription.id} auto-canceled and user tier updated to Free for user ${userId}`);

      return {
        ...latestSubscription,
        status: 'expired',
        tier: 'Free'
      };
    }    return latestSubscription;
  } catch (error) {
    console.error('❌ Error checking subscription expiration:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({
        error: 'Giriş tələb olunur'
      }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const userId = decoded.userId;

    console.log(`🔍 Getting user limits for: ${userId}`);

    // Check and auto-cancel expired subscriptions first
    const subscription = await checkAndCancelExpiredSubscriptions(userId);

    // Get user with subscription data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: true } // Fixed: use 'subscriptions' not 'subscription'
    });

    if (!user) {
      return NextResponse.json({
        error: 'İstifadəçi tapılmadı'
      }, { status: 404 });
    }

    // Determine current tier (after potential auto-cancellation)
    let currentTier = 'Free';
    let currentSubscription = user.subscriptions.length > 0 ? user.subscriptions[0] : null;

    if (currentSubscription) {
      // Check if subscription is expired or cancelled
      if (currentSubscription.status === 'expired' || currentSubscription.status === 'cancelled') {
        console.log(`📋 User ${userId} has ${currentSubscription.status} subscription, reverting to Free`);
        currentTier = 'Free';
        currentSubscription = null; // Don't send expired subscription data
      } else if (currentSubscription.status === 'active') {
        // Double-check if subscription is still valid by expiration date
        const now = new Date();
        if (!currentSubscription.expiresAt || currentSubscription.expiresAt > now) {
          currentTier = currentSubscription.tier;
          console.log(`✅ User ${userId} has active ${currentTier} subscription until ${currentSubscription.expiresAt}`);
        } else {
          // Subscription has expired but status not updated - fix it now
          console.log(`🔄 User ${userId} subscription expired but status still active, fixing...`);
          await prisma.subscription.update({
            where: { id: currentSubscription.id },
            data: {
              status: 'expired',
              updatedAt: new Date()
            }
          });
          currentTier = 'Free';
          currentSubscription = null;
        }
      } else {
        // Any other status (inactive, pending, etc.) - treat as Free
        console.log(`⚠️ User ${userId} has subscription with status: ${currentSubscription.status}, treating as Free`);
        currentTier = 'Free';
        currentSubscription = null;
      }
    } else {
      console.log(`📋 User ${userId} has no subscription, using Free tier`);
    }

    // Define limits based on tier
    const tierLimits = {
      Free: {
        cvCount: 2,
        templatesAccess: ['Basic'],
        dailyLimit: null,
        aiFeatures: false,
        limitType: 'total'
      },
      Medium: {
        cvCount: 10,
        templatesAccess: ['Basic', 'Professional'],
        dailyLimit: null,
        aiFeatures: true,
        limitType: 'daily'
      },
      Pro: {
        cvCount: 25,
        templatesAccess: ['Basic', 'Professional', 'Executive'],
        dailyLimit: null,
        aiFeatures: true,
        limitType: 'daily'
      },
      Populyar: {
        cvCount: 25,
        templatesAccess: ['Basic', 'Professional', 'Executive'],
        dailyLimit: null,
        aiFeatures: true,
        limitType: 'daily'
      },
      Premium: {
        cvCount: -1, // Unlimited
        templatesAccess: ['Basic', 'Professional', 'Executive', 'Premium'],
        dailyLimit: null,
        aiFeatures: true,
        limitType: 'unlimited'
      },
      Business: {
        cvCount: -1, // Unlimited
        templatesAccess: ['Basic', 'Professional', 'Executive', 'Premium'],
        dailyLimit: null,
        aiFeatures: true,
        limitType: 'unlimited'
      }
    };

    const limits = tierLimits[currentTier as keyof typeof tierLimits] || tierLimits.Free;

    // Get user's CV count for usage calculation
    const cvCount = await prisma.cV.count({
      where: { userId: userId }
    });

    // Calculate remaining limit
    let remainingLimit = 0;
    if (limits.limitType === 'total') {
      remainingLimit = Math.max(0, limits.cvCount - cvCount);
    } else if (limits.limitType === 'unlimited') {
      remainingLimit = -1; // Unlimited
    } else {
      remainingLimit = limits.cvCount; // Daily limit resets
    }

    const usage = {
      cvCount: cvCount,
      dailyUsage: 0, // You can implement daily tracking if needed
      hasReachedLimit: limits.limitType === 'total' && cvCount >= limits.cvCount,
      remainingLimit: remainingLimit
    };

    console.log(`📊 User ${userId} limits:`, {
      tier: currentTier,
      limits,
      usage,
      subscriptionStatus: currentSubscription?.status,
      expiresAt: currentSubscription?.expiresAt
    });

    return NextResponse.json({
      tier: currentTier,
      limits,
      usage,
      subscription: currentSubscription ? {
        id: currentSubscription.id,
        tier: currentSubscription.tier,
        status: currentSubscription.status,
        expiresAt: currentSubscription.expiresAt,
        createdAt: currentSubscription.createdAt
      } : null
    });

  } catch (error) {
    console.error('❌ User limits API error:', error);

    return NextResponse.json({
      error: 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
