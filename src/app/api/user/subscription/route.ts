import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email?: string;
}

// Verify JWT token and extract user info
async function verifyToken(request: NextRequest): Promise<JWTPayload> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Token tapılmadı');
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (!decoded.userId) {
      throw new Error('Invalid token payload');
    }

    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Keçersiz token');
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const { userId } = await verifyToken(request);

    // Get user's current subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!subscription) {
      return NextResponse.json({
        success: true,
        subscription: null,
        message: 'Aktiv abunəlik tapılmadı'
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        provider: subscription.provider,
        startedAt: subscription.startedAt,
        expiresAt: subscription.expiresAt,
        createdAt: subscription.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Get subscription error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Server xətası'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
