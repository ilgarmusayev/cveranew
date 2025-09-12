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
  try {
    await verifyAdmin(request);
    const { id } = await params;
    const { isActive } = await request.json();

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: isActive ? 'active' : 'inactive',
        updatedAt: new Date()
      }
    });

    // If deactivating user, also deactivate their subscriptions
    if (!isActive) {
      await prisma.subscription.updateMany({
        where: { 
          userId: id,
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
      message: isActive ? 'İstifadəçi aktivləşdirildi' : 'İstifadəçi deaktivləşdirildi',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        status: updatedUser.status
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
