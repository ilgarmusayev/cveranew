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

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const { userId } = await verifyToken(request);

    // Parse request body
    const body = await request.json();
    const { tier, paymentId } = body;

    // Validate required fields
    if (!tier || !paymentId) {
      return NextResponse.json(
        { success: false, error: 'Tier və payment ID lazımdır' },
        { status: 400 }
      );
    }

    // Validate tier types
    const validTiers = ['Free', 'Medium', 'Pro', 'Populyar', 'Premium', 'Business'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { success: false, error: 'Keçersiz abunəlik növü' },
        { status: 400 }
      );
    }

    // Calculate expiration date (1 month for premium tiers, far future for Free)
    let expiresAt;
    if (tier === 'Populyar' || tier === 'Premium' || tier === 'Medium' || tier === 'Pro' || tier === 'Business') {
      const now = new Date();
      expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      console.log(`🗓️ Setting expiration for ${tier} subscription: ${expiresAt.toISOString()}`);
    } else {
      // For Free tier, set expiration to year 2099 (effectively unlimited)
      expiresAt = new Date('2099-12-31T23:59:59.999Z');
      console.log(`🗓️ Setting far future expiration for ${tier} subscription: ${expiresAt.toISOString()}`);
    }

    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if user exists
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { subscriptions: true } // Fixed: use 'subscriptions' not 'subscription'
      });

      if (!user) {
        throw new Error('İstifadəçi tapılmadı');
      }

      // Cancel existing subscriptions if exist (user can have multiple subscriptions)
      if (user.subscriptions && user.subscriptions.length > 0) {
        await tx.subscription.deleteMany({
          where: { userId: userId }
        });
        console.log(`🗑️ Deleted existing subscriptions for user ${userId}`);
      }

      // Update user tier to match the subscription tier
      await tx.user.update({
        where: { id: userId },
        data: { tier: tier }
      });

      // Create new subscription
      const subscription = await tx.subscription.create({
        data: {
          userId: userId,
          tier: tier,
          status: 'active',
          provider: 'payment',
          providerRef: paymentId,
          expiresAt: expiresAt, // Now always has a value
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Created new ${tier} subscription for user ${userId}`);
      console.log(`📅 Subscription expires at: ${expiresAt ? expiresAt.toISOString() : 'Never (Free plan)'}`);

      return subscription;
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: result.id,
        tier: result.tier,
        status: result.status,
        expiresAt: result.expiresAt,
        createdAt: result.createdAt
      },
      message: `${tier} abunəliyi uğurla yaradıldı${expiresAt ? ` (${Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} gün müddətinə)` : ''}`
    });

  } catch (error) {
    console.error('❌ Subscription creation error:', error);

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
