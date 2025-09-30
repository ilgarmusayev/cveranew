const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testScrapingDogAPI() {
  console.log('🔍 ScrapingDog API Test - 403 Error Debug');
  console.log('=====================================');
  
  try {
    // Get working API key from database
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        service: 'scrapingdog',
        active: true,
        lastResult: { contains: 'success' }
      },
      orderBy: { priority: 'asc' }
    });
    
    if (!apiKey) {
      console.log('❌ No working ScrapingDog API key found');
      return;
    }
    
    console.log(`✅ Using API key: ${apiKey.apiKey.substring(0, 8)}***`);
    
    // Test different parameter combinations
    const testCases = [
      {
        name: 'Test 1: Basic parameters with username',
        params: {
          api_key: apiKey.apiKey,
          type: 'profile',
          linkId: 'musayevcreate',
          premium: 'false'
        }
      },
      {
        name: 'Test 2: Premium enabled',
        params: {
          api_key: apiKey.apiKey,
          type: 'profile',
          linkId: 'musayevcreate',
          premium: 'true'
        }
      },
      {
        name: 'Test 3: Full URL instead of username',
        params: {
          api_key: apiKey.apiKey,
          type: 'profile',
          url: 'https://www.linkedin.com/in/musayevcreate',
          premium: 'false'
        }
      },
      {
        name: 'Test 4: Different known LinkedIn profile',
        params: {
          api_key: apiKey.apiKey,
          type: 'profile',
          linkId: 'williamhgates',
          premium: 'false'
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📡 ${testCase.name}`);
      console.log(`Parameters:`, testCase.params);
      
      try {
        const response = await axios.get('https://api.scrapingdog.com/linkedin', {
          params: testCase.params,
          timeout: 15000
        });
        
        console.log(`✅ Success! Status: ${response.status}`);
        console.log(`Data keys:`, Object.keys(response.data));
        
        if (response.data.error) {
          console.log(`⚠️  API Error: ${response.data.error}`);
        }
        
        break; // Stop on first success
        
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        
        if (error.response) {
          console.log(`   Status: ${error.response.status} ${error.response.statusText}`);
          console.log(`   Response:`, error.response.data);
          
          // Check specific error messages
          if (error.response.status === 403) {
            if (error.response.data?.message) {
              console.log(`   Error message: ${error.response.data.message}`);
            }
            if (error.response.data?.error) {
              console.log(`   Error detail: ${error.response.data.error}`);
            }
          }
        }
        
        console.log(`   Will try next test case...`);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Test API key validity with ScrapingDog status endpoint
    console.log(`\n🔍 Testing API key validity...`);
    try {
      const statusResponse = await axios.get('https://api.scrapingdog.com/account', {
        params: { api_key: apiKey.apiKey }
      });
      console.log(`✅ API Key valid. Account info:`, statusResponse.data);
    } catch (error) {
      console.log(`❌ API Key validation failed:`, error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testScrapingDogAPI();