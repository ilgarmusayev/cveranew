const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkApiKeys() {
  try {
    console.log('🔍 Checking API Keys table...');
    
    // Check if API Keys table exists and get all records
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: [
        { service: 'asc' },
        { priority: 'asc' }
      ]
    });
    
    console.log(`📊 Found ${apiKeys.length} API keys in database:`);
    
    if (apiKeys.length > 0) {
      console.table(apiKeys.map(key => ({
        id: key.id,
        service: key.service,
        active: key.active,
        priority: key.priority,
        usageCount: key.usageCount,
        dailyLimit: key.dailyLimit,
        dailyUsage: key.dailyUsage,
        lastUsed: key.lastUsed,
        lastResult: key.lastResult?.substring(0, 50) + '...',
        createdAt: key.createdAt
      })));
    } else {
      console.log('📝 No API keys found. The table is empty.');
    }
    
    // Get unique services
    const services = await prisma.apiKey.groupBy({
      by: ['service'],
      _count: {
        service: true
      }
    });
    
    console.log('\n📈 Services summary:');
    services.forEach(service => {
      console.log(`  - ${service.service}: ${service._count.service} keys`);
    });
    
    // Check active keys only
    const activeKeys = await prisma.apiKey.findMany({
      where: { active: true },
      select: {
        service: true,
        priority: true,
        usageCount: true,
        dailyUsage: true,
        dailyLimit: true
      }
    });
    
    console.log(`\n✅ Active API keys: ${activeKeys.length}`);
    
  } catch (error) {
    console.error('❌ Error checking API keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiKeys();
