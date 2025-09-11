// Simple test without TypeScript compilation
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simple version of getBestApiKey function
async function getBestApiKey(service) {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        service: service,
        active: true,
        dailyUsage: {
          lt: prisma.apiKey.fields.dailyLimit
        }
      },
      orderBy: [
        { priority: 'asc' },
        { usageCount: 'asc' },
        { lastUsed: 'asc' }
      ]
    });

    return apiKeys.length > 0 ? apiKeys[0] : null;
  } catch (error) {
    console.error(`Error fetching API keys for ${service}:`, error);
    return null;
  }
}

// Simple version of getScrapingDogApiKey
async function getScrapingDogApiKey() {
  const apiKey = await getBestApiKey('scrapingdog');
  return apiKey?.apiKey || null;
}

// Simple version of getGeminiApiKey
async function getGeminiApiKey() {
  const apiKey = await getBestApiKey('gemini');
  return apiKey?.apiKey || null;
}

async function testApiService() {
  try {
    console.log('🧪 Testing API Service Library...\n');
    
    // Test ScrapingDog API key
    console.log('1️⃣ Testing ScrapingDog API key:');
    const scrapingDogKey = await getScrapingDogApiKey();
    console.log(`   Result: ${scrapingDogKey ? '✅ Found' : '❌ Not found'}`);
    if (scrapingDogKey) {
      console.log(`   Key: ${scrapingDogKey.substring(0, 10)}...`);
    }
    
    // Test Gemini API key
    console.log('\n2️⃣ Testing Gemini API key:');
    const geminiKey = await getGeminiApiKey();
    console.log(`   Result: ${geminiKey ? '✅ Found' : '❌ Not found'}`);
    if (geminiKey) {
      console.log(`   Key: ${geminiKey.substring(0, 10)}...`);
    }
    
    // Test getBestApiKey for specific services
    console.log('\n3️⃣ Testing getBestApiKey for services:');
    
    const scrapingDogInfo = await getBestApiKey('scrapingdog');
    console.log(`   ScrapingDog: ${scrapingDogInfo ? '✅ Found' : '❌ Not found'}`);
    if (scrapingDogInfo) {
      console.log(`     ID: ${scrapingDogInfo.id}`);
      console.log(`     Priority: ${scrapingDogInfo.priority}`);
      console.log(`     Usage: ${scrapingDogInfo.usageCount}/${scrapingDogInfo.dailyLimit}`);
      console.log(`     Daily Usage: ${scrapingDogInfo.dailyUsage}/${scrapingDogInfo.dailyLimit}`);
    }
    
    const geminiInfo = await getBestApiKey('gemini');
    console.log(`   Gemini: ${geminiInfo ? '✅ Found' : '❌ Not found'}`);
    if (geminiInfo) {
      console.log(`     ID: ${geminiInfo.id}`);
      console.log(`     Priority: ${geminiInfo.priority}`);
      console.log(`     Usage: ${geminiInfo.usageCount}/${geminiInfo.dailyLimit}`);
      console.log(`     Daily Usage: ${geminiInfo.dailyUsage}/${geminiInfo.dailyLimit}`);
    }
    
    console.log('\n🎉 API Service tests completed!');
    
  } catch (error) {
    console.error('❌ API Service test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiService();
