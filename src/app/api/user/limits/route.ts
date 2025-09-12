import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma, withRetry } from '@/lib/prisma';
import { checkCVCreationLimit, getLimitMessage } from '@/lib/cvLimits';

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

    // Use the same CV limits logic as creation API
    const cvLimits = await checkCVCreationLimit(decoded.userId);
    
    // Get total CV count for additional info
    const totalCVs = await withRetry(async () => {
      return await prisma.cV.count({
        where: { userId: decoded.userId }
      });
    });

    // Get user subscription info
    const user = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          tier: true,
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

    // Map CV limits to dashboard format
    const response = {
      tier: cvLimits.tierName,
      limits: {
        cvCount: cvLimits.limit,
        templatesAccess: cvLimits.tierName === 'Pulsuz' ? ['Basic'] :
                        (cvLimits.tierName === 'Populyar' || cvLimits.tierName === 'Pro') ? ['Basic', 'Medium'] :
                        ['Basic', 'Medium', 'Premium'],
        dailyLimit: cvLimits.limit,
        aiFeatures: cvLimits.tierName !== 'Pulsuz',
        limitType: cvLimits.limit === null ? 'unlimited' : (cvLimits.resetTime ? 'daily' : 'total')
      },
      usage: {
        cvCount: totalCVs,
        // For Free tier, dailyUsage should be same as currentCount (total CVs)
        // For daily tiers, currentCount is already the daily usage
        dailyUsage: cvLimits.tierName === 'Pulsuz' ? totalCVs : cvLimits.currentCount,
        hasReachedLimit: cvLimits.limitReached,
        remainingLimit: cvLimits.limit ? (cvLimits.limit - cvLimits.currentCount) : 999
      },
      subscription: user.subscriptions[0] || null
    };

    console.log('🔍 User Limits API Response:', JSON.stringify(response, null, 2));
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
