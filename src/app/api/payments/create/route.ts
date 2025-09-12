import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import epointService from '@/lib/epoint';


const createPaymentSchema = z.object({
  tier: z.enum(['free', 'pro', 'populyar', 'premium']),
  amount: z.number().min(0),
  saveCard: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { tier, amount, saveCard } = createPaymentSchema.parse(body);

    // Check if free tier
    if (tier === 'free') {
      await prisma.subscription.updateMany({
        where: {
          userId: decoded.userId,
          status: 'active',
        },
        data: {
          status: 'cancelled',
        },
      });

      await prisma.subscription.create({
        data: {
          userId: decoded.userId,
          tier: 'free',
          status: 'active',
          provider: 'system',
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      return NextResponse.json({
        message: 'Pulsuz abunəlik aktivləşdirildi',
        subscription: { tier: 'free', status: 'active' },
      });
    }

    // Generate unique order ID
    const orderId = `cvera_${tier}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: decoded.userId,
        planType: tier,
        amount,
        status: 'pending',
        paymentMethod: 'epoint',
        orderId,
        transactionId: 'pending' // Will be updated after payment creation
      },
    });

    // Prepare payment request
    const paymentRequest = {
      amount: amount,
      currency: 'AZN',
      orderId: orderId,
      description: `CVera ${tier} abunəlik`,
      successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      errorRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail`,
      resultUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/epointaz`,
      customerEmail: decoded.email,
      language: 'az'
    };

    console.log('Payment Request Debug:', {
      paymentRequest,
      environment: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        EPOINT_PUBLIC_KEY: process.env.EPOINT_PUBLIC_KEY?.substring(0, 5) + '...',
        EPOINT_API_URL: process.env.EPOINT_API_URL
      }
    });

    // For now, we only support standard payment creation
    // Card tokenization will be implemented later when needed
    const paymentResult = await epointService.createPayment(paymentRequest);

    console.log('Payment Result Debug:', {
      success: paymentResult.success,
      error: paymentResult.error,
      message: paymentResult.message
    });

    if (!paymentResult.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' }
      });

      return NextResponse.json(
        { message: paymentResult.error || paymentResult.message || 'Ödəniş yaradılarkən xəta' },
        { status: 400 }
      );
    }

    // Update payment with transaction ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        transactionId: paymentResult.transactionId,
        status: 'pending' // Payment will be completed via webhook
      }
    });

    return NextResponse.json({
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
      orderId: orderId,
      saveCard: saveCard
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Payment creation error:', error);
    return NextResponse.json(
      { message: 'Ödəniş yaradılarkən xəta' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
