const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testAllScrapingDogKeys() {
  console.log('🔍 Testing All ScrapingDog API Keys');
  console.log('===================================');
  
  try {
    const allKeys = await prisma.apiKey.findMany({
      where: {
        service: 'scrapingdog',
        active: true
      },
      orderBy: { priority: 'asc' }
    });
    
    console.log(`Found ${allKeys.length} active ScrapingDog keys to test`);
    
    let workingKeys = 0;
    
    for (let i = 0; i < allKeys.length; i++) {
      const apiKey = allKeys[i];
      console.log(`\n📡 Testing key ${i+1}/${allKeys.length}: ${apiKey.apiKey.substring(0, 8)}***`);
      
      try {
        // Check account status first
        const accountResponse = await axios.get('https://api.scrapingdog.com/account', {
          params: { api_key: apiKey.apiKey },
          timeout: 10000
        });
        
        const account = accountResponse.data;
        console.log(`✅ Account valid - Pack: ${account.pack} | Used: ${account.requestUsed}/${account.requestLimit}`);
        
        // Check if LinkedIn calls are available
        if (account.pack === 'free') {
          console.log(`⚠️  Free pack - LinkedIn calls may be limited`);
        }
        
        // Try a simple LinkedIn test
        console.log(`🔍 Testing LinkedIn API call...`);
        const testResponse = await axios.get('https://api.scrapingdog.com/linkedin', {
          params: {
            api_key: apiKey.apiKey,
            type: 'profile',
            linkId: 'williamhgates',
            premium: 'false'
          },
          timeout: 15000
        });
        
        console.log(`✅ LinkedIn test successful! Status: ${testResponse.status}`);
        console.log(`✅ Data keys:`, Object.keys(testResponse.data));
        
        workingKeys++;
        
        // Update database record as working
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { 
            lastResult: 'success',
            lastUsed: new Date(),
            usageCount: { increment: 1 }
          }
        });
        
        console.log(`🎯 FOUND WORKING KEY: ${apiKey.apiKey.substring(0, 8)}***`);
        
      } catch (error) {
        console.log(`❌ Key failed: ${error.message}`);
        
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          if (error.response.data?.message) {
            console.log(`   Message: ${error.response.data.message.substring(0, 100)}...`);
          }
        }
        
        // Update database record as failed
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { 
            lastResult: 'error',
            lastUsed: new Date()
          }
        });
      }
      
      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log(`\n📊 Summary: ${workingKeys}/${allKeys.length} keys are working`);
    
    if (workingKeys === 0) {
      console.log(`\n❌ NO WORKING KEYS FOUND`);
      console.log(`💡 Solutions:`);
      console.log(`   1. Upgrade ScrapingDog accounts to paid plans`);
      console.log(`   2. Add new ScrapingDog API keys`);
      console.log(`   3. Switch to alternative LinkedIn scraping service`);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAllScrapingDogKeys();