import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Giriş tələb olunur' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJWT(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Yanlış token' },
        { status: 401 }
      );
    }

    // Find the subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return NextResponse.json(
        { message: 'Abunəlik tapılmadı' },
        { status: 404 }
      );
    }

    // Check if user owns this subscription
    if (subscription.userId !== decoded.userId) {
      return NextResponse.json(
        { message: 'Bu abunəliyə icazəniz yoxdur' },
        { status: 403 }
      );
    }

    // Cancel the subscription
    await prisma.subscription.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    // Create a free subscription
    await prisma.subscription.create({
      data: {
        userId: decoded.userId,
        tier: 'free',
        status: 'active',
        provider: 'system',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    return NextResponse.json({
      message: 'Abunəlik ləğv edildi',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { message: 'Daxili server xətası' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
