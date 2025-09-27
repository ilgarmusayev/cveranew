const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDailyUsage() {
  console.log('🔄 Günlük API istifadə sayğaclarını sıfırlayır...\n');
  
  try {
    const result = await prisma.apiKey.updateMany({
      data: {
        dailyUsage: 0
      }
    });
    
    console.log(`✅ ${result.count} API açarının günlük istifadəsi sıfırlandı`);
    
    console.log('\n📊 Yenilənmiş API Açarları:');
    console.log('='.repeat(50));
    
    const updatedKeys = await prisma.apiKey.findMany({
      select: {
        service: true,
        active: true,
        dailyUsage: true,
        dailyLimit: true,
        usageCount: true
      },
      orderBy: { service: 'asc' }
    });
    
    updatedKeys.forEach(key => {
      console.log(`${key.service}: ${key.dailyUsage}/${key.dailyLimit} (Ümumi: ${key.usageCount}) - ${key.active ? 'Aktiv' : 'Deaktiv'}`);
    });
    
  } catch (error) {
    console.error('❌ Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDailyUsage();