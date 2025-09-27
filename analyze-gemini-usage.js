const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeGeminiUsage() {
  console.log('🔍 Gemini API İstifadə Analizi...\n');
  
  try {
    // Gemini API keys
    const geminiKeys = await prisma.apiKey.findMany({
      where: { service: 'gemini' },
      orderBy: { priority: 'asc' }
    });
    
    console.log('📊 Gemini API Açarları:');
    console.log('='.repeat(60));
    
    let totalGeminiUsage = 0;
    let activeGeminiKeys = 0;
    
    geminiKeys.forEach((key, index) => {
      console.log(`${index + 1}. API Key ID: ${key.id}`);
      console.log(`   Daily Usage: ${key.dailyUsage}/${key.dailyLimit}`);
      console.log(`   Total Usage: ${key.usageCount}`);
      console.log(`   Active: ${key.active}`);
      console.log(`   Priority: ${key.priority}`);
      console.log(`   Last Used: ${key.lastUsed}`);
      console.log(`   Last Result: ${key.lastResult}`);
      console.log(`   Key (masked): ${key.apiKey.substring(0, 10)}...${key.apiKey.substring(key.apiKey.length - 5)}`);
      console.log('   ' + '-'.repeat(50));
      
      totalGeminiUsage += key.dailyUsage;
      if (key.active) activeGeminiKeys++;
    });
    
    console.log(`\n📈 ÖZET:`);
    console.log(`Ümumi Gemini açarları: ${geminiKeys.length}`);
    console.log(`Aktiv açarlar: ${activeGeminiKeys}`);
    console.log(`Ümumi günlük istifadə: ${totalGeminiUsage}`);
    
    // High usage keys
    const highUsageKeys = geminiKeys.filter(key => key.dailyUsage > 20);
    if (highUsageKeys.length > 0) {
      console.log(`\n🚨 Yüksək İstifadəli Açarlar:`);
      highUsageKeys.forEach(key => {
        const percentage = Math.round((key.dailyUsage / key.dailyLimit) * 100);
        console.log(`   - ID: ${key.id} - ${key.dailyUsage}/${key.dailyLimit} (${percentage}%)`);
      });
    }
    
    // Quota exceeded analysis
    console.log(`\n🔍 QUOTA ANALİZİ:`);
    
    const quotaExceededKeys = geminiKeys.filter(key => 
      key.lastResult && key.lastResult.includes('quota') || 
      key.lastResult && key.lastResult.includes('429') ||
      key.dailyUsage >= key.dailyLimit
    );
    
    if (quotaExceededKeys.length > 0) {
      console.log(`❌ Quota aşılmış açarlar: ${quotaExceededKeys.length}`);
      quotaExceededKeys.forEach(key => {
        console.log(`   - ID: ${key.id} - ${key.dailyUsage}/${key.dailyLimit}`);
        console.log(`     Last Result: ${key.lastResult}`);
      });
    } else {
      console.log(`✅ Heç bir açarda quota problemi yoxdur`);
    }
    
    // Model analysis
    console.log(`\n🤖 MODEL İSTİFADƏ ANALİZİ:`);
    console.log(`Current model: gemini-1.5-flash (updated)`);
    console.log(`Previous model: gemini-pro-latest (quota exceeded)`);
    console.log(`Flash model benefits:`);
    console.log(`   - Higher rate limits`);
    console.log(`   - Better performance`);
    console.log(`   - Lower latency`);
    
    // Check if we have working keys
    const workingKeys = geminiKeys.filter(key => 
      key.active && 
      key.dailyUsage < key.dailyLimit * 0.9 &&
      (!key.lastResult || !key.lastResult.includes('error'))
    );
    
    console.log(`\n✅ İşlək Açarlar: ${workingKeys.length}`);
    if (workingKeys.length > 0) {
      console.log(`En yaxşı seçim:`);
      const bestKey = workingKeys[0];
      console.log(`   - ID: ${bestKey.id}`);
      console.log(`   - Usage: ${bestKey.dailyUsage}/${bestKey.dailyLimit}`);
      console.log(`   - Priority: ${bestKey.priority}`);
    }
    
    // Recommendations
    console.log(`\n💡 TÖVSİYƏLƏR:`);
    if (totalGeminiUsage > 100) {
      console.log(`⚠️  Günlük istifadə çox yüksəkdir (${totalGeminiUsage})`);
      console.log(`   - Rate limiting aktivdir (AI Services: 10 req/5min)`);
      console.log(`   - Daha çox API key əlavə edin`);
    }
    
    if (activeGeminiKeys < 2) {
      console.log(`⚠️  Az sayda aktiv açar (${activeGeminiKeys})`);
      console.log(`   - Backup açarlar əlavə edin`);
    }
    
    if (quotaExceededKeys.length > 0) {
      console.log(`🔧 Quota problemi həlli:`);
      console.log(`   - Flash model istifadə edilir (daha yüksək limit)`);
      console.log(`   - API key rotation avtomatikdir`);
      console.log(`   - Rate limiting tətbiq edilir`);
    }
    
  } catch (error) {
    console.error('❌ Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeGeminiUsage();