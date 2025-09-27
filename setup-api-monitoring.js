const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupApiMonitoring() {
  console.log('🔧 API Monitoring Sistemini Qurur...\n');
  
  try {
    // Daily usage reset funksiyası (cron job üçün)
    console.log('📋 1. Daily Usage Reset Function');
    console.log('   - Bütün API açarlarının dailyUsage değərini 0 edir');
    console.log('   - Hər gün saat 00:00-da çalışmalıdır');
    
    // API monitoring cədvəli yarat (əgər yoxdursa)
    console.log('\n📋 2. API Request Log Cədvəli Yaradır...');
    
    // Bu SQL-i manualy çalışdırmaq lazımdır
    const createLogTableSQL = `
    CREATE TABLE IF NOT EXISTS api_request_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      endpoint VARCHAR(255) NOT NULL,
      method VARCHAR(10) NOT NULL,
      ip_address VARCHAR(45),
      user_id UUID,
      status_code INTEGER,
      response_time INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_agent TEXT,
      error_message TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_request_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_request_logs(endpoint);
    CREATE INDEX IF NOT EXISTS idx_api_logs_ip ON api_request_logs(ip_address);
    CREATE INDEX IF NOT EXISTS idx_api_logs_user ON api_request_logs(user_id);
    `;
    
    console.log('SQL yaradılmalı cədvəl:');
    console.log(createLogTableSQL);
    
    // Real-time API monitoring
    console.log('\n📋 3. Real-time API Monitoring');
    console.log('   - Hər API request log edilir');
    console.log('   - Rate limiting tətbiq edilir');
    console.log('   - Şübhəli fəaliyyət aşkar edilir');
    
    // API key performans check
    console.log('\n📋 4. API Key Performans Yoxlanışı');
    const problemKeys = await prisma.apiKey.findMany({
      where: {
        OR: [
          { dailyUsage: { gt: 500 } }, // Günlük 500-dən çox
          { lastResult: { contains: 'error' } }, // Son sorğu xətalı
          { active: false } // Deaktiv
        ]
      }
    });
    
    if (problemKeys.length > 0) {
      console.log('❌ Problemli API Açarları:');
      problemKeys.forEach(key => {
        console.log(`   - ${key.service}: ${key.dailyUsage}/${key.dailyLimit} (${key.active ? 'Aktiv' : 'Deaktiv'}) - ${key.lastResult}`);
      });
    } else {
      console.log('✅ Bütün API açarları normaldır');
    }
    
    // Rate limiting konfiqurasiyası
    console.log('\n📋 5. Rate Limiting Konfiqurasiyası');
    console.log('   - Cover Letter: 3 sorğu / 10 dəqiqə');
    console.log('   - CV Generation: 5 sorğu / 15 dəqiqə');
    console.log('   - LinkedIn Import: 2 sorğu / 1 saat');
    console.log('   - AI Services: 10 sorğu / 5 dəqiqə');
    console.log('   - General: 30 sorğu / 1 dəqiqə');
    
    // Suspicious activity detection
    console.log('\n📋 6. Şübhəli Fəaliyyət Aşkarlanması');
    console.log('   - IP başına saatda 100+ sorğu');
    console.log('   - User başına saatda 50+ sorğu');
    console.log('   - Eyni endpoint-ə ardıcıl xətalı sorğular');
    console.log('   - Bot pattern detection');
    
    // Təklif edilən həllər
    console.log('\n🎯 TƏKLİF EDİLƏN HƏLLƏR:');
    console.log('   1. Rate limiting aktivləşdir (hazır)');
    console.log('   2. API key rotation sistemi');
    console.log('   3. Daily usage reset cron job');
    console.log('   4. Real-time monitoring dashboard');
    console.log('   5. Alert system (email/slack)');
    console.log('   6. IP blacklisting');
    console.log('   7. User behavior analysis');
    
    // Immediate actions
    console.log('\n⚡ TƏCİLİ TƏDBİRLƏR:');
    console.log('   1. Rate limiting deploy et');
    console.log('   2. API key limitlərini azalt');
    console.log('   3. Daily usage-ı reset et');
    console.log('   4. Şübhəli IP-ləri block et');
    
  } catch (error) {
    console.error('❌ Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupApiMonitoring();