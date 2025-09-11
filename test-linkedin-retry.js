const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testLinkedInImportWithRetry() {
  try {
    console.log('🔍 Testing LinkedIn import with retry mechanism...');
    
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
    
    // Test with retry mechanism
    const testProfile = 'afetkhalilli';
    console.log(`🔍 Testing profile: ${testProfile}`);
    
    const params = {
      api_key: scrapingDogKey.apiKey,
      type: 'profile',
      linkId: testProfile,
      premium: 'false'
    };
    
    let lastError = null;
    let data = null;
    const maxRetries = 3;
    const baseDelay = 5000; // 5 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 Attempt ${attempt}/${maxRetries}...`);
        
        if (attempt > 1) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${delay/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const response = await axios.get('https://api.scrapingdog.com/linkedin', {
          params: params,
          timeout: 90000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.status === 200) {
          data = response.data;
          console.log('✅ SUCCESS on attempt', attempt);
          console.log('📊 Data type:', typeof data, Array.isArray(data) ? `array[${data.length}]` : 'object');
          
          if (Array.isArray(data) && data.length > 0) {
            console.log('👤 Profile data keys:', Object.keys(data[0]));
            console.log('📝 Name:', data[0].fullName || data[0].firstName + ' ' + data[0].lastName);
            console.log('🎯 Headline:', data[0].headline);
          } else if (typeof data === 'object') {
            console.log('👤 Profile data keys:', Object.keys(data));
            console.log('📝 Name:', data.fullName || data.firstName + ' ' + data.lastName);
            console.log('🎯 Headline:', data.headline);
          }
          
          break;
        } else {
          throw new Error(`API returned status ${response.status}`);
        }
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          if (error.response.status === 429) {
            console.log(`🔄 Rate limited, will retry with longer delay...`);
          } else if (error.response.status === 400) {
            console.error(`❌ Invalid profile or parameters`);
            break; // Don't retry 400 errors
          }
        }
        
        if (attempt === maxRetries) {
          console.error('❌ All retries failed');
        }
      }
    }
    
    if (!data) {
      console.error('❌ Final result: No data retrieved');
      if (lastError) {
        console.error('Last error:', lastError.message);
      }
    } else {
      console.log('✅ Final result: Profile data successfully retrieved');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLinkedInImportWithRetry();
