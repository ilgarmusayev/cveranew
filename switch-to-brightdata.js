const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function switchToBrightData() {
  try {
    console.log('🔄 YALNIZ BrightData + RapidAPI aktiv edilir...');

    // 1. Bütün ScrapingDog API key-lərini deaktiv et
    const deactivatedScrapingDog = await prisma.apiKey.updateMany({
      where: {
        service: {
          in: ['scrapingdog', 'scrapingdog_linkedin']
        }
      },
      data: {
        active: false,
        priority: 999,
        lastResult: 'DEACTIVATED - Using only BrightData + RapidAPI'
      }
    });

    console.log(`🚫 ${deactivatedScrapingDog.count} ScrapingDog API key tamamilə deaktiv edildi`);

    // 2. BrightData API key-lərini aktiv et (Primary)
    const activatedBrightData = await prisma.apiKey.updateMany({
      where: {
        service: 'brightdata'
      },
      data: {
        active: true,
        priority: 1, // Əsas prioritet
        lastResult: 'ACTIVE - Primary LinkedIn scraper'
      }
    });

    console.log(`✅ ${activatedBrightData.count} BrightData API key aktiv edildi (Primary)`);

    // 3. RapidAPI key-lərini aktiv et (Skills üçün)
    const activatedRapidAPI = await prisma.apiKey.updateMany({
      where: {
        service: 'rapidapi'
      },
      data: {
        active: true,
        priority: 2, // İkinci prioritet - skills üçün
        lastResult: 'ACTIVE - Additional skills extraction'
      }
    });

    console.log(`✅ ${activatedRapidAPI.count} RapidAPI key aktiv edildi (Skills)`);

    // 4. Əgər BrightData key yoxdursa, əlavə et
    if (activatedBrightData.count === 0) {
      const newBrightDataKey = await prisma.apiKey.create({
        data: {
          service: 'brightdata',
          apiKey: 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae',
          active: true,
          priority: 1,
          dailyLimit: 1000,
          usageCount: 0,
          dailyUsage: 0,
          lastResult: 'CREATED - Primary LinkedIn scraper'
        }
      });

      console.log(`🆕 Yeni BrightData API key yaradıldı: ${newBrightDataKey.id}`);
    }

    // 5. Status yoxlanışı
    const activeKeys = await prisma.apiKey.findMany({
      where: {
        active: true
      },
      orderBy: {
        priority: 'asc'
      }
    });

    console.log('\n📊 Aktiv API key-lər:');
    activeKeys.forEach(key => {
      console.log(`  ${key.priority}. ${key.service} - ${key.apiKey.substring(0, 8)}... (${key.active ? 'ACTIVE' : 'INACTIVE'})`);
    });

    // 6. ScrapingDog-u tamamilə sil
    const deletedScrapingDog = await prisma.apiKey.deleteMany({
      where: {
        service: {
          in: ['scrapingdog', 'scrapingdog_linkedin']
        }
      }
    });

    console.log(`🗑️ ${deletedScrapingDog.count} ScrapingDog key tamamilə silindi`);

    console.log('\n✅ Keçid tamamlandı: YALNIZ BrightData + RapidAPI');
    console.log('📋 Konfiqurasiya:');
    console.log('   1️⃣ BrightData - Əsas LinkedIn scraping');
    console.log('   2️⃣ RapidAPI - Əlavə skills extraction');
    console.log('   ❌ ScrapingDog - Tamamilə silindi');

  } catch (error) {
    console.error('❌ Keçid zamanı xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Funksiyanı işə sal
switchToBrightData();
