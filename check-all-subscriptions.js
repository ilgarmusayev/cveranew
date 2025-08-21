const { PrismaClient } = require('@prisma/client');

async function checkAllSubscriptions() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking all subscriptions in database...');
    console.log('🗓️ Current time:', new Date().toISOString());

    // Get all subscriptions
    const allSubscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total subscriptions found: ${allSubscriptions.length}`);

    if (allSubscriptions.length === 0) {
      console.log('⚠️ No subscriptions found in database');
      return;
    }

    console.log('\n📋 All subscriptions:');
    allSubscriptions.forEach((sub, index) => {
      const now = new Date();
      const isExpired = sub.expiresAt && sub.expiresAt < now;
      const daysRemaining = sub.expiresAt ? Math.ceil((sub.expiresAt - now) / (1000 * 60 * 60 * 24)) : null;

      console.log(`\n${index + 1}. Subscription ID: ${sub.id}`);
      console.log(`   User: ${sub.user.email}`);
      console.log(`   Tier: ${sub.tier}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Created: ${sub.createdAt.toISOString()}`);
      console.log(`   Expires: ${sub.expiresAt ? sub.expiresAt.toISOString() : 'Never'}`);

      if (sub.expiresAt) {
        console.log(`   ${isExpired ? '❌ EXPIRED' : '✅ Active'} (${daysRemaining} days ${daysRemaining > 0 ? 'remaining' : 'overdue'})`);
      }
    });

    // Check for specific date range around 08.08
    const targetDate = new Date('2025-08-08');
    const dayBefore = new Date('2025-08-07');
    const dayAfter = new Date('2025-08-09');

    console.log('\n🎯 Checking subscriptions expiring around 08.08.2025:');
    const august8Subscriptions = allSubscriptions.filter(sub =>
      sub.expiresAt &&
      sub.expiresAt >= dayBefore &&
      sub.expiresAt <= dayAfter
    );

    if (august8Subscriptions.length > 0) {
      console.log(`📅 Found ${august8Subscriptions.length} subscriptions expiring around 08.08:`);
      august8Subscriptions.forEach(sub => {
        console.log(`   - ${sub.user.email}: ${sub.tier}, expires ${sub.expiresAt.toISOString()}, status: ${sub.status}`);
      });
    } else {
      console.log('📅 No subscriptions found expiring around 08.08.2025');
    }

  } catch (error) {
    console.error('❌ Error checking subscriptions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllSubscriptions();
