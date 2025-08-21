 const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSamplePromoCodes() {
  try {
    console.log('Creating sample promo codes...');

    const promoCodes = [
      {
        code: 'PREMIUM2024',
        tier: 'Premium',
        description: 'Premium paket üçün promokod',
        usageLimit: 100,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        code: 'PRO2024',
        tier: 'Pro',
        description: 'Pro paket üçün promokod',
        usageLimit: 50,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        code: 'WELCOME50',
        tier: 'Premium',
        description: 'Xoş gəldin promokodu',
        usageLimit: 50,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      },
      {
        code: 'TESTCODE',
        tier: 'Pro',
        description: 'Test üçün promokod',
        usageLimit: 10,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        code: 'UNLIMITED',
        tier: 'Premium',
        description: 'Limitsiz promokod',
        usageLimit: null, // unlimited
        expiresAt: null // never expires
      }
    ];

    for (const promoData of promoCodes) {
      try {
        const existingPromo = await prisma.promoCode.findUnique({
          where: { code: promoData.code }
        });

        if (existingPromo) {
          console.log(`⚠️ Promokod ${promoData.code} artıq mövcuddur, atlanır`);
          continue;
        }

        const promoCode = await prisma.promoCode.create({
          data: promoData
        });

        console.log(`✅ Promokod yaradıldı: ${promoCode.code} - ${promoCode.tier}`);
      } catch (error) {
        console.error(`❌ ${promoData.code} yaradılarkən xəta:`, error.message);
      }
    }

    console.log('\n📋 Mövcud promokodlar:');
    const allPromoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' }
    });

    allPromoCodes.forEach(promo => {
      console.log(`- ${promo.code}: ${promo.tier} (${promo.usageLimit ? `${promo.usedCount}/${promo.usageLimit}` : 'Limitsiz'} istifadə)`);
    });

  } catch (error) {
    console.error('Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSamplePromoCodes();
