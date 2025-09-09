const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPromoStatus() {
  try {
    console.log('🔍 Checking promo codes status...');
    
    const testPromoCodes = await prisma.promoCode.findMany({
      where: {
        code: {
          startsWith: 'TEST_'
        }
      }
    });

    console.log('\n📊 Current test promo codes:');
    testPromoCodes.forEach(promo => {
      const isExpired = promo.expiresAt < new Date();
      console.log(`  - ${promo.code}:`);
      console.log(`    Active: ${promo.isActive}`);
      console.log(`    Expired: ${isExpired}`);
      console.log(`    ExpiresAt: ${promo.expiresAt.toISOString()}`);
      console.log(`    Updated: ${promo.updatedAt.toISOString()}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPromoStatus();
