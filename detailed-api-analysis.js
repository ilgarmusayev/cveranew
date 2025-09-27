const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function detailedApiAnalysis() {
  console.log('🔍 Ətraflı API Təhlili...\n');
  
  try {
    // Bütün API açarlarının ümumi statistikası
    const allApiKeys = await prisma.apiKey.findMany();
    
    console.log('📊 Bütün API Açarları:');
    console.log('='.repeat(60));
    
    let totalUsageAllTime = 0;
    let totalDailyUsage = 0;
    let geminiTotal = 0;
    let scrapingdogTotal = 0;
    
    allApiKeys.forEach(key => {
      totalUsageAllTime += key.usageCount;
      totalDailyUsage += key.dailyUsage;
      
      if (key.service === 'gemini') {
        geminiTotal += key.usageCount;
      } else if (key.service === 'scrapingdog') {
        scrapingdogTotal += key.usageCount;
      }
    });
    
    console.log(`🔥 ÜMUMİ İSTİFADƏ (Bütün zamanlar): ${totalUsageAllTime}`);
    console.log(`📅 ÜMUMİ GÜNLÜK İSTİFADƏ: ${totalDailyUsage}`);
    console.log(`🤖 Gemini ümumi: ${geminiTotal}`);
    console.log(`🕷️  ScrapingDog ümumi: ${scrapingdogTotal}`);
    
    // Ən çox istifadə edilən açarlar
    console.log('\n🏆 Ən Çox İstifadə Edilən API Açarları:');
    console.log('='.repeat(60));
    
    const topUsedKeys = allApiKeys
      .filter(key => key.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);
    
    topUsedKeys.forEach((key, index) => {
      console.log(`${index + 1}. ${key.service} - ${key.usageCount} istifadə (günlük: ${key.dailyUsage})`);
      console.log(`   Son istifadə: ${key.lastUsed}`);
      console.log(`   Active: ${key.active}`);
    });
    
    // Suspicious patterns yoxla
    console.log('\n🚨 ŞÜBHƏLİ NÜMUNƏLƏR:');
    console.log('='.repeat(60));
    
    const suspiciousKeys = allApiKeys.filter(key => 
      key.dailyUsage > 100 || // Günlük 100-dən çox
      (key.usageCount > 0 && key.dailyUsage === key.usageCount) // Bütün istifadə bugündür
    );
    
    if (suspiciousKeys.length > 0) {
      console.log('⚠️  Yüksək istifadəli açarlar:');
      suspiciousKeys.forEach(key => {
        console.log(`  - ${key.service}: ${key.dailyUsage} günlük, ${key.usageCount} ümumi`);
        console.log(`    Sonuncu: ${key.lastUsed}`);
        console.log(`    Nəticə: ${key.lastResult}`);
      });
    } else {
      console.log('✅ Şübhəli nümunə tapılmadı');
    }
    
    // Son 7 günün statistikası
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyActiveKeys = allApiKeys.filter(key => 
      key.lastUsed && key.lastUsed >= sevenDaysAgo
    );
    
    console.log('\n📈 Son 7 Gün Aktiv API Açarları:');
    console.log('='.repeat(60));
    console.log(`Aktiv açar sayı: ${weeklyActiveKeys.length}`);
    
    // Error rate analizi
    const errorKeys = allApiKeys.filter(key => 
      key.lastResult && key.lastResult.includes('error')
    );
    
    console.log('\n❌ XƏTA ANALİZİ:');
    console.log('='.repeat(60));
    console.log(`Xətalı API açarları: ${errorKeys.length}`);
    
    if (errorKeys.length > 0) {
      console.log('Xətalı açarlar:');
      errorKeys.forEach(key => {
        console.log(`  - ${key.service}: ${key.lastResult} (${key.usageCount} istifadə)`);
      });
    }
    
    // Rate limiting yoxlanışı
    console.log('\n⏱️  RATE LIMITING VƏZİYYƏTİ:');
    console.log('='.repeat(60));
    
    const nearLimitKeys = allApiKeys.filter(key => 
      key.dailyUsage > (key.dailyLimit * 0.5)
    );
    
    if (nearLimitKeys.length > 0) {
      console.log('Limit yaxınında olan açarlar:');
      nearLimitKeys.forEach(key => {
        const percentage = Math.round((key.dailyUsage / key.dailyLimit) * 100);
        console.log(`  - ${key.service}: ${key.dailyUsage}/${key.dailyLimit} (${percentage}%)`);
      });
    } else {
      console.log('✅ Bütün açarlar limit daxilindədir');
    }
    
  } catch (error) {
    console.error('❌ Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

detailedApiAnalysis();