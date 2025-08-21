const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndSetupAPIKeys() {
  try {
    console.log('🔍 Mövcud API key strukturunu yoxlayıram...');

    // Mövcud sahələrlə işləyək
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        service: true,
        apiKey: true,
        active: true,
        dailyLimit: true,
        dailyUsage: true,
        lastReset: true
      }
    });

    console.log(`📊 Cəmi ${apiKeys.length} API key tapıldı`);

    if (apiKeys.length > 0) {
      console.log('📋 Mövcud API key-lər:');
      apiKeys.forEach(key => {
        console.log(`  🔑 ${key.service}: ${key.active ? '✅ Aktiv' : '❌ Deaktiv'} - ${key.dailyUsage}/${key.dailyLimit} istifadə`);
      });
    }

    // ScrapingDog və RapidAPI key-lərini yoxla və əlavə et
    const requiredServices = [
      {
        service: 'scrapingdog_linkedin',
        apiKey: '6882894b855f5678d36484c8',
        dailyLimit: 1000
      },
      {
        service: 'rapidapi_linkedin',
        apiKey: 'your_rapidapi_key_here',
        dailyLimit: 500
      }
    ];

    for (const serviceData of requiredServices) {
      const existing = apiKeys.find(key => key.service === serviceData.service);

      if (!existing) {
        console.log(`➕ ${serviceData.service} əlavə edilir...`);
        await prisma.apiKey.create({
          data: {
            service: serviceData.service,
            apiKey: serviceData.apiKey,
            active: serviceData.service === 'scrapingdog_linkedin', // ScrapingDog-u aktiv et
            dailyLimit: serviceData.dailyLimit,
            dailyUsage: 0,
            lastReset: new Date(),
            priority: 1,
            usageCount: 0
          }
        });
        console.log(`✅ ${serviceData.service} əlavə edildi`);
      } else {
        console.log(`ℹ️ ${serviceData.service} artıq mövcuddur`);

        // API key-i yenilə
        await prisma.apiKey.update({
          where: { id: existing.id },
          data: {
            apiKey: serviceData.apiKey,
            active: serviceData.service === 'scrapingdog_linkedin',
            dailyLimit: serviceData.dailyLimit,
            updatedAt: new Date()
          }
        });
        console.log(`🔄 ${serviceData.service} yeniləndi`);
      }
    }

    // Final vəziyyət
    const finalKeys = await prisma.apiKey.findMany({
      select: {
        service: true,
        active: true,
        dailyLimit: true,
        dailyUsage: true
      }
    });

    console.log('\n🎉 API Key-lər hazırdır:');
    finalKeys.forEach(key => {
      console.log(`  🔑 ${key.service}: ${key.active ? '✅ Aktiv' : '❌ Deaktiv'} - ${key.dailyUsage}/${key.dailyLimit} istifadə`);
    });

    console.log('\n📌 LinkedIn import sistemi indi database-dən API key-ləri istifadə edəcək!');

  } catch (error) {
    console.error('❌ API key setup xətası:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndSetupAPIKeys();
