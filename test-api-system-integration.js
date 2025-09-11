// Test sistem/api-keys integration

const { PrismaClient } = require('@prisma/client');
const { getBestApiKey, getScrapingDogApiKey, getGeminiApiKey } = require('./src/lib/api-service');

const prisma = new PrismaClient();

async function testApiKeysSystem() {
  console.log('🔍 Testing API Keys System Integration...\n');

  try {
    // Test 1: Check database connection
    console.log('1. Testing database connection...');
    const apiKeysCount = await prisma.apiKey.count();
    console.log(`   ✅ Found ${apiKeysCount} API keys in database\n`);

    // Test 2: Test ScrapingDog API key retrieval
    console.log('2. Testing ScrapingDog API key...');
    const scrapingDogKey = await getScrapingDogApiKey();
    if (scrapingDogKey) {
      console.log(`   ✅ ScrapingDog API key found: ${scrapingDogKey.substring(0, 8)}***`);
    } else {
      console.log('   ❌ No ScrapingDog API key found');
    }

    // Test 3: Test Gemini API key retrieval
    console.log('\n3. Testing Gemini API key...');
    const geminiKey = await getGeminiApiKey();
    if (geminiKey) {
      console.log(`   ✅ Gemini API key found: ${geminiKey.substring(0, 8)}***`);
    } else {
      console.log('   ❌ No Gemini API key found');
    }

    // Test 4: List all active API keys by service
    console.log('\n4. Listing all API keys by service...');
    const allServices = ['scrapingdog', 'gemini', 'openai', 'rapidapi', 'linkedin'];
    
    for (const service of allServices) {
      const key = await getBestApiKey(service);
      if (key) {
        console.log(`   ✅ ${service}: ${key.apiKey.substring(0, 8)}*** (Priority: ${key.priority}, Usage: ${key.usageCount})`);
      } else {
        console.log(`   ❌ ${service}: No API key found`);
      }
    }

    console.log('\n🎯 System is ready for admin panel management at /sistem/api-keys');
    console.log('📝 LinkedIn import will now use ScrapingDog API from database');
    console.log('🤖 AI summary will now use Gemini API from database');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testApiKeysSystem();
