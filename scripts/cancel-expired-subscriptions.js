import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cancelExpiredSubscriptions() {
  try {
    console.log('🕐 Starting automatic subscription expiration check...');
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
      return;
    }

    // Update all expired subscriptions to 'expired' status
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

    console.log(`✅ Successfully canceled ${updateResult.count} expired subscriptions`);

    // Log details of canceled subscriptions
    for (const subscription of expiredSubscriptions) {
      console.log(`📋 Canceled subscription:`, {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        userEmail: subscription.user.email,
        tier: subscription.tier,
        expiredAt: subscription.expiresAt,
        canceledAt: new Date().toISOString()
      });
    }

    return {
      success: true,
      canceledCount: updateResult.count,
      canceledSubscriptions: expiredSubscriptions
    };

  } catch (error) {
    console.error('❌ Error canceling expired subscriptions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if called directly
if (require.main === module) {
  cancelExpiredSubscriptions()
    .then((result) => {
      console.log('🎉 Subscription cleanup completed successfully:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Subscription cleanup failed:', error);
      process.exit(1);
    });
}

export { cancelExpiredSubscriptions };
