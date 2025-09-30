// Test different BrightData snapshot endpoints
const axios = require('axios');

async function testBrightDataEndpoints() {
  try {
    const API_KEY = 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae';
    const SNAPSHOT_ID = 'sd_mg6vkuvc24e5nokjyt';
    
    console.log('🔍 Testing different BrightData snapshot endpoints...');
    
    const endpoints = [
      `https://api.brightdata.com/dca/snapshot/${SNAPSHOT_ID}?format=json`,
      `https://api.brightdata.com/datasets/v3/snapshot/${SNAPSHOT_ID}?format=json`,
      `https://api.brightdata.com/datasets/v3/download/${SNAPSHOT_ID}?format=json`,
      `https://api.brightdata.com/snapshot/${SNAPSHOT_ID}?format=json`,
      `https://api.brightdata.com/dca/data/${SNAPSHOT_ID}?format=json`,
      `https://api.brightdata.com/datasets/v3/data/${SNAPSHOT_ID}?format=json`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n📡 Testing: ${endpoint}`);
        
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
          timeout: 10000
        });
        
        console.log(`✅ SUCCESS! Status: ${response.status}`);
        console.log(`📊 Response type: ${typeof response.data}`);
        console.log(`📊 Response length: ${JSON.stringify(response.data).length} characters`);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log(`🎉 Found profile data! Count: ${response.data.length}`);
          const profile = response.data[0];
          console.log(`👤 Name: ${profile.name || 'N/A'}`);
          console.log(`🏢 Company: ${profile.current_company?.name || 'N/A'}`);
          break; // Found working endpoint
        } else {
          console.log(`⚠️ Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
        }
        
      } catch (error) {
        if (error.response) {
          console.log(`❌ Failed: ${error.response.status} - ${error.response.statusText}`);
        } else {
          console.log(`❌ Failed: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBrightDataEndpoints();