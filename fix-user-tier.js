const { PrismaClient } = require('@prisma/client');

async function fixUserTierForExpiredSubscription() {
  const prisma = new PrismaClient();

  try {
    console.log('🔧 Fixing user tier for expired subscription...');
    console.log('🗓️ Current time:', new Date().toISOString());

    // Update the user's tier to Free since their subscription is expired
    const result = await prisma.user.update({
      where: { email: 'ilgar5869@gmail.com' },
      data: {
        tier: 'Free',
        updatedAt: new Date()
      }
    });

    console.log('✅ Successfully updated user tier:');
    console.log(`   - User: ${result.email}`);
    console.log(`   - Old tier: Premium (from subscription)`);
    console.log(`   - New tier: ${result.tier}`);
    console.log(`   - Updated at: ${result.updatedAt.toISOString()}`);

    // Verify the fix worked
    const userCheck = await prisma.user.findFirst({
      where: { email: 'ilgar5869@gmail.com' },
      include: { subscriptions: true }
    });

    console.log('\n🔍 Verification:');
    console.log(`   - User tier in database: ${userCheck.tier}`);
    console.log(`   - Latest subscription status: ${userCheck.subscriptions[0]?.status || 'none'}`);
    console.log(`   - Dashboard will now show: PULSUZ`);
    console.log(`   - User will have Free plan limits: 2 CV max`);

  } catch (error) {
    console.error('❌ Error fixing user tier:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserTierForExpiredSubscription();
