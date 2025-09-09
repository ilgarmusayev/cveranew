const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPromoCodeExpiration() {
  try {
    console.log('🧪 Testing promo code auto-expiration system...');
    console.log('🗓️ Current time:', new Date().toISOString());

    // Clean up any existing test promo codes first
    await prisma.promoCode.deleteMany({
      where: {
        code: {
          startsWith: 'TEST_'
        }
      }
    });

    console.log('🧹 Cleaned up existing test promo codes');

    // Create a test expired promo code
    const expiredPromoCode = await prisma.promoCode.create({
      data: {
        code: 'TEST_EXPIRED_PROMO',
        tier: 'Premium',
        description: 'Test expired promo code',
        isActive: true, // Active but expired
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        usageLimit: 100,
        usedCount: 0
      }
    });

    console.log('✅ Test expired promo code created:', {
      code: expiredPromoCode.code,
      tier: expiredPromoCode.tier,
      isActive: expiredPromoCode.isActive,
      expiresAt: expiredPromoCode.expiresAt,
      isExpired: expiredPromoCode.expiresAt < new Date()
    });

    // Create a test valid promo code
    const validPromoCode = await prisma.promoCode.create({
      data: {
        code: 'TEST_VALID_PROMO',
        tier: 'Premium',
        description: 'Test valid promo code',
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        usageLimit: 100,
        usedCount: 0
      }
    });

    console.log('✅ Test valid promo code created:', {
      code: validPromoCode.code,
      tier: validPromoCode.tier,
      isActive: validPromoCode.isActive,
      expiresAt: validPromoCode.expiresAt,
      isExpired: validPromoCode.expiresAt < new Date()
    });

    console.log('\n🔍 Current state - All test promo codes:');
    const allTestPromoCodes = await prisma.promoCode.findMany({
      where: {
        code: {
          startsWith: 'TEST_'
        }
      }
    });

    allTestPromoCodes.forEach(promo => {
      const isExpired = promo.expiresAt < new Date();
      console.log(`  - ${promo.code}: Active=${promo.isActive}, Expired=${isExpired}, ExpiresAt=${promo.expiresAt.toISOString()}`);
    });

    console.log('\n🧪 Test setup complete. Now test:');
    console.log('1. Call /api/promo-code/validate with TEST_EXPIRED_PROMO (should auto-deactivate)');
    console.log('2. Call /api/promo-code/validate with TEST_VALID_PROMO (should work)');
    console.log('3. Call /api/cron/deactivate-expired-promodes (scheduled cleanup)');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPromoCodeExpiration();
