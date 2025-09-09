import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email?: string;
}

// Check and auto-deactivate expired promo codes
async function checkAndDeactivateExpiredPromoCodes() {
  try {
    console.log('🔄 Auto-checking for expired promo codes...');
    
    // Find all expired promo codes that are still active
    const expiredPromoCodes = await prisma.promoCode.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date() // Less than current time = expired
        }
      }
    });

    if (expiredPromoCodes.length === 0) {
      console.log('✅ No expired promo codes to deactivate');
      return null;
    }

    console.log(`🔄 Auto-deactivating ${expiredPromoCodes.length} expired promo codes`);

    // Deactivate expired promo codes
    const updateResult = await prisma.promoCode.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date()
        }
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Auto-deactivated ${updateResult.count} expired promo codes`);
    
    return {
      deactivatedCount: updateResult.count,
      deactivatedCodes: expiredPromoCodes
    };
  } catch (error) {
    console.error('❌ Error checking expired promo codes:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auto-check and deactivate expired promo codes before validation
    await checkAndDeactivateExpiredPromoCodes();
    
    // Add CORS headers for production
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    const { promoCode } = await req.json();

    // Get user from token with production-safe fallbacks
    const authHeader = req.headers.get('authorization');
    const cookieToken = req.cookies.get('auth-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    console.log(`🔍 [VALIDATE] Auth check - Header: ${!!authHeader}, Cookie: ${!!cookieToken}`);

    if (!token) {
      console.log('❌ [VALIDATE] No token provided for promo validation');
      return NextResponse.json({
        success: false,
        message: "Giriş tələb olunur"
      }, { status: 401, headers });
    }

    // Production-safe JWT verification
    let decoded: JWTPayload;
    try {
      if (!process.env.JWT_SECRET) {
        console.error('❌ [VALIDATE] JWT_SECRET not found in environment');
        throw new Error('Server configuration error');
      }
      decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
      console.log(`✅ [VALIDATE] JWT verification successful for user: ${decoded.userId}`);
    } catch (jwtError) {
      console.error('❌ [VALIDATE] JWT verification failed:', jwtError);
      return NextResponse.json({
        success: false,
        message: "Token etibarsızdır"
      }, { status: 401, headers });
    }

    const userId = decoded.userId;

    console.log(`🔍 [VALIDATE] Starting validation for promo code: "${promoCode}" | User: ${userId}`);

    // Validate promo code input
    if (!promoCode || typeof promoCode !== 'string') {
      console.log('❌ [VALIDATE] Invalid promo code input');
      return NextResponse.json({
        success: false,
        message: "Promokod daxil edin"
      }, { status: 400, headers });
    }

    // Database connection with timeout
    const dbTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), 10000)
    );

    const dbQuery = prisma.promoCode.findFirst({
      where: {
        OR: [
          { code: promoCode.trim() },
          { code: promoCode.trim().toUpperCase() }
        ]
      },
      include: {
        usedBy: {
          where: { userId }
        }
      }
    });

    let foundPromoCode;
    try {
      foundPromoCode = await Promise.race([dbQuery, dbTimeout]) as any;
    } catch (dbError) {
      console.error('❌ [VALIDATE] Database error:', dbError);
      return NextResponse.json({
        success: false,
        message: "Database xətası"
      }, { status: 500, headers });
    }

    if (!foundPromoCode) {
      console.log(`❌ [VALIDATE] Promo code not found in database: "${promoCode}"`);
      return NextResponse.json({
        success: false,
        message: "Promokod tapılmadı"
      }, { status: 404, headers });
    }

    console.log(`✅ [VALIDATE] Found promo code: ${foundPromoCode.code} | Tier: ${foundPromoCode.tier} | Active: ${foundPromoCode.isActive}`);

    // Check if promo code is active
    if (!foundPromoCode.isActive) {
      console.log(`❌ [VALIDATE] Promo code is inactive: ${foundPromoCode.code}`);
      return NextResponse.json({
        success: false,
        message: "Bu promokod artıq aktiv deyil"
      }, { status: 400, headers });
    }

    // Check if user already used this promo code
    if (foundPromoCode.usedBy.length > 0) {
      console.log(`❌ [VALIDATE] User already used this promo code: ${foundPromoCode.code}`);
      return NextResponse.json({
        success: false,
        message: "Bu promokodu artıq istifadə etmisiniz"
      }, { status: 400, headers });
    }

    // Check usage limit
    if (foundPromoCode.usageLimit && foundPromoCode.usedCount >= foundPromoCode.usageLimit) {
      console.log(`❌ [VALIDATE] Usage limit exceeded: ${foundPromoCode.usedCount}/${foundPromoCode.usageLimit}`);
      return NextResponse.json({
        success: false,
        message: "Bu promokoddun istifadə limiti bitib"
      }, { status: 400, headers });
    }

    // Check expiration date
    if (foundPromoCode.expiresAt && foundPromoCode.expiresAt < new Date()) {
      console.log(`❌ [VALIDATE] Promo code expired: ${foundPromoCode.expiresAt}`);
      return NextResponse.json({
        success: false,
        message: "Bu promokoddun vaxtı keçib"
      }, { status: 400, headers });
    }

    // Calculate subscription duration for premium tiers
    let subscriptionDuration = null;
    const premiumTiers = ['Medium', 'Pro', 'Populyar', 'Premium', 'Business'];

    if (premiumTiers.includes(foundPromoCode.tier)) {
      subscriptionDuration = "1 ay";
    }

    console.log(`✅ [VALIDATE] Promo code validation successful: ${foundPromoCode.code} - ${foundPromoCode.tier}`);

    return NextResponse.json({
      success: true,
      valid: true, // Add explicit valid field
      message: "Promokod keçərlidir",
      tier: foundPromoCode.tier, // Add tier field at root level
      promoCode: {
        code: foundPromoCode.code,
        tier: foundPromoCode.tier,
        description: foundPromoCode.description,
        subscriptionDuration,
        usageRemaining: foundPromoCode.usageLimit ? foundPromoCode.usageLimit - foundPromoCode.usedCount : "Limitsiz",
        expiresAt: foundPromoCode.expiresAt
      }
    }, { headers });

  } catch (error) {
    console.error('❌ [VALIDATE] Promo code validation error:', error);

    return NextResponse.json({
      success: false,
      valid: false,
      message: "Server xətası"
    }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.warn('⚠️ [VALIDATE] Prisma disconnect warning:', disconnectError);
    }
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
