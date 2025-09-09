import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'default_cron_secret_change_me';

  if (authHeader !== `Bearer ${cronSecret}`) {
    throw new Error('Unauthorized cron access');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron job call
    verifyCronSecret(request);

    console.log('🕐 Starting scheduled promo code expiration check...');
    console.log('🗓️ Current time:', new Date().toISOString());

    // Find all active promo codes that have expired
    const expiredPromoCodes = await prisma.promoCode.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date() // Less than current time = expired
        }
      }
    });

    console.log(`📊 Found ${expiredPromoCodes.length} expired promo codes to deactivate`);

    if (expiredPromoCodes.length === 0) {
      console.log('✅ No expired promo codes found');
      return NextResponse.json({
        success: true,
        message: 'No expired promo codes found',
        deactivatedCount: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Update all expired promo codes to 'inactive' status
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

    console.log(`✅ Successfully deactivated ${updateResult.count} expired promo codes`);

    // Log the deactivated promo codes for monitoring
    expiredPromoCodes.forEach(promoCode => {
      console.log(`  - ${promoCode.code} (${promoCode.tier}) - Expired: ${promoCode.expiresAt?.toISOString()}`);
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deactivated ${updateResult.count} expired promo codes`,
      deactivatedCount: updateResult.count,
      deactivatedCodes: expiredPromoCodes.map(p => ({
        code: p.code,
        tier: p.tier,
        expiresAt: p.expiresAt
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron job failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Also allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
