import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { checkCVCreationLimit, getLimitMessage } from '@/lib/cvLimits';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Giriş tələb olunur' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Etibarsız token' },
        { status: 401 }
      );
    }

    // Check CV creation limits
    const limits = await checkCVCreationLimit(decoded.userId);

    return NextResponse.json({
      success: true,
      limits: {
        canCreate: limits.canCreate,
        limitReached: limits.limitReached,
        currentCount: limits.currentCount,
        limit: limits.limit,
        tierName: limits.tierName,
        resetTime: limits.resetTime,
        message: getLimitMessage(limits)
      }
    });

  } catch (error) {
    console.error('CV limits check error:', error);
    return NextResponse.json(
      { error: 'CV limit yoxlanılarkən xəta baş verdi' },
      { status: 500 }
    );
  }
}
