require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupScrapingDogAPI() {
  try {
    console.log('🚀 ScrapingDog API key setup başlayır...');

    // ScrapingDog API key əlavə et
    const scrapingDogKey = await prisma.apiKey.upsert({
      where: {
        service_apiKey: {
          service: 'scrapingdog',
          apiKey: '68a99929b4148b34852a88be'
        }
      },
      update: {
        active: true,
        priority: 1, // Birinci prioritet
        dailyLimit: 1000,
        lastResult: 'ACTIVE - Primary LinkedIn scraper (ScrapingDog)'
      },
      create: {
        service: 'scrapingdog',
        apiKey: '68a99929b4148b34852a88be',
        active: true,
        priority: 1,
        dailyLimit: 1000,
        usageCount: 0,
        dailyUsage: 0,
        lastResult: 'NEW - Primary LinkedIn scraper (ScrapingDog)'
      }
    });

    console.log('✅ ScrapingDog API key konfiqurasiya edildi:', {
      id: scrapingDogKey.id,
      service: scrapingDogKey.service,
      priority: scrapingDogKey.priority,
      active: scrapingDogKey.active,
      dailyLimit: scrapingDogKey.dailyLimit
    });

    // RapidAPI key-i ikinci prioritet olaraq qoy
    await prisma.apiKey.updateMany({
      where: {
        service: 'rapidapi'
      },
      data: {
        active: true,
        priority: 2, // İkinci prioritet
        lastResult: 'SECONDARY - Additional skills extraction'
      }
    });

    console.log('✅ RapidAPI ikinci prioritet olaraq konfiqurasiya edildi');

    // BrightData və digər servisleri deaktiv et
    const deactivatedServices = await prisma.apiKey.updateMany({
      where: {
        service: {
          in: ['brightdata', 'scrapingdog_old']
        }
      },
      data: {
        active: false,
        priority: 999,
        lastResult: 'DEACTIVATED - Using ScrapingDog as primary'
      }
    });

    console.log(`🚫 ${deactivatedServices.count} köhnə servis deaktiv edildi`);

    console.log('🎉 ScrapingDog API birinci prioritet olaraq aktiv edildi!');
    console.log('📊 API prioritet sırası:');
    console.log('  1. ScrapingDog (Primary LinkedIn scraping)');
    console.log('  2. RapidAPI (Additional skills)');
    console.log('  ❌ BrightData (Deactivated)');

  } catch (error) {
    console.error('❌ API key setup xətası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupScrapingDogAPI();
