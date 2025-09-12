import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import epointService from '@/lib/epoint';

export async function POST(request: NextRequest) {
  try {
    console.log('Epoint.az webhook received');
    
    const contentType = request.headers.get('content-type') || '';
    let webhookData;
    
    if (contentType.includes('application/json')) {
      webhookData = await request.json();
      console.log('Webhook JSON data:', webhookData);
    } else {
      const formData = await request.formData();
      const dataParam = formData.get('data') as string;
      const signature = formData.get('signature') as string;
      
      console.log('Webhook form data received:', {
        hasData: !!dataParam,
        hasSignature: !!signature
      });

      if (!dataParam || !signature) {
        return NextResponse.json({ error: 'Missing data or signature' }, { status: 400 });
      }

      const isValid = epointService.verifyWebhookSignature(dataParam, signature);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      webhookData = epointService.parseWebhookData(dataParam);
      console.log('Parsed webhook data:', webhookData);
    }

    if (webhookData && webhookData.order_id) {
      const orderId = webhookData.order_id;
      const status = webhookData.status || webhookData.payment_status;
      const transactionId = webhookData.transaction_id || webhookData.txn_id;

      console.log('Processing payment:', { orderId, status, transactionId });

      const payment = await prisma.payment.findFirst({
        where: { orderId: orderId },
        include: { user: true }
      });

      if (!payment) {
        console.error('Payment not found:', orderId);
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      if (status === 'success' || status === 'completed' || status === 'paid') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            transactionId: transactionId || payment.transactionId
          }
        });

        await prisma.subscription.updateMany({
          where: {
            userId: payment.userId,
            status: 'active'
          },
          data: { status: 'cancelled' }
        });

        const subscription = await prisma.subscription.create({
          data: {
            userId: payment.userId,
            tier: payment.planType,
            status: 'active',
            provider: 'epoint',
            providerRef: transactionId || orderId,
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }
        });

        // Update user tier to match subscription tier
        await prisma.user.update({
          where: { id: payment.userId },
          data: { tier: payment.planType }
        });

        console.log('Subscription created:', subscription);
        console.log('User tier updated to:', payment.planType);

      } else if (status === 'failed' || status === 'cancelled' || status === 'error') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            transactionId: transactionId || payment.transactionId
          }
        });

        console.log('Payment marked as failed:', orderId);
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
