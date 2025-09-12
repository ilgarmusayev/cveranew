import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/jwt";


async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.replace("Bearer ", "");
  
  const payload = await verifyJWT(token);
  return payload?.userId || null;
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }

  try {
    const { tier } = await req.json();
    
    if (!tier || !['Free', 'Medium', 'Premium'].includes(tier)) {
      return NextResponse.json({ error: "Etibarsız paket" }, { status: 400 });
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (existingSubscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          tier,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new subscription
      await prisma.subscription.create({
        data: {
          userId,
          tier,
          status: 'active',
          provider: 'epointaz',
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      });
    }

    // For paid tiers, create payment via epoint.az
    if (tier !== 'Free') {
      // Import epoint service
      const EpointService = (await import('@/lib/epoint')).default;
      
      const amount = tier === 'Medium' ? 9.99 : 19.99;
      const orderId = `cvera_upgrade_${tier.toLowerCase()}_${Date.now()}`;
      
      const paymentResult = await EpointService.createPayment({
        amount: amount,
        currency: 'AZN',
        orderId: orderId,
        description: `CVera ${tier} Abunəlik Yeniləmə`,
        successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        errorRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/fail`,
        customerEmail: '', // You might want to get this from user
        customerName: ''
      });

      if (paymentResult.success) {
        return NextResponse.json({ 
          success: true, 
          paymentUrl: paymentResult.paymentUrl,
          message: 'Ödəniş üçün yönləndirilirsiniz...' 
        });
      } else {
        return NextResponse.json({ error: paymentResult.message }, { status: 400 });
      }
    }

  } catch (error) {
    console.error("Subscription upgrade error:", error);
    return NextResponse.json({ error: "Daxili server xətası" }, { status: 500 });
  }
}
