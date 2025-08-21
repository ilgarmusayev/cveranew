const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedAPIKeys() {
  try {
    console.log('🔧 API açarları sistemə əlavə edilir...');

    // Mövcud API açarlarını yoxla
    const existingKeys = await prisma.apiKey.findMany();
    console.log(`📊 Hazırda ${existingKeys.length} API açar mövcuddur`);

    // ScrapingDog və RapidAPI açarlarını əlavə et
    const apiKeysToAdd = [
      {
        serviceName: 'scrapingdog_linkedin',
        apiKey: '6882894b855f5678d36484c8',
        apiUrl: 'https://api.scrapingdog.com/linkedin',
        isActive: true,
        dailyLimit: 1000,
        currentUsage: 0,
        notes: 'LinkedIn profil məlumatlarını ScrapingDog vasitəsilə əldə etmək üçün',
        createdBy: 'system'
      },
      {
        serviceName: 'rapidapi_linkedin',
        apiKey: 'your_rapidapi_key_here', // Bu dəyəri real API açarı ilə əvəz edin
        apiUrl: 'https://linkedin-api.rapidapi.com',
        isActive: false, // Real açar əlavə edilənə qədər deaktiv
        dailyLimit: 500,
        currentUsage: 0,
        notes: 'LinkedIn API RapidAPI vasitəsilə - yedək sistem',
        createdBy: 'system'
      }
    ];

    for (const apiKeyData of apiKeysToAdd) {
      try {
        // Mövcud açarı yoxla
        const existing = await prisma.apiKey.findUnique({
          where: { serviceName: apiKeyData.serviceName }
        });

        if (existing) {
          console.log(`ℹ️ ${apiKeyData.serviceName} artıq mövcuddur, yenilənir...`);
          await prisma.apiKey.update({
            where: { serviceName: apiKeyData.serviceName },
            data: {
              apiKey: apiKeyData.apiKey,
              apiUrl: apiKeyData.apiUrl,
              isActive: apiKeyData.isActive,
              dailyLimit: apiKeyData.dailyLimit,
              notes: apiKeyData.notes,
              updatedAt: new Date()
            }
          });
        } else {
          console.log(`➕ ${apiKeyData.serviceName} əlavə edilir...`);
          await prisma.apiKey.create({
            data: apiKeyData
          });
        }

        console.log(`✅ ${apiKeyData.serviceName} uğurla konfiqurasiya edildi`);
      } catch (error) {
        console.error(`❌ ${apiKeyData.serviceName} əlavə edilərkən xəta:`, error.message);
      }
    }

    // Final vəziyyəti göstər
    const finalKeys = await prisma.apiKey.findMany({
      select: {
        serviceName: true,
        isActive: true,
        dailyLimit: true,
        currentUsage: true
      }
    });

    console.log('\n📋 API Açarlarının Final Vəziyyəti:');
    finalKeys.forEach(key => {
      console.log(`  🔑 ${key.serviceName}: ${key.isActive ? '✅ Aktiv' : '❌ Deaktiv'} - ${key.currentUsage}/${key.dailyLimit || '∞'} istifadə`);
    });

    console.log('\n🎉 API açarları uğurla konfiqurasiya edildi!');
    console.log('\n📌 Növbəti addımlar:');
    console.log('1. RapidAPI açarını real dəyərlə əvəz edin');
    console.log('2. Admin panelindən API açarlarını idarə edin');
    console.log('3. LinkedIn import funksiyası artıq database-dən API açarları istifadə edəcək');

  } catch (error) {
    console.error('❌ API açarları seed edilərkən xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Script-i birbaşa çalışdırdıqda işə sal
if (require.main === module) {
  seedAPIKeys();
}

module.exports = { seedAPIKeys };
