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

    const { tier } = await request.json();
    const userId = id;

    // Validate tier
    if (!['Free', 'Medium', 'Premium', 'Pro', 'Populyar'].includes(tier)) {
      return NextResponse.json({
        success: false,
        message: 'Yanlış plan səviyyəsi'
      }, { status: 400 });
    }

    // Update user tier
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        tier,
        updatedAt: new Date()
      }
    });

    // If upgrading to Premium or Medium, create/update subscription
    if (tier !== 'Free') {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

      // Check if user has existing subscription
      const existingSubscription = await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      if (existingSubscription) {
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            tier,
            status: 'active',
            expiresAt,
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId,
            tier,
            status: 'active',
            provider: 'admin',
            expiresAt
          }
        });
      }
    } else {
      // If downgrading to Free, mark subscription as cancelled
      await prisma.subscription.updateMany({
        where: { 
          userId,
          status: 'active'
        },
        data: {
          status: 'cancelled',
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'İstifadəçi planı uğurla yeniləndi',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        tier: updatedUser.tier
      }
    });

  } catch (error) {
    console.error('Update tier error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
