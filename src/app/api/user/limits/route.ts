import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma, withRetry } from '@/lib/prisma';

// Simple JWT verification function
function verifyToken(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value ||
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Use retry logic for database queries
    const user = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          tier: true,
          _count: {
            select: { cvs: true }
          },
          subscriptions: {
            where: {
              status: 'active'
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1,
            select: {
              id: true,
              tier: true,
              status: true,
              provider: true,
              expiresAt: true,
              createdAt: true,
              startedAt: true
            }
          }
        }
      });
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Determine user tier
    let currentTier = user.tier || 'Free';
    if (user.subscriptions.length > 0) {
      currentTier = user.subscriptions[0].tier;
    }

    // Define limits based on tier
    const tierLimits = {
      Free: { cvCount: 2, dailyLimit: null, limitType: 'total', aiFeatures: false },
      Medium: { cvCount: null, dailyLimit: 5, limitType: 'daily', aiFeatures: true },
      Pro: { cvCount: null, dailyLimit: 5, limitType: 'daily', aiFeatures: true }, // Add Pro tier as alias for Medium
      Premium: { cvCount: null, dailyLimit: null, limitType: 'unlimited', aiFeatures: true },
    };

    const limits = tierLimits[currentTier as keyof typeof tierLimits] || tierLimits.Free;

    // Calculate usage and remaining limits
    let remainingLimit = 0;
    let hasReachedLimit = false;

    if (limits.limitType === 'total') {
      remainingLimit = Math.max(0, limits.cvCount! - user._count.cvs);
      hasReachedLimit = user._count.cvs >= limits.cvCount!;
    } else if (limits.limitType === 'daily') {
      // For daily limits, we need to check today's usage
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysUsage = await withRetry(async () => {
        return await prisma.cV.count({
          where: {
            userId: decoded.userId,
            createdAt: {
              gte: today
            }
          }
        });
      });

      remainingLimit = Math.max(0, limits.dailyLimit! - todaysUsage);
      hasReachedLimit = todaysUsage >= limits.dailyLimit!;
    } else {
      // Unlimited
      remainingLimit = 999;
      hasReachedLimit = false;
    }

    const response = {
      tier: currentTier,
      limits: {
        ...limits,
        templatesAccess: currentTier === 'Free' ? ['Basic'] :
                        (currentTier === 'Medium' || currentTier === 'Pro') ? ['Basic', 'Medium'] :
                        ['Basic', 'Medium', 'Premium']
      },
      usage: {
        cvCount: user._count.cvs,
        dailyUsage: limits.limitType === 'daily' ? (limits.dailyLimit! - remainingLimit) : 0,
        hasReachedLimit,
        remainingLimit
      },
      subscription: user.subscriptions[0] || null
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('User limits API error:', error);

    // Handle specific database connection errors
    if (error instanceof Error && error.message.includes('P1001')) {
      return NextResponse.json(
        {
          error: 'Verilənlər bazasına qoşulma problemi. Zəhmət olmasa bir az sonra yenidən cəhd edin.',
          code: 'DB_CONNECTION_ERROR'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
