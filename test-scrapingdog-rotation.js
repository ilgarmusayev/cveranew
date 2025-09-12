const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

// Test the API key rotation system directly
async function testScrapingDogRotation() {
  console.log('🧪 Testing ScrapingDog API Key Rotation System\n');
  
  const prisma = new PrismaClient();
  let currentKeyIndex = 0;
  
  try {
    // Get all active API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        service: 'scrapingdog',
        active: true
      },
      orderBy: {
        priority: 'asc'
      }
    });
    
    console.log(`Found ${apiKeys.length} active API keys for rotation:`);
    apiKeys.forEach((key, index) => {
      console.log(`  ${index + 1}. ${key.apiKey.substring(0, 8)}*** (Priority: ${key.priority})`);
    });
    
    // Test rotation with simple requests
    const testProfile = 'musayevcreate';
    
    for (let i = 0; i < 5; i++) {
      console.log(`\n--- Test ${i + 1} ---`);
      
      // Get next API key using rotation
      const selectedKey = apiKeys[currentKeyIndex];
      console.log(`🔄 Using API key ${currentKeyIndex + 1}/${apiKeys.length}: ${selectedKey.apiKey.substring(0, 8)}***`);
      
      // Move to next key for next request
      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      
      try {
        const params = {
          api_key: selectedKey.apiKey,
          type: 'profile',
          linkId: testProfile,
          premium: 'true'
        };
        
        console.log('📡 Making request...');
        const response = await axios.get('https://api.scrapingdog.com/linkedin', {
          params: params,
          timeout: 15000
        });
        
        if (response.status === 200) {
          console.log(`✅ Success with key ${selectedKey.apiKey.substring(0, 8)}***`);
          console.log(`   Response length: ${JSON.stringify(response.data).length} chars`);
        } else {
          console.log(`❌ Failed with status: ${response.status}`);
        }
        
      } catch (error) {
        console.error(`❌ Error with key ${selectedKey.apiKey.substring(0, 8)}***:`, error.message);
      }
      
      // Small delay between tests
      if (i < 4) {
        console.log('⏳ Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testScrapingDogRotation().catch(console.error);
