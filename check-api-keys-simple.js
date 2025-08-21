const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkApiKeys() {
  try {
    console.log('🔍 Checking ScrapingDog API keys in database...');

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        service: 'scrapingdog'
      },
      orderBy: {
        priority: 'asc'
      }
    });

    console.log(`📊 Found ${apiKeys.length} ScrapingDog API keys:`);

    for (const key of apiKeys) {
      console.log(`\n🔑 API Key: ${key.apiKey.substring(0, 8)}***`);
      console.log(`   Active: ${key.active}`);
      console.log(`   Priority: ${key.priority}`);
      console.log(`   Usage Count: ${key.usageCount}`);
      console.log(`   Daily Usage: ${key.dailyUsage}`);
      console.log(`   Last Result: ${key.lastResult}`);
      console.log(`   Last Used: ${key.lastUsed}`);
    }

    // Find active key
    const activeKey = apiKeys.find(key => key.active);
    if (activeKey) {
      console.log(`\n✅ Active API key: ${activeKey.apiKey.substring(0, 8)}***`);
    } else {
      console.log(`\n❌ No active API key found!`);
    }

  } catch (error) {
    console.error('❌ Error checking API keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiKeys();
