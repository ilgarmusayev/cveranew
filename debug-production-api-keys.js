// Production debug script
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugProductionApiKeys() {
  try {
    console.log('🔍 Checking production API keys...');

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        service: 'scrapingdog'
      },
      orderBy: {
        priority: 'asc'
      }
    });

    console.log(`📊 Found ${apiKeys.length} ScrapingDog API keys in production database:`);

    for (const key of apiKeys) {
      console.log(`\n🔑 API Key: ${key.apiKey.substring(0, 8)}***`);
      console.log(`   Active: ${key.active}`);
      console.log(`   Priority: ${key.priority}`);
      console.log(`   Usage Count: ${key.usageCount}`);
      console.log(`   Daily Usage: ${key.dailyUsage}`);
      console.log(`   Last Result: ${key.lastResult || 'No usage yet'}`);
      console.log(`   Last Used: ${key.lastUsed || 'Never used'}`);

      // Test this API key
      if (key.active) {
        console.log(`\n🧪 Testing API key: ${key.apiKey.substring(0, 8)}***`);

        const axios = require('axios');
        try {
          const response = await axios.get('https://api.scrapingdog.com/linkedin', {
            params: {
              api_key: key.apiKey,
              type: 'profile',
              linkId: 'khalidbabasoy',
              premium: 'false',
            },
            timeout: 15000
          });

          if (response.status === 200) {
            console.log(`✅ API key works! Status: ${response.status}`);
            const data = Array.isArray(response.data) ? response.data[0] : response.data;
            console.log(`👤 Profile found: ${data?.first_name} ${data?.last_name}`);
          }
        } catch (apiError) {
          console.log(`❌ API key failed: ${apiError.response?.status} - ${apiError.message}`);
        }
      }
    }

    // Check environment variables
    console.log('\n🌍 Environment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

  } catch (error) {
    console.error('❌ Error checking production API keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProductionApiKeys();
