const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixApiKey() {
  try {
    console.log('🔧 Fixing Gemini API key wrongly set as ScrapingDog...');

    // Find the Gemini key that's wrongly set as scrapingdog
    const wrongKey = await prisma.apiKey.findFirst({
      where: {
        service: 'scrapingdog',
        apiKey: 'AIzaSyCKWZfMSrfxdrONcjU-Lu7tFfV7xK127jM'
      }
    });

    if (wrongKey) {
      console.log('❌ Found wrong key:', wrongKey.id);
      
      // Option 1: Delete it (recommended since it's wrong service)
      await prisma.apiKey.delete({
        where: { id: wrongKey.id }
      });
      
      console.log('✅ Deleted wrong API key');
      
      // Option 2: Or change service to 'gemini'
      // await prisma.apiKey.update({
      //   where: { id: wrongKey.id },
      //   data: { service: 'gemini' }
      // });
      // console.log('✅ Changed service to gemini');
    } else {
      console.log('No wrong key found');
    }

    // Check current ScrapingDog keys after fix
    const scrapingDogKeys = await prisma.apiKey.findMany({
      where: { 
        service: 'scrapingdog',
        active: true
      },
      orderBy: { priority: 'asc' }
    });

    console.log('🐕 Valid ScrapingDog keys after fix:', scrapingDogKeys.map(k => ({
      id: k.id,
      apiKey: k.apiKey.substring(0, 10) + '...',
      priority: k.priority,
      usageCount: k.usageCount
    })));

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixApiKey();
