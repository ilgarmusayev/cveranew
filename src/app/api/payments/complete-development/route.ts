import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/auth';

const prisma = new PrismaClient();

// POST /api/payments/complete-development - Complete development mode payment
export async function POST(req: NextRequest) {
  try {
    const { transactionId, orderId } = await req.json();

    if (!transactionId || !orderId) {
      return NextResponse.json(
        { message: 'Transaction ID və Order ID tələb olunur' },
        { status: 400 }
      );
    }

    // Only allow in development mode
    if (process.env.EPOINT_DEVELOPMENT_MODE !== 'true') {
      return NextResponse.json(
        { message: 'Bu endpoint yalnız development mode-da işləyir' },
        { status: 403 }
      );
    }

    // Find payment by transaction ID or order ID
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transactionId: transactionId },
          { orderId: orderId }
        ]
      },
      include: {
        user: true
      }
    });

    if (!payment) {
      return NextResponse.json(
        { message: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status to completed
    await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: 'completed'
      }
    });

    // Create or update subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: payment.userId,
        status: 'active'
      }
    });

    if (existingSubscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          tier: payment.planType,
          provider: 'epoint',
          providerRef: payment.transactionId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Extend by 30 days
          updatedAt: new Date()
        }
      });
    } else {
      // Create new subscription
      await prisma.subscription.create({
        data: {
          userId: payment.userId,
          tier: payment.planType,
          status: 'active',
          provider: 'epoint',
          providerRef: payment.transactionId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
    }

    console.log(`✅ Development payment completed and subscription activated: ${payment.user.email} -> ${payment.planType}`);

    return NextResponse.json({
      success: true,
      transactionId: payment.transactionId,
      orderId: payment.orderId,
      amount: payment.amount,
      planType: payment.planType,
      message: 'Development payment completed successfully'
    });

  } catch (error) {
    console.error('Development payment completion error:', error);
    return NextResponse.json(
      { message: 'Development payment completion zamanı xəta' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
