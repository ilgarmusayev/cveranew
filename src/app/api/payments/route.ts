import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import EpointService from '@/lib/epoint';
import { v4 as uuidv4 } from 'uuid';

// POST /api/payments/create - Create payment
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Giriş tələb olunur' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Yanlış token' },
        { status: 401 }
      );
    }

    const { planType, amount } = await req.json();

    if (!planType || !amount || !['Pro', 'Populyar', 'Premium'].includes(planType)) {
      return NextResponse.json(
        { message: 'Yanlış plan tipi və ya məbləğ' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'İstifadəçi tapılmadı' },
        { status: 404 }
      );
    }

    // Create unique order ID
    const orderId = `cvera_${planType.toLowerCase()}_${Date.now()}_${uuidv4().substr(0, 8)}`;

    // Create payment with epoint.az
    const paymentResult = await EpointService.createPayment({
      amount: amount,
      currency: 'AZN',
      orderId: orderId,
      description: `CVera ${planType} Abunəliyi`,
      successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?tier=${encodeURIComponent(planType)}&payment_id=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(amount)}`,
      errorRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/fail?order_id=${encodeURIComponent(orderId)}`,
      customerEmail: user.email,
      customerName: user.name || user.email
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { message: paymentResult.message || 'Ödəniş yaradıla bilmədi' },
        { status: 500 }
      );
    }

    // Save payment info to database
    await prisma.payment.create({
      data: {
        id: uuidv4(),
        userId: decoded.userId,
        orderId: orderId,
        transactionId: paymentResult.transactionId || '',
        amount: amount,
        currency: 'AZN',
        planType: planType,
        status: 'pending',
        paymentMethod: 'epoint',
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResult.paymentUrl,
      orderId: orderId,
      transactionId: paymentResult.transactionId,
      message: 'Ödəniş yaradıldı'
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { message: 'Daxili server xətası' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/payments/status/[transactionId] - Check payment status
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const transactionId = url.pathname.split('/').pop();

    if (!transactionId) {
      return NextResponse.json(
        { message: 'Tranzaksiya ID-si tələb olunur' },
        { status: 400 }
      );
    }

    const paymentStatus = await EpointService.getPaymentStatus(transactionId);

    return NextResponse.json({
      success: paymentStatus.success,
      status: paymentStatus.status,
      amount: paymentStatus.amount,
      transactionId: paymentStatus.transactionId,
      currency: paymentStatus.currency,
      message: paymentStatus.message
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { message: 'Daxili server xətası' },
      { status: 500 }
    );
  }
}
