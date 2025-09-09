const { PrismaClient } = require('@prisma/client');

async function createTestExpiredSubscription() {
  const prisma = new PrismaClient();

  try {
    console.log('🧪 Creating test expired subscription...');

    // Create a test user first
    const testUser = await prisma.user.upsert({
      where: { email: 'test-user@example.com' },
      update: {
        tier: 'Premium' // Set to Premium so we can test auto-cancellation
      },
      create: {
        email: 'test-user@example.com',
        name: 'Test User',
        tier: 'Premium'
      }
    });

    console.log('✅ Test user created/updated:', testUser.email);

    // Create an expired subscription
    const expiredSubscription = await prisma.subscription.create({
      data: {
        userId: testUser.id,
        tier: 'Premium',
        status: 'active', // Active but expired
        provider: 'stripe',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      }
    });

    console.log('✅ Test expired subscription created:', {
      id: expiredSubscription.id,
      tier: expiredSubscription.tier,
      status: expiredSubscription.status,
      expiresAt: expiredSubscription.expiresAt,
      isExpired: expiredSubscription.expiresAt < new Date()
    });

    console.log('\n🧪 Test setup complete. Now test auto-cancellation by calling /api/users/limits');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestExpiredSubscription();
