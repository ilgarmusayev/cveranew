const { PrismaClient } = require('@prisma/client');

async function cancelSpecificExpiredSubscription() {
  const prisma = new PrismaClient();

  try {
    console.log('🔧 Manually canceling the expired subscription...');
    console.log('🗓️ Current time:', new Date().toISOString());

    // The specific subscription that should have been canceled
    const subscriptionId = '8613cfae-2a93-4266-a84c-f4eba140ce3a';
    const userId = 'ilgar5869@gmail.com';

    // Update the expired subscription
    const result = await prisma.subscription.update({
      where: {
        id: subscriptionId
      },
      data: {
        status: 'expired',
        updatedAt: new Date()
      }
    });

    console.log('✅ Successfully canceled the expired subscription:');
    console.log(`   - Subscription ID: ${result.id}`);
    console.log(`   - User: ${userId}`);
    console.log(`   - Tier: ${result.tier}`);
    console.log(`   - Was supposed to expire: ${result.expiresAt.toISOString()}`);
    console.log(`   - Status changed to: ${result.status}`);

    // Calculate how many minutes it was overdue
    const now = new Date();
    const overdue = Math.round((now - result.expiresAt) / (1000 * 60));
    console.log(`   - Was overdue by: ${overdue} minutes`);

  } catch (error) {
    console.error('❌ Error canceling subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cancelSpecificExpiredSubscription();
