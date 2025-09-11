const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function debugScrapingDogError() {
  try {
    console.log('🔍 ScrapingDog Error Debug...');
    
    // Get API key
    const scrapingDogKey = await prisma.apiKey.findFirst({
      where: {
        service: 'scrapingdog',
        active: true
      }
    });
    
    if (!scrapingDogKey) {
      console.error('❌ No ScrapingDog API key found');
      return;
    }
    
    console.log(`✅ API Key: ${scrapingDogKey.apiKey.substring(0, 10)}...`);
    
    // Test with different parameters
    const testCases = [
      {
        name: 'Standard Format',
        params: {
          api_key: scrapingDogKey.apiKey,
          type: 'profile',
          linkId: 'musayevcreate',
          premium: 'false'
        }
      },
      {
        name: 'Without Premium Parameter',
        params: {
          api_key: scrapingDogKey.apiKey,
          type: 'profile',
          linkId: 'musayevcreate'
        }
      },
      {
        name: 'With Premium True',
        params: {
          api_key: scrapingDogKey.apiKey,
          type: 'profile',
          linkId: 'musayevcreate',
          premium: 'true'
        }
      },
      {
        name: 'With Different User',
        params: {
          api_key: scrapingDogKey.apiKey,
          type: 'profile',
          linkId: 'williamhgates',
          premium: 'false'
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📡 Testing: ${testCase.name}`);
      console.log('Parameters:', { ...testCase.params, api_key: testCase.params.api_key.substring(0, 10) + '...' });
      
      try {
        const response = await axios.get('https://api.scrapingdog.com/linkedin', {
          params: testCase.params,
          timeout: 30000
        });
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Data type: ${typeof response.data}`);
        
        if (Array.isArray(response.data)) {
          console.log(`📋 Array length: ${response.data.length}`);
          if (response.data.length > 0) {
            console.log(`🔍 First item keys: ${Object.keys(response.data[0])}`);
          }
        } else if (typeof response.data === 'object') {
          console.log(`🔍 Object keys: ${Object.keys(response.data)}`);
        }
        
        console.log('✅ SUCCESS for', testCase.name);
        break; // If successful, no need to test others
        
      } catch (error) {
        console.error(`❌ ${testCase.name} failed:`, error.message);
        
        if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Status Text: ${error.response.statusText}`);
          console.error(`   Data:`, error.response.data);
        }
        
        if (error.code) {
          console.error(`   Error Code: ${error.code}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugScrapingDogError();
