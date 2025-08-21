import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function verifyAdmin(request: NextRequest) {
  // In development, allow bypassing auth for testing
  if (process.env.NODE_ENV === 'development' && !request.headers.get('authorization')) {
    console.log('Development mode: bypassing admin auth for testing');
    return { id: 'test-admin', email: 'admin@test.com', role: 'ADMIN' };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token tapılmadı');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'superadmin')) {
    throw new Error('Admin icazəniz yoxdur');
  }

  return user;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;

    const { status } = await request.json();
    const subscriptionId = id;

    // Validate status
    if (!['active', 'cancelled', 'suspended', 'expired'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Yanlış abunəlik statusu'
      }, { status: 400 });
    }

    // Update subscription status
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        user: true
      }
    });

    // Update user tier based on subscription status
    if (status === 'cancelled' || status === 'expired' || status === 'suspended') {
      // Check if user has other active subscriptions
      const otherActiveSubscriptions = await prisma.subscription.findMany({
        where: {
          userId: updatedSubscription.userId,
          status: 'active',
          id: { not: subscriptionId }
        }
      });

      if (otherActiveSubscriptions.length === 0) {
        // No other active subscriptions, downgrade to Free
        await prisma.user.update({
          where: { id: updatedSubscription.userId },
          data: { tier: 'Free' }
        });
      }
    } else if (status === 'active') {
      // Reactivating subscription, update user tier
      await prisma.user.update({
        where: { id: updatedSubscription.userId },
        data: { tier: updatedSubscription.tier }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Abunəlik statusu yeniləndi',
      subscription: updatedSubscription
    });

  } catch (error) {
    console.error('Update subscription status error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
