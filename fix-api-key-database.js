const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addWorkingApiKey() {
  try {
    console.log('🔧 Adding your working ScrapingDog API key...');

    const workingKey = '68878f54f5cc644b92ec13d6';

    // First, delete any existing scrapingdog keys to avoid conflicts
    await prisma.apiKey.deleteMany({
      where: { service: 'scrapingdog' }
    });

    // Add your working key
    const newKey = await prisma.apiKey.create({
      data: {
        service: 'scrapingdog',
        apiKey: workingKey,
        active: true,
        priority: 1,
        dailyLimit: 1000,
        dailyUsage: 0,
        usageCount: 0,
        lastReset: new Date()
      }
    });

    console.log('✅ Successfully added working API key:', newKey.id);

    // Verify it works with a test call
    const axios = require('axios');
    const url = 'https://api.scrapingdog.com/linkedin';

    const params = {
      api_key: workingKey,
      type: 'profile',
      linkId: 'musayevcreate',
      premium: 'false',
    };

    console.log('🧪 Testing API key...');

    try {
      const response = await axios.get(url, { params: params, timeout: 10000 });
      if (response.status === 200) {
        console.log('✅ API key test successful! Data received.');
        console.log('🎯 Profile name:', response.data?.full_name || response.data?.name || 'Data available');
      }
    } catch (testError) {
      console.log('⚠️ API key test failed:', testError.message);
      if (testError.response?.status) {
        console.log('Status:', testError.response.status);
      }
    }

    // List all current API keys
    const allKeys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log('📋 Current API keys in database:');
    allKeys.forEach((key, index) => {
      console.log(`${index + 1}. ${key.service}: ${key.apiKey.substring(0, 8)}*** - ${key.active ? 'ACTIVE' : 'INACTIVE'} (Priority: ${key.priority})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addWorkingApiKey();
