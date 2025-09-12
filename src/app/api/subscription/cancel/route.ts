import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";


export async function POST(req: NextRequest) {
  try {
    // Get user from token
    const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
                  req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({
        message: "Giriş tələb olunur"
      }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Get user's current subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        message: "İstifadəçi tapılmadı"
      }, { status: 404 });
    }

    // Check if user has an active subscription
    if (user.subscriptions.length === 0) {
      return NextResponse.json({
        message: "Aktiv abunəliyiniz yoxdur"
      }, { status: 400 });
    }

    // Check if user is already on Free tier
    if (user.tier === 'Free') {
      return NextResponse.json({
        message: "Siz artıq pulsuz paketdəsiniz"
      }, { status: 400 });
    }

    // Get current tier features for warning message
    const currentSubscription = user.subscriptions[0];
    const currentTier = currentSubscription.tier;

    // Define features that will be lost
    const tierFeatures = {
      'Premium': [
        '📄 Limitsiz CV yaratma',
        '🎨 Bütün premium şablonlara giriş',
        '🤖 AI-powered CV təkmilləşdirmə',
        '📊 CV analitikası və təkliflər',
        '⚡ Prioritet dəstək',
        '💼 LinkedIn məlumatlarını avtomatik import'
      ],
      'Pro': [
        '📄 Limitsiz CV yaratma',
        '🎨 Pro şablonlara giriş',
        '🤖 AI köməkçisi',
        '📊 Ətraflı analitika',
        '⚡ Sürətli dəstək'
      ],
      'Medium': [
        '📄 Daha çox CV yaratma imkanı',
        '🎨 Medium şablonlara giriş',
        '🤖 Əsas AI xüsusiyyətləri',
        '📊 Əsas analitika'
      ]
    };

    const lostFeatures = tierFeatures[currentTier as keyof typeof tierFeatures] || [];

    await prisma.$transaction(async (tx) => {
      // Cancel all active subscriptions
      await tx.subscription.updateMany({
        where: {
          userId: userId,
          status: 'active'
        },
        data: {
          status: 'cancelled',
          expiresAt: new Date() // Set expiry to now
        }
      });

      // Update user tier to Free
      await tx.user.update({
        where: { id: userId },
        data: { tier: 'Free' }
      });
    });

    return NextResponse.json({
      message: "Abunəliyiniz uğurla ləğv edildi. İndi pulsuz paketi istifadə edirsiniz.",
      success: true,
      newTier: 'Free',
      previousTier: currentTier,
      lostFeatures: lostFeatures,
      freeFeatures: [
        '📄 2 CV yaratma imkanı',
        '🎨 Əsas şablonlara giriş',
        '📝 Əsas CV redaktəsi',
        '💾 CV-ləri yaddaşda saxlama'
      ],
      warningMessage: `${currentTier} paketindəki xüsusiyyətlər artıq əlçatan olmayacaq. Pulsuz paketə keçid edildi.`
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({
      message: "Abunəlik ləğv edilərkən xəta baş verdi"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
