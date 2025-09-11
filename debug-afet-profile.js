const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function debugAfetkhalilliProfile() {
  try {
    console.log('🔍 Debugging afetkhalilli profile specifically...');
    
    const scrapingDogKey = await prisma.apiKey.findFirst({
      where: { service: 'scrapingdog', active: true }
    });
    
    if (!scrapingDogKey) {
      console.error('❌ No API key found');
      return;
    }
    
    console.log(`✅ API Key: ${scrapingDogKey.apiKey.substring(0, 10)}...`);
    
    // Test different parameter combinations for afetkhalilli
    const testCases = [
      {
        name: 'Standard - afetkhalilli',
        params: {
          api_key: scrapingDogKey.apiKey,
          type: 'profile',
          linkId: 'afetkhalilli',
          premium: 'false'
        }
      },
      {
        name: 'Without Premium - afetkhalilli',
        params: {
          api_key: scrapingDogKey.apiKey,
          type: 'profile',
          linkId: 'afetkhalilli'
        }
      },
      {
        name: 'With Premium True - afetkhalilli',
        params: {
          api_key: scrapingDogKey.apiKey,
          type: 'profile',
          linkId: 'afetkhalilli',
          premium: 'true'
        }
      },
      {
        name: 'Full LinkedIn URL',
        params: {
          api_key: scrapingDogKey.apiKey,
          type: 'profile',
          linkId: 'https://www.linkedin.com/in/afetkhalilli/',
          premium: 'false'
        }
      },
      {
        name: 'Different endpoint format',
        params: {
          api_key: scrapingDogKey.apiKey,
          url: 'https://www.linkedin.com/in/afetkhalilli/',
          premium: 'false'
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📡 Testing: ${testCase.name}`);
      console.log('Parameters:', { 
        ...testCase.params, 
        api_key: testCase.params.api_key.substring(0, 10) + '...' 
      });
      
      try {
        const response = await axios.get('https://api.scrapingdog.com/linkedin', {
          params: testCase.params,
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Data type: ${typeof response.data}`);
        
        if (Array.isArray(response.data)) {
          console.log(`📋 Array length: ${response.data.length}`);
          if (response.data.length > 0) {
            const profile = response.data[0];
            console.log(`👤 Name: ${profile.fullName || profile.firstName + ' ' + profile.lastName || 'Unknown'}`);
            console.log(`🎯 Headline: ${profile.headline || 'No headline'}`);
            console.log(`📍 Location: ${profile.location || 'No location'}`);
            console.log(`📝 About: ${profile.about ? profile.about.substring(0, 100) + '...' : 'No about'}`);
          }
        } else if (typeof response.data === 'object') {
          console.log(`👤 Name: ${response.data.fullName || response.data.firstName + ' ' + response.data.lastName || 'Unknown'}`);
          console.log(`🎯 Headline: ${response.data.headline || 'No headline'}`);
          console.log(`📍 Location: ${response.data.location || 'No location'}`);
        }
        
        console.log('✅ SUCCESS!');
        break; // If successful, no need to test others
        
      } catch (error) {
        console.error(`❌ ${testCase.name} failed:`, error.message);
        
        if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Status Text: ${error.response.statusText}`);
          
          if (error.response.data) {
            console.error(`   Response:`, error.response.data);
          }
        }
        
        if (error.code) {
          console.error(`   Error Code: ${error.code}`);
        }
        
        // Wait a bit between failed attempts to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAfetkhalilliProfile();
