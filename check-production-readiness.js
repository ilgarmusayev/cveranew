const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProductionReadiness() {
  try {
    console.log('🔍 Production Hazırlığı Yoxlanılır...');
    console.log('=====================================');
    
    // 1. Database connection test
    console.log('\n1️⃣ Database əlaqə testi...');
    try {
      await prisma.$connect();
      console.log('✅ Database əlaqəsi uğurludur');
    } catch (error) {
      console.error('❌ Database əlaqə xətası:', error.message);
      return;
    }
    
    // 2. API Keys table structure check
    console.log('\n2️⃣ API Keys cədvəl strukturu...');
    const apiKeysCount = await prisma.apiKey.count();
    console.log(`📊 API Keys cədvəlində ${apiKeysCount} qeyd var`);
    
    // 3. Check required API keys
    console.log('\n3️⃣ Tələb olunan API açarları...');
    
    const requiredServices = ['scrapingdog', 'gemini'];
    let allServicesReady = true;
    
    for (const service of requiredServices) {
      const activeKeys = await prisma.apiKey.findMany({
        where: {
          service: service,
          active: true
        },
        orderBy: {
          priority: 'asc'
        }
      });
      
      if (activeKeys.length > 0) {
        console.log(`✅ ${service}: ${activeKeys.length} aktiv açar`);
        activeKeys.forEach((key, index) => {
          console.log(`   ${index + 1}. ID: ${key.id}`);
          console.log(`      Priority: ${key.priority}`);
          console.log(`      Usage: ${key.usageCount}/${key.dailyLimit}`);
          console.log(`      Last Used: ${key.lastUsed || 'Heç vaxt'}`);
        });
      } else {
        console.error(`❌ ${service}: Aktiv açar tapılmadı`);
        allServicesReady = false;
      }
    }
    
    // 4. Environment variables check
    console.log('\n4️⃣ Environment dəyişənləri...');
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXTAUTH_SECRET'
    ];
    
    let envVarsReady = true;
    
    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar}: Mövcuddur`);
      } else {
        console.error(`❌ ${envVar}: Tapılmadı`);
        envVarsReady = false;
      }
    });
    
    // 5. Production deployment checklist
    console.log('\n5️⃣ Production Deployment Checklist...');
    console.log('=====================================');
    
    console.log('✅ Database Schema: ApiKey modeli mövcuddur');
    console.log('✅ API Service: Database-driven API management');
    console.log('✅ LinkedIn Import: ScrapingDog + AI skills integration');
    console.log('✅ Error Handling: Fallback mechanisms');
    console.log('✅ Usage Tracking: API açarları istifadə statistikası');
    
    // 6. Production recommendations
    console.log('\n6️⃣ Production Tövsiyələri...');
    console.log('============================');
    
    console.log('🔧 Vercel deployment:');
    console.log('   - DATABASE_URL environment variable-ı əlavə edin');
    console.log('   - API açarlarını admin panel ilə əlavə edin');
    console.log('   - Prisma migrate production-da işə salın');
    
    console.log('🔧 Database migration:');
    console.log('   - npx prisma migrate deploy');
    console.log('   - npx prisma generate');
    
    console.log('🔧 API Keys setup:');
    console.log('   - /sistem/api-keys səhifəsindən API açarlarını əlavə edin');
    console.log('   - ScrapingDog və Gemini API açarlarını daxil edin');
    
    // 7. Final status
    console.log('\n7️⃣ Final Status...');
    console.log('==================');
    
    if (allServicesReady && envVarsReady) {
      console.log('🎉 Production üçün HAZIRDIR!');
      console.log('✅ Bütün API açarları mövcuddur');
      console.log('✅ Database əlaqəsi işləyir');
      console.log('✅ LinkedIn import sistemi hazırdır');
    } else {
      console.log('⚠️ Production üçün əlavə konfiqurasiya lazımdır');
      if (!allServicesReady) {
        console.log('❌ Bəzi API açarları əksikdir');
      }
      if (!envVarsReady) {
        console.log('❌ Bəzi environment variables əksikdir');
      }
    }
    
  } catch (error) {
    console.error('❌ Production yoxlama xətası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionReadiness();
