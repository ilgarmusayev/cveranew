const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedApiKeys() {
  try {
    console.log('🔑 Adding ScrapingDog API key to database...');

    // Add the ScrapingDog API key from the instructions
    const apiKey = await prisma.apiKey.upsert({
      where: {
        service_apiKey: {
          service: 'linkedin',
          apiKey: '6882894b855f5678d36484c8'
        }
      },
      update: {
        active: true,
        priority: 1,
        dailyLimit: 1000,
        dailyUsage: 0,
        lastReset: new Date()
      },
      create: {
        service: 'linkedin',
        apiKey: '6882894b855f5678d36484c8',
        active: true,
        priority: 1,
        usageCount: 0,
        dailyLimit: 1000,
        dailyUsage: 0,
        lastReset: new Date()
      }
    });

    console.log('✅ API key added successfully:', {
      id: apiKey.id,
      service: apiKey.service,
      active: apiKey.active,
      priority: apiKey.priority
    });

  } catch (error) {
    console.error('❌ Error seeding API keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedApiKeys();
