import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";


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
  // Error messages helper function
  const getMessages = (lang: string = 'azerbaijani') => {
    const messages = {
      azerbaijani: {
        loginRequired: "Giriş tələb olunur",
        invalidToken: "Token etibarsızdır",
        enterCode: "Promokod daxil edin",
        notFound: "Promokod tapılmadı",
        inactive: "Bu promokod artıq aktiv deyil",
        alreadyUsed: "Bu promokodu artıq istifadə etmisiniz",
        limitExceeded: "Bu promokoddun istifadə limiti bitib",
        expired: "Bu promokoddun vaxtı keçib",
        userNotFound: "İstifadəçi tapılmadı",
        timeout: "Prosedur çox uzun çəkir, təkrar cəhd edin",
        serverError: "Server xətası",
        upgradeSuccess: "Tebrikler! Paketiniz uğurla yeniləndi"
      },
      english: {
        loginRequired: "Login required",
        invalidToken: "Token is invalid",
        enterCode: "Enter promo code",
        notFound: "Promo code not found",
        inactive: "This promo code is no longer active",
        alreadyUsed: "You have already used this promo code",
        limitExceeded: "Usage limit for this promo code has been reached",
        expired: "This promo code has expired",
        userNotFound: "User not found",
        timeout: "Operation taking too long, please try again",
        serverError: "Server error",
        upgradeSuccess: "Congratulations! Your package has been successfully upgraded"
      },
      russian: {
        loginRequired: "Требуется вход",
        invalidToken: "Токен недействителен",
        enterCode: "Введите промокод",
        notFound: "Промокод не найден",
        inactive: "Этот промокод больше не активен",
        alreadyUsed: "Вы уже использовали этот промокод",
        limitExceeded: "Лимит использования этого промокода исчерпан",
        expired: "Срок действия этого промокода истек",
        userNotFound: "Пользователь не найден",
        timeout: "Операция занимает слишком много времени, попробуйте еще раз",
        serverError: "Ошибка сервера",
        upgradeSuccess: "Поздравляем! Ваш пакет успешно обновлен"
      }
    };
    return messages[lang as keyof typeof messages] || messages.azerbaijani;
  };
  
  try {
    // Auto-check and deactivate expired promo codes before application
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

    const { promoCode, language = 'azerbaijani' } = await req.json();
    const msg = getMessages(language);

    // Get user from token with production-safe fallbacks
    const authHeader = req.headers.get('authorization');
    const cookieToken = req.cookies.get('auth-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    console.log(`🔍 [APPLY] Auth check - Header: ${!!authHeader}, Cookie: ${!!cookieToken}`);

    if (!token) {
      console.log('❌ [APPLY] No token provided for promo application');
      return NextResponse.json({
        success: false,
        message: msg.loginRequired
      }, { status: 401, headers });
    }

    // Production-safe JWT verification
    let decoded: JWTPayload;
    try {
      if (!process.env.JWT_SECRET) {
        console.error('❌ [APPLY] JWT_SECRET not found in environment');
        throw new Error('Server configuration error');
      }
      decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
      console.log(`✅ [APPLY] JWT verification successful for user: ${decoded.userId}`);
    } catch (jwtError) {
      console.error('❌ [APPLY] JWT verification failed:', jwtError);
      return NextResponse.json({
        success: false,
        message: msg.invalidToken
      }, { status: 401, headers });
    }

    const userId = decoded.userId;

    console.log(`🚀 [APPLY] Starting application for promo code: "${promoCode}" | User: ${userId}`);

    // Validate promo code input
    if (!promoCode || typeof promoCode !== 'string') {
      console.log('❌ [APPLY] Invalid promo code input');
      return NextResponse.json({
        success: false,
        message: msg.enterCode
      }, { status: 400, headers });
    }

    // Start database transaction with timeout protection
    const transactionTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Transaction timeout')), 15000)
    );

    // Define the transaction result type
    interface TransactionResult {
      subscription: any;
      promoCode: any;
      expiresAt: Date;
    }

    console.log(`🌍 [APPLY] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 [APPLY] Database URL exists: ${!!process.env.DATABASE_URL}`);

    const transactionPromise = prisma.$transaction(async (tx) => {
      console.log(`🔍 [APPLY] Starting database transaction for: ${promoCode}`);

      // Find promo code with OR query for case-insensitive search
      const foundPromoCode = await tx.promoCode.findFirst({
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

      if (!foundPromoCode) {
        console.log(`❌ [APPLY] Promo code not found: "${promoCode}"`);
        throw new Error(msg.notFound);
      }

      console.log(`✅ [APPLY] Found promo code: ${foundPromoCode.code} | Tier: ${foundPromoCode.tier}`);

      // Check if promo code is active
      if (!foundPromoCode.isActive) {
        console.log(`❌ [APPLY] Promo code inactive: ${foundPromoCode.code}`);
        throw new Error(msg.inactive);
      }

      // Check if user already used this promo code
      if (foundPromoCode.usedBy.length > 0) {
        console.log(`❌ [APPLY] User already used promo: ${foundPromoCode.code}`);
        throw new Error(msg.alreadyUsed);
      }

      // Check usage limit
      if (foundPromoCode.usageLimit && foundPromoCode.usedCount >= foundPromoCode.usageLimit) {
        console.log(`❌ [APPLY] Usage limit exceeded: ${foundPromoCode.usedCount}/${foundPromoCode.usageLimit}`);
        throw new Error(msg.limitExceeded);
      }

      // Check expiration date
      if (foundPromoCode.expiresAt && foundPromoCode.expiresAt < new Date()) {
        console.log(`❌ [APPLY] Promo code expired: ${foundPromoCode.expiresAt}`);
        throw new Error(msg.expired);
      }

      // Get user info with enhanced logging
      console.log(`🔍 [APPLY] Fetching user data for: ${userId}`);
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { subscriptions: true }
      });

      if (!user) {
        console.log(`❌ [APPLY] User not found: ${userId}`);
        throw new Error(msg.userNotFound);
      }

      console.log(`👤 [APPLY] Found user: ${user.email} | Current tier: ${user.tier} | Subscriptions: ${user.subscriptions?.length || 0}`);

      // Calculate subscription expiration (1 month from now for premium promo codes)
      let expiresAt;
      const premiumTiers = ['Medium', 'Pro', 'Populyar', 'Premium', 'Business'];

      if (premiumTiers.includes(foundPromoCode.tier)) {
        const now = new Date();
        expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        console.log(`🗓️ [APPLY] Setting 1 month expiration for ${foundPromoCode.tier} promo: ${expiresAt.toISOString()}`);
      } else {
        // For Free tier, set expiration to year 2099 (effectively unlimited)
        expiresAt = new Date('2099-12-31T23:59:59.999Z');
        console.log(`🗓️ [APPLY] Setting far future expiration for ${foundPromoCode.tier} promo: ${expiresAt.toISOString()}`);
      }

      // Delete existing subscriptions if exist (user can have multiple subscriptions)
      if (user.subscriptions && user.subscriptions.length > 0) {
        console.log(`🗑️ [APPLY] Deleting ${user.subscriptions.length} existing subscriptions for user ${userId}`);
        const deleteResult = await tx.subscription.deleteMany({
          where: { userId: userId }
        });
        console.log(`🗑️ [APPLY] Deleted subscriptions count: ${deleteResult.count}`);
      }

      // Update user tier to match the promo code tier
      console.log(`🔄 [APPLY] Updating user tier from ${user.tier} to ${foundPromoCode.tier}`);
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { tier: foundPromoCode.tier }
      });
      console.log(`🔄 [APPLY] User tier updated successfully. New tier: ${updatedUser.tier}`);

      // Create new subscription based on promo code tier
      const subscriptionData: any = {
        userId: userId,
        tier: foundPromoCode.tier,
        status: 'active',
        provider: 'promocode',
        providerRef: `promo_${foundPromoCode.code}_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Only add expiresAt if it's not null
      if (expiresAt) {
        subscriptionData.expiresAt = expiresAt;
      }

      console.log(`📦 [APPLY] Creating subscription with data:`, JSON.stringify(subscriptionData, null, 2));
      const subscription = await tx.subscription.create({
        data: subscriptionData
      });
      console.log(`📦 [APPLY] Subscription created successfully with ID: ${subscription.id}`);

      // Mark promo code as used
      console.log(`✅ [APPLY] Marking promo code as used`);
      const promoUsage = await tx.promoCodeUsage.create({
        data: {
          promoCodeId: foundPromoCode.id,
          userId: userId,
          usedAt: new Date()
        }
      });
      console.log(`✅ [APPLY] Promo usage recorded with ID: ${promoUsage.id}`);

      // Update promo code usage count
      console.log(`📊 [APPLY] Updating promo code usage count from ${foundPromoCode.usedCount} to ${foundPromoCode.usedCount + 1}`);
      const updatedPromoCode = await tx.promoCode.update({
        where: { id: foundPromoCode.id },
        data: {
          usedCount: foundPromoCode.usedCount + 1
        }
      });
      console.log(`📊 [APPLY] Promo code usage count updated: ${updatedPromoCode.usedCount}`);

      console.log(`🎉 [APPLY] Successfully applied promo code ${foundPromoCode.code} for user ${userId}`);
      console.log(`📦 [APPLY] Created ${foundPromoCode.tier} subscription until ${expiresAt ? expiresAt.toISOString() : 'unlimited'}`);

      // Double-check the results
      const finalUser = await tx.user.findUnique({
        where: { id: userId },
        include: { subscriptions: { where: { status: 'active' } } }
      });
      console.log(`🔍 [APPLY] Final user check - Tier: ${finalUser?.tier}, Active subscriptions: ${finalUser?.subscriptions?.length}`);

      return {
        subscription,
        promoCode: foundPromoCode,
        expiresAt
      } as TransactionResult;
    }, {
      timeout: 30000, // Increased timeout for production
      maxWait: 15000, // Increased max wait for production
    });

    let result: TransactionResult;
    try {
      result = await Promise.race([transactionPromise, transactionTimeout]) as TransactionResult;
    } catch (error) {
      console.error('❌ [APPLY] Transaction error:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        return NextResponse.json({
          success: false,
          message: getMessages('azerbaijani').timeout
        }, { status: 408, headers });
      }
      throw error; // Re-throw non-timeout errors
    }

    console.log(`✅ [APPLY] Transaction completed successfully`);

    return NextResponse.json({
      success: true,
      message: `${(result as TransactionResult).promoCode.tier} abunəliyi uğurla aktivləşdirildi!`,
      subscription: {
        tier: (result as TransactionResult).subscription.tier,
        status: (result as TransactionResult).subscription.status,
        expiresAt: (result as TransactionResult).subscription.expiresAt,
        daysRemaining: (result as TransactionResult).expiresAt ? Math.ceil(((result as TransactionResult).expiresAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
      }
    }, { headers });

  } catch (error) {
    console.error('❌ [APPLY] Promo code application error:', error);

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Server xətası'
    }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.warn('⚠️ [APPLY] Prisma disconnect warning:', disconnectError);
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
