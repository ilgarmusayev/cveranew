import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import epointService from '@/lib/epoint';


// POST /api/webhooks/epoint - epoint.az webhook handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const data = body.get('data') as string;
    const signature = body.get('signature') as string;
    
    if (!data || !signature) {
      console.error('Missing data or signature in webhook');
      return NextResponse.json(
        { message: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Verify webhook signature according to Epoint.az documentation
    if (!epointService.verifyWebhookSignature(data, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { message: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook data
    const payload = epointService.parseWebhookData(data);
    if (!payload) {
      console.error('Failed to parse webhook data');
      return NextResponse.json(
        { message: 'Invalid data format' },
        { status: 400 }
      );
    }

    const { order_id, status, amount, currency, response_code, response_message, transaction_id, rrn } = payload;

    console.log('Epoint Webhook received:', {
      order_id,
      status,
      amount,
      currency,
      response_code,
      transaction_id
    });

    // Find payment in database
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transactionId: transaction_id },
          { orderId: order_id }
        ]
      },
      include: {
        user: true
      }
    });

    if (!payment) {
      console.error('Payment not found for order:', order_id);
      return NextResponse.json(
        { message: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status based on Epoint.az response
    let newStatus = 'pending';
    if (status === 'success') {
      newStatus = 'completed';
    } else if (status === 'failed') {
      newStatus = 'failed';
    } else if (status === 'cancelled') {
      newStatus = 'cancelled';
    } else if (status === 'refunded') {
      newStatus = 'refunded';
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: newStatus,
        transactionId: transaction_id
      }
    });

    // Handle successful payment
    if (newStatus === 'completed') {
      // Cancel existing active subscriptions
      await prisma.subscription.updateMany({
        where: {
          userId: payment.userId,
          status: 'active'
        },
        data: {
          status: 'cancelled'
        }
      });

      // Create new subscription
      await prisma.subscription.create({
        data: {
          userId: payment.userId,
          tier: payment.planType,
          status: 'active',
          provider: 'epoint',
          providerRef: transaction_id,
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      });

      console.log(`✅ Subscription activated for user ${payment.userId}, tier: ${payment.planType}`);
    } else if (newStatus === 'failed') {
      console.log(`❌ Payment failed: ${response_code} - ${response_message}`);
    } else if (newStatus === 'refunded') {
      // Cancel associated subscription
      await prisma.subscription.updateMany({
        where: {
          userId: payment.userId,
          status: 'active'
        },
        data: {
          status: 'cancelled'
        }
      });
      console.log(`↩️ Payment refunded and subscription cancelled for user ${payment.userId}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      paymentStatus: newStatus
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { message: 'Webhook processing failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/webhooks/epoint - Test endpoint
export async function GET() {
  return NextResponse.json({ 
    message: 'Epoint webhook endpoint is working',
    demoMode: process.env.EPOINT_DEMO_MODE === 'true'
  });
}
