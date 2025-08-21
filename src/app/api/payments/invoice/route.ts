import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyJWT } from '@/lib/auth';
import epointService from '@/lib/epoint';

const invoiceSchema = z.object({
  amount: z.number().min(0),
  currency: z.string().default('AZN'),
  description: z.string(),
  customerName: z.string().optional(),
  dueDate: z.string().optional(),
  invoiceNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
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
    
    if (!decoded || !decoded.userId || !decoded.email) {
      return NextResponse.json(
        { message: 'Yanlış token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, currency, description, customerName, dueDate, invoiceNumber } = invoiceSchema.parse(body);

    const orderId = `cvera_invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const invoiceResult = await epointService.createPayment({
      amount,
      currency,
      orderId,
      description,
      language: 'az'
    });

    return NextResponse.json({
      success: invoiceResult.success,
      invoiceId: orderId,
      invoiceUrl: invoiceResult.paymentUrl,
      message: invoiceResult.message
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { message: 'Qəbz yaradılarkən xəta' },
      { status: 500 }
    );
  }
}
