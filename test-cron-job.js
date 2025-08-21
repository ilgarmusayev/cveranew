const axios = require('axios');

async function testCronJob() {
  try {
    console.log('🔍 Testing subscription cancellation cron job...');
    console.log('🗓️ Current time:', new Date().toISOString());

    // Test the cron endpoint manually
    const response = await axios.post('http://localhost:3000/api/cron/cancel-expired-subscriptions', {}, {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'default_cron_secret_change_me'}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Cron job response:', response.data);

    if (response.data.success) {
      console.log(`📊 Canceled subscriptions: ${response.data.canceledCount}`);
      if (response.data.canceledSubscriptions && response.data.canceledSubscriptions.length > 0) {
        console.log('📋 Details:');
        response.data.canceledSubscriptions.forEach(sub => {
          console.log(`  - User: ${sub.userEmail}, Tier: ${sub.tier}, Expired: ${sub.expiredAt}`);
        });
      }
    } else {
      console.log('❌ Cron job failed:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Error testing cron job:', error.response?.data || error.message);
  }
}

// Also test direct database check
async function checkExpiredSubscriptions() {
  try {
    console.log('\n🔍 Checking expired subscriptions directly in database...');

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const now = new Date();
    console.log('🗓️ Current time:', now.toISOString());

    // Find active subscriptions that should be expired
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: now
        }
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    console.log(`📊 Found ${expiredSubscriptions.length} expired but still active subscriptions:`);

    expiredSubscriptions.forEach(sub => {
      console.log(`  - ID: ${sub.id}, User: ${sub.user.email}, Tier: ${sub.tier}`);
      console.log(`    Expired at: ${sub.expiresAt.toISOString()}`);
      console.log(`    Hours overdue: ${Math.round((now - sub.expiresAt) / (1000 * 60 * 60))} hours`);
    });

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

// Run both tests
async function runAllTests() {
  await checkExpiredSubscriptions();
  await testCronJob();
}

runAllTests();
