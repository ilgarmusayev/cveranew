import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: { orderId: orderId },
      include: { user: true }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status to completed
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        transactionId: `manual_${Date.now()}`
      }
    });

    // Deactivate existing subscriptions
    await prisma.subscription.updateMany({
      where: {
        userId: payment.userId,
        status: 'active'
      },
      data: { status: 'cancelled' }
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: payment.userId,
        tier: payment.planType,
        status: 'active',
        provider: 'epoint',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment manually completed',
      payment: payment,
      subscription: subscription
    });

  } catch (error) {
    console.error('Manual payment completion error:', error);
    return NextResponse.json(
      { error: 'Failed to complete payment manually' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
