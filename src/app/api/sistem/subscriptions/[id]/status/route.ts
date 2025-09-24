import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';


async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token tapılmadı');
  }

  const token = authHeader.substring(7);
  
  // Try both JWT secrets
  let decoded: any;
  try {
    const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET;
    decoded = jwt.verify(token, JWT_ADMIN_SECRET!) as any;
  } catch {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  }
  
  // Check if it's an admin token
  if (decoded.adminId && decoded.isAdmin) {
    // This is an admin token, verify admin exists
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId }
    });

    if (!admin || !admin.active) {
      throw new Error('Admin icazəniz yoxdur');
    }

    return admin;
  } else if (decoded.userId) {
    // This is a regular user token, check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'ADMIN') {
      throw new Error('Admin icazəniz yoxdur');
    }

    return user;
  } else {
    throw new Error('Token səhvdir');
  }
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
