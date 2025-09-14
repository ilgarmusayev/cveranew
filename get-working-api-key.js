/**
 * Get Working ScrapingDog API Key for Testing
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getWorkingApiKey() {
  try {
    // Get ScrapingDog API keys with success status
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        service: 'scrapingdog',
        active: true,
        OR: [
          { lastResult: { contains: 'success' } },
          { lastResult: null }
        ]
      },
      orderBy: {
        priority: 'asc'
      },
      select: {
        id: true,
        apiKey: true,
        usageCount: true,
        lastResult: true
      }
    });

    console.log('📊 Available ScrapingDog API Keys:');
    apiKeys.forEach((key, index) => {
      const keyDisplay = key.apiKey.substring(0, 8) + '...' + key.apiKey.substring(key.apiKey.length - 4);
      console.log(`${index + 1}. ${keyDisplay} - Usage: ${key.usageCount} - Last: ${key.lastResult || 'N/A'}`);
    });

    if (apiKeys.length > 0) {
      console.log(`\n🔑 Using first available key: ${apiKeys[0].apiKey}`);
      return apiKeys[0].apiKey;
    } else {
      console.log('❌ No working API keys found');
      return null;
    }

  } catch (error) {
    console.error('❌ Error getting API keys:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

getWorkingApiKey().then(key => {
  if (key) {
    console.log('\n✅ Key for testing:', key);
  }
});
