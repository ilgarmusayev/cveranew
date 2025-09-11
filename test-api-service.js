const { getScrapingDogApiKey, getGeminiApiKey, getBestApiKey, recordApiUsage } = require('./src/lib/api-service.ts');

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
    }
    
    const geminiInfo = await getBestApiKey('gemini');
    console.log(`   Gemini: ${geminiInfo ? '✅ Found' : '❌ Not found'}`);
    if (geminiInfo) {
      console.log(`     ID: ${geminiInfo.id}`);
      console.log(`     Priority: ${geminiInfo.priority}`);
      console.log(`     Usage: ${geminiInfo.usageCount}/${geminiInfo.dailyLimit}`);
    }
    
    // Test recording API usage
    if (scrapingDogInfo) {
      console.log('\n4️⃣ Testing API usage recording:');
      await recordApiUsage(scrapingDogInfo.id, true, 'Test usage from API service test');
      console.log('   ✅ Usage recorded successfully');
    }
    
    console.log('\n🎉 API Service tests completed!');
    
  } catch (error) {
    console.error('❌ API Service test error:', error);
  }
}

testApiService();
