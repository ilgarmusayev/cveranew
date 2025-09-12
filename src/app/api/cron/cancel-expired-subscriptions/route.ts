import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


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

    console.log('🕐 Starting scheduled subscription expiration check...');
    console.log('🗓️ Current time:', new Date().toISOString());

    // Find all active subscriptions that have expired
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: new Date() // Less than current time = expired
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 Found ${expiredSubscriptions.length} expired subscriptions to cancel`);

    if (expiredSubscriptions.length === 0) {
      console.log('✅ No expired subscriptions found');
      return NextResponse.json({
        success: true,
        message: 'No expired subscriptions found',
        canceledCount: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Update all expired subscriptions to 'expired' status AND update user tiers to Free
    const updateResult = await prisma.subscription.updateMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: new Date()
        }
      },
      data: {
        status: 'expired',
        updatedAt: new Date()
      }
    });

    // Also update all affected users' tiers to Free
    const userIds = expiredSubscriptions.map(sub => sub.userId);
    if (userIds.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: { in: userIds }
        },
        data: {
          tier: 'Free',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated ${userIds.length} users' tiers to Free`);
    }

    console.log(`✅ Successfully canceled ${updateResult.count} expired subscriptions`);

    // Log details of canceled subscriptions
    const canceledDetails = [];
    for (const subscription of expiredSubscriptions) {
      const detail = {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        userEmail: subscription.user.email,
        tier: subscription.tier,
        expiredAt: subscription.expiresAt,
        canceledAt: new Date().toISOString()
      };

      console.log(`📋 Canceled subscription:`, detail);
      canceledDetails.push(detail);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully canceled ${updateResult.count} expired subscriptions`,
      canceledCount: updateResult.count,
      canceledSubscriptions: canceledDetails,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in scheduled subscription cleanup:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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
