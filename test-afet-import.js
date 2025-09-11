const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testAfetkhalilliImport() {
  try {
    console.log('🔍 Testing Afet Khalilli import with improved logic...');
    
    const scrapingDogKey = await prisma.apiKey.findFirst({
      where: { service: 'scrapingdog', active: true }
    });
    
    if (!scrapingDogKey) {
      console.error('❌ No API key found');
      return;
    }
    
    console.log(`✅ API Key: ${scrapingDogKey.apiKey.substring(0, 10)}...`);
    
    const linkedinUsername = 'afetkhalilli';
    
    // Try both premium settings
    const parameterSets = [
      {
        api_key: scrapingDogKey.apiKey,
        type: 'profile',
        linkId: linkedinUsername,
        premium: 'false'
      },
      {
        api_key: scrapingDogKey.apiKey,
        type: 'profile',
        linkId: linkedinUsername,
        premium: 'true'
      }
    ];
    
    let data = null;
    let lastError = null;
    
    for (const params of parameterSets) {
      console.log(`\n🔍 Trying with premium: ${params.premium}`);
      
      try {
        const response = await axios.get('https://api.scrapingdog.com/linkedin', {
          params: params,
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.status === 200) {
          data = response.data;
          console.log(`✅ SUCCESS with premium: ${params.premium}`);
          
          // Handle array response
          if (Array.isArray(data) && data.length > 0) {
            data = data[0];
          }
          
          console.log('👤 Profile Data:');
          console.log(`   Name: ${data.fullName || data.firstName + ' ' + data.lastName}`);
          console.log(`   Headline: ${data.headline}`);
          console.log(`   Location: ${data.location}`);
          console.log(`   About: ${data.about ? data.about.substring(0, 100) + '...' : 'No about'}`);
          console.log(`   Experience: ${Array.isArray(data.experience) ? data.experience.length + ' entries' : 'No experience'}`);
          console.log(`   Education: ${Array.isArray(data.education) ? data.education.length + ' entries' : 'No education'}`);
          console.log(`   Skills: ${Array.isArray(data.skills) ? data.skills.length + ' skills' : 'No skills'}`);
          
          break; // Success, no need to try other parameters
        }
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Failed with premium ${params.premium}:`, error.message);
        
        if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          if (error.response.status === 429) {
            console.log('   Rate limited, trying next parameter...');
          } else if (error.response.status === 400) {
            console.log('   Bad request, trying next parameter...');
          }
        }
        
        // Wait before trying next parameter
        console.log('   Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    if (!data) {
      console.error('❌ Both parameter sets failed');
      if (lastError) {
        console.error('Last error:', lastError.message);
      }
    } else {
      console.log('\n🎉 Profile successfully scraped! Ready for CV creation.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAfetkhalilliImport();
