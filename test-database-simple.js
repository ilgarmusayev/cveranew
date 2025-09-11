// Simple database test

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🔍 Testing API Keys Database...\n');

  try {
    // Get all API keys
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        service: true,
        active: true,
        priority: true,
        usageCount: true,
        dailyUsage: true,
        dailyLimit: true,
        createdAt: true
      },
      orderBy: [
        { service: 'asc' },
        { priority: 'asc' }
      ]
    });

    console.log(`📊 Found ${apiKeys.length} API keys in database:\n`);

    apiKeys.forEach((key, index) => {
      console.log(`${index + 1}. Service: ${key.service}`);
      console.log(`   ID: ${key.id}`);
      console.log(`   Active: ${key.active ? '✅' : '❌'}`);
      console.log(`   Priority: ${key.priority}`);
      console.log(`   Usage: ${key.usageCount} total, ${key.dailyUsage}/${key.dailyLimit} today`);
      console.log(`   Created: ${key.createdAt.toLocaleDateString()}\n`);
    });

    // Test getting best key for each service
    const services = ['scrapingdog', 'gemini', 'openai', 'rapidapi', 'linkedin'];
    
    console.log('🎯 Testing best API key selection for each service:\n');
    
    for (const service of services) {
      const bestKey = await prisma.apiKey.findFirst({
        where: {
          service: service,
          active: true,
          dailyUsage: {
            lt: prisma.apiKey.fields.dailyLimit
          }
        },
        orderBy: [
          { priority: 'asc' },
          { usageCount: 'asc' }
        ]
      });

      if (bestKey) {
        console.log(`✅ ${service.toUpperCase()}: API key found (Priority: ${bestKey.priority})`);
      } else {
        console.log(`❌ ${service.toUpperCase()}: No available API key`);
      }
    }

    console.log('\n🚀 System ready! Admin can manage keys at /sistem/api-keys');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
