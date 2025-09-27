const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApiUsage() {
  console.log('🔍 API İstifadə Statistikaları Yoxlanılır...\n');
  
  try {
    // API açarlarının cari vəziyyəti
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { service: 'asc' }
    });
    
    console.log('📊 API Açarları Vəziyyəti:');
    console.log('='.repeat(50));
    
    for (const key of apiKeys) {
      console.log(`Service: ${key.service}`);
      console.log(`Active: ${key.active}`);
      console.log(`Daily Usage: ${key.dailyUsage}/${key.dailyLimit}`);
      console.log(`Total Usage: ${key.usageCount}`);
      console.log(`Last Used: ${key.lastUsed}`);
      console.log(`Last Result: ${key.lastResult}`);
      console.log('-'.repeat(30));
    }
    
    // Son 24 saat ərzində API istifadəsi
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentUsage = await prisma.apiKey.findMany({
      where: {
        lastUsed: {
          gte: yesterday
        }
      },
      select: {
        service: true,
        dailyUsage: true,
        usageCount: true,
        lastUsed: true
      }
    });
    
    console.log('\n📈 Son 24 Saat API İstifadəsi:');
    console.log('='.repeat(50));
    
    let totalDailyUsage = 0;
    recentUsage.forEach(usage => {
      console.log(`${usage.service}: ${usage.dailyUsage} istifadə`);
      totalDailyUsage += usage.dailyUsage;
    });
    
    console.log(`\n🚨 ÜMUMI GÜNLük İSTİFADƏ: ${totalDailyUsage}`);
    
    // CV-lər statistikası (API istifadəsini səbəb olacaq əməliyyatlar)
    console.log('\n📋 CV Statistikaları:');
    console.log('='.repeat(50));
    
    const totalCVs = await prisma.cV.count();
    const todayCVs = await prisma.cV.count({
      where: {
        createdAt: {
          gte: yesterday
        }
      }
    });
    
    console.log(`Ümumi CV sayı: ${totalCVs}`);
    console.log(`Bu gün yaradılan CV-lər: ${todayCVs}`);
    
    // Cover Letter statistikası
    console.log('\n📄 Cover Letter Statistikaları:');
    console.log('='.repeat(50));
    
    try {
      const totalCoverLetters = await prisma.coverLetter.count();
      const todayCoverLetters = await prisma.coverLetter.count({
        where: {
          createdAt: {
            gte: yesterday
          }
        }
      });
      
      console.log(`Ümumi Cover Letter sayı: ${totalCoverLetters}`);
      console.log(`Bu gün yaradılan Cover Letter-lər: ${todayCoverLetters}`);
    } catch (error) {
      console.log('Cover Letter cədvəli mövcud deyil');
    }
    
    // İstifadəçi statistikası
    console.log('\n👥 İstifadəçi Statistikaları:');
    console.log('='.repeat(50));
    
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: yesterday
        }
      }
    });
    
    console.log(`Ümumi istifadəçi sayı: ${totalUsers}`);
    console.log(`Aktiv istifadəçilər (24 saat): ${activeUsers}`);
    
    // Problemli vəziyyətləri müəyyən et
    console.log('\n⚠️  Potensial Problemlər:');
    console.log('='.repeat(50));
    
    const problematicKeys = apiKeys.filter(key => 
      key.dailyUsage > (key.dailyLimit * 0.8) // 80%-dən çox istifadə
    );
    
    if (problematicKeys.length > 0) {
      console.log('🔴 Çox istifadə edilən API açarları:');
      problematicKeys.forEach(key => {
        console.log(`  - ${key.service}: ${key.dailyUsage}/${key.dailyLimit} (${Math.round(key.dailyUsage/key.dailyLimit*100)}%)`);
      });
    }
    
    if (totalDailyUsage > 500) {
      console.log('🔴 Günlük API istifadəsi çox yüksəkdir!');
      console.log('   Potensial səbəblər:');
      console.log('   - Loop və ya təkrarlanan sorğular');
      console.log('   - Rate limiting işləmir');
      console.log('   - Bot və ya spam fəaliyyəti');
    }
    
  } catch (error) {
    console.error('❌ Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiUsage();