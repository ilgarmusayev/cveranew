const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupFinalApiSystem() {
  try {
    console.log('🔧 Final API setup - ONLY BrightData + RapidAPI...');

    // 1. BrightData as primary service
    const brightDataKey = await prisma.apiKey.upsert({
      where: {
        service_apiKey: {
          service: 'brightdata',
          apiKey: 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae'
        }
      },
      update: {
        active: true,
        priority: 1,
        dailyLimit: 1000,
        lastResult: 'PRIMARY - LinkedIn profile scraping'
      },
      create: {
        service: 'brightdata',
        apiKey: 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae',
        active: true,
        priority: 1,
        dailyLimit: 1000,
        usageCount: 0,
        dailyUsage: 0,
        lastResult: 'PRIMARY - LinkedIn profile scraping'
      }
    });

    console.log('✅ BrightData configured as primary service');

    // 2. RapidAPI for additional skills
    const rapidApiKey = await prisma.apiKey.upsert({
      where: {
        service_apiKey: {
          service: 'rapidapi',
          apiKey: process.env.RAPIDAPI_KEY || 'e69773e844msh87742c8b4c7b5b8p1a6952jsn123456789abc'
        }
      },
      update: {
        active: true,
        priority: 2,
        dailyLimit: 500,
        lastResult: 'SECONDARY - Additional skills extraction'
      },
      create: {
        service: 'rapidapi',
        apiKey: process.env.RAPIDAPI_KEY || 'e69773e844msh87742c8b4c7b5b8p1a6952jsn123456789abc',
        active: true,
        priority: 2,
        dailyLimit: 500,
        usageCount: 0,
        dailyUsage: 0,
        lastResult: 'SECONDARY - Additional skills extraction'
      }
    });

    console.log('✅ RapidAPI configured for skills extraction');

    // 3. Remove any remaining old services
    await prisma.apiKey.deleteMany({
      where: {
        service: {
          in: ['scrapingdog', 'scrapingdog_linkedin']
        }
      }
    });

    console.log('🗑️ All ScrapingDog services removed');

    // 4. Final verification
    const activeServices = await prisma.apiKey.findMany({
      where: { active: true },
      orderBy: { priority: 'asc' }
    });

    console.log('\n📋 Final API Configuration:');
    activeServices.forEach(service => {
      console.log(`  ${service.priority}. ${service.service.toUpperCase()} - ${service.apiKey.substring(0, 8)}...`);
      console.log(`     Status: ${service.active ? 'ACTIVE' : 'INACTIVE'}`);
      console.log(`     Limit: ${service.dailyLimit}/day`);
      console.log(`     Usage: ${service.usageCount} total, ${service.dailyUsage} today`);
    });

    console.log('\n✅ Final setup complete - BrightData + RapidAPI only!');

  } catch (error) {
    console.error('❌ Setup error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupFinalApiSystem();
