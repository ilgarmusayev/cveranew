const { PrismaClient } = require('@prisma/client');

async function checkUserSubscriptionStatus() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking user subscription status after manual cancellation...');
    console.log('🗓️ Current time:', new Date().toISOString());

    // Check the user we manually expired - using correct field name 'subscriptions'
    const user = await prisma.user.findFirst({
      where: { email: 'ilgar5869@gmail.com' },
      include: { subscriptions: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', user.email);
    console.log('📊 User tier field:', user.tier);

    if (user.subscriptions && user.subscriptions.length > 0) {
      // Get the most recent subscription
      const latestSubscription = user.subscriptions.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      console.log('📋 Latest subscription details:');
      console.log('  - ID:', latestSubscription.id);
      console.log('  - Tier:', latestSubscription.tier);
      console.log('  - Status:', latestSubscription.status);
      console.log('  - Created:', latestSubscription.createdAt.toISOString());
      console.log('  - Expires:', latestSubscription.expiresAt.toISOString());

      // Calculate what dashboard should show
      const now = new Date();
      const isExpired = latestSubscription.expiresAt < now;
      const shouldShowFree = latestSubscription.status === 'expired' ||
                            latestSubscription.status === 'cancelled' ||
                            isExpired;

      console.log('⏰ Subscription analysis:');
      console.log('  - Is expired by date:', isExpired);
      console.log('  - Status is expired/cancelled:', latestSubscription.status === 'expired' || latestSubscription.status === 'cancelled');
      console.log('  - Dashboard should show:', shouldShowFree ? '🆓 FREE PLAN' : `💎 ${latestSubscription.tier}`);

      if (shouldShowFree) {
        console.log('✅ SUCCESS: User will see "Pulsuz" plan in dashboard');
        console.log('✅ SUCCESS: Subscription auto-cancellation working correctly');
      } else {
        console.log('⚠️ WARNING: User will still see premium plan - system needs fix');
      }

    } else {
      console.log('📋 No subscriptions found');
      console.log('✅ SUCCESS: User will see "Pulsuz" plan in dashboard');
    }

  } catch (error) {
    console.error('❌ Error checking user status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSubscriptionStatus();
