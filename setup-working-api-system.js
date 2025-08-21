const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupWorkingAPIKeys() {
  try {
    console.log('🔧 API açarlarını database ilə sinxronlaşdırıram...');

    // Mövcud API key-ləri yoxla
    const existingKeys = await prisma.apiKey.findMany();
    console.log(`📊 Hazırda ${existingKeys.length} API key mövcuddur`);

    if (existingKeys.length > 0) {
      console.log('📋 Mövcud API key-lər:');
      existingKeys.forEach(key => {
        console.log(`  🔑 ${key.serviceName}: ${key.isActive ? '✅ Aktiv' : '❌ Deaktiv'} - ${key.currentUsage}/${key.dailyLimit || '∞'} istifadə`);
      });
    }

    // ScrapingDog və RapidAPI üçün tələb olunan key-lər
    const requiredKeys = [
      {
        serviceName: 'scrapingdog_linkedin',
        apiKey: '6882894b855f5678d36484c8',
        apiUrl: 'https://api.scrapingdog.com/linkedin',
        isActive: true,
        dailyLimit: 1000,
        notes: 'LinkedIn profil məlumatlarını ScrapingDog vasitəsilə əldə etmək'
      },
      {
        serviceName: 'rapidapi_linkedin',
        apiKey: 'your_rapidapi_key_here', // Bu real RapidAPI key ilə əvəz edilməlidir
        apiUrl: 'https://linkedin-api.rapidapi.com',
        isActive: false, // Real key əlavə edilənə qədər deaktiv
        dailyLimit: 500,
        notes: 'LinkedIn API RapidAPI vasitəsilə - yedək sistem'
      }
    ];

    for (const keyData of requiredKeys) {
      try {
        // Mövcud key-i yoxla
        const existing = await prisma.apiKey.findUnique({
          where: { serviceName: keyData.serviceName }
        });

        if (existing) {
          console.log(`🔄 ${keyData.serviceName} yenilənir...`);
          await prisma.apiKey.update({
            where: { serviceName: keyData.serviceName },
            data: {
              apiKey: keyData.apiKey,
              apiUrl: keyData.apiUrl,
              isActive: keyData.isActive,
              dailyLimit: keyData.dailyLimit,
              notes: keyData.notes,
              updatedAt: new Date()
            }
          });
        } else {
          console.log(`➕ ${keyData.serviceName} əlavə edilir...`);
          await prisma.apiKey.create({
            data: {
              serviceName: keyData.serviceName,
              apiKey: keyData.apiKey,
              apiUrl: keyData.apiUrl,
              isActive: keyData.isActive,
              dailyLimit: keyData.dailyLimit,
              currentUsage: 0,
              lastResetDate: new Date(),
              notes: keyData.notes,
              createdBy: 'admin_setup'
            }
          });
        }

        console.log(`✅ ${keyData.serviceName} uğurla konfiqurasiya edildi`);

      } catch (error) {
        console.error(`❌ ${keyData.serviceName} konfiqurasiya xətası:`, error.message);
      }
    }

    // Final vəziyyəti göstər
    const finalKeys = await prisma.apiKey.findMany({
      orderBy: { serviceName: 'asc' }
    });

    console.log('\n🎉 API Key-lər Hazırdır:');
    finalKeys.forEach(key => {
      const usagePercent = key.dailyLimit ? (key.currentUsage / key.dailyLimit * 100).toFixed(1) : 0;
      console.log(`  🔑 ${key.serviceName}:`);
      console.log(`     Status: ${key.isActive ? '✅ Aktiv' : '❌ Deaktiv'}`);
      console.log(`     İstifadə: ${key.currentUsage}/${key.dailyLimit || '∞'} (${usagePercent}%)`);
      console.log(`     URL: ${key.apiUrl}`);
      console.log(`     Son sıfırlama: ${key.lastResetDate.toLocaleDateString('az-AZ')}`);
      console.log('');
    });

    console.log('📌 Növbəti addımlar:');
    console.log('1. ✅ ScrapingDog API artıq aktiv və işlək vəziyyətdədir');
    console.log('2. 🔧 RapidAPI key-ini real dəyərlə əvəz edin');
    console.log('3. 🚀 LinkedIn import sistemi indi database-dən API key-ləri avtomatik istifadə edəcək');
    console.log('4. 👨‍💼 Admin paneldən API key-ləri idarə edə bilərsiniz');

  } catch (error) {
    console.error('❌ API keys setup xətası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupWorkingAPIKeys();
