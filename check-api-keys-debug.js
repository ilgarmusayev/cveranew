const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApiKeys() {
  try {
    console.log('🔍 Checking API keys in database...');

    // Check all API keys
    const allKeys = await prisma.apiKey.findMany();
    console.log('📊 All API keys:', allKeys.map(key => ({
      id: key.id,
      service: key.service,
      active: key.active,
      apiKey: key.apiKey.substring(0, 10) + '...'
    })));

    // Check specifically for ScrapingDog
    const scrapingDogKeys = await prisma.apiKey.findMany({
      where: { service: 'scrapingdog' }
    });
    console.log('🐕 ScrapingDog keys:', scrapingDogKeys);

    // Check for other possible service names
    const possibleServices = ['scrapingdog', 'scraping-dog', 'linkedin', 'scraper'];
    for (const service of possibleServices) {
      const keys = await prisma.apiKey.findMany({
        where: { service: service }
      });
      if (keys.length > 0) {
        console.log(`🎯 Found keys for service "${service}":`, keys.length);
      }
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiKeys();
