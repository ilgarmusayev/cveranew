import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyJWT } from "@/lib/jwt";

const prisma = new PrismaClient();

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  console.log('Authorization header:', auth);
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.replace("Bearer ", "");
  
  console.log('Token:', token.substring(0, 20) + '...');
  const payload = await verifyJWT(token);
  console.log('JWT payload:', payload);
  return payload?.userId || null;
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!activeSubscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    // Cancel the subscription
    await prisma.subscription.update({
      where: { id: activeSubscription.id },
      data: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    });

    // Create a new Free subscription
    await prisma.subscription.create({
      data: {
        userId,
        tier: 'Free',
        status: 'active',
        provider: 'system',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Abunəlik uğurla ləğv edildi' 
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
