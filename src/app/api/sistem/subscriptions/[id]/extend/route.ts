import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';


async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token tapılmadı');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Admin icazəniz yoxdur');
  }

  return user;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await verifyAdmin(request);

    const { months } = await request.json();

    // Validate months
    if (!months || months < 1 || months > 12) {
      return NextResponse.json({
        success: false,
        message: 'Ay sayı 1-12 arasında olmalıdır'
      }, { status: 400 });
    }

    // Get current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id }
    });

    if (!subscription) {
      return NextResponse.json({
        success: false,
        message: 'Abunəlik tapılmadı'
      }, { status: 404 });
    }

    // Calculate new expiration date
    const currentExpiresAt = new Date(subscription.expiresAt);
    const newExpiresAt = new Date(currentExpiresAt);
    newExpiresAt.setMonth(newExpiresAt.getMonth() + months);

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt,
        status: 'active', // Reactivate if it was expired
        updatedAt: new Date()
      },
      include: {
        user: true
      }
    });

    // Update user tier if subscription was reactivated
    await prisma.user.update({
      where: { id: updatedSubscription.userId },
      data: { tier: updatedSubscription.tier }
    });

    return NextResponse.json({
      success: true,
      message: `Abunəlik ${months} ay uzadıldı`,
      subscription: updatedSubscription
    });

  } catch (error) {
    console.error('Extend subscription error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
