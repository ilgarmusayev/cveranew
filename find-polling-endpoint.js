// Test BrightData v3 dataset status/download endpoints
const axios = require('axios');

async function findCorrectPollingEndpoint() {
  try {
    const API_KEY = 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae';
    const DATASET_ID = 'gd_l1viktl72bvl7bjuj0';
    const SNAPSHOT_ID = 'sd_mg6vkuvc24e5nokjyt';
    
    console.log('🔍 Testing BrightData v3 polling endpoints...');
    
    // Try different polling patterns for v3 API
    const endpoints = [
      // v3 dataset endpoints
      `https://api.brightdata.com/datasets/v3/snapshot/${SNAPSHOT_ID}`,
      `https://api.brightdata.com/datasets/v3/snapshot/${SNAPSHOT_ID}?format=json`,
      `https://api.brightdata.com/datasets/v3/download/${SNAPSHOT_ID}`,
      `https://api.brightdata.com/datasets/v3/download/${SNAPSHOT_ID}?format=json`,
      
      // Dataset status endpoints
      `https://api.brightdata.com/datasets/v3/status/${SNAPSHOT_ID}`,
      `https://api.brightdata.com/datasets/v3/status/${SNAPSHOT_ID}?format=json`,
      
      // Snapshot endpoints
      `https://api.brightdata.com/datasets/v3/snapshots/${SNAPSHOT_ID}`,
      `https://api.brightdata.com/datasets/v3/snapshots/${SNAPSHOT_ID}/download`,
      
      // Legacy but might work
      `https://api.brightdata.com/dca/dataset/snapshot/${SNAPSHOT_ID}`,
      `https://api.brightdata.com/dca/dataset/snapshot/${SNAPSHOT_ID}?format=json`
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
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log(`🎉 FOUND PROFILE DATA! Count: ${response.data.length}`);
          const profile = response.data[0];
          console.log(`👤 Name: ${profile.name || 'N/A'}`);
          console.log(`🏢 Company: ${profile.current_company?.name || 'N/A'}`);
          console.log(`📍 Location: ${profile.location || profile.city || 'N/A'}`);
          console.log(`\n🎯 CORRECT POLLING ENDPOINT: ${endpoint}`);
          
          // Show some structure
          console.log(`\n📋 Data keys: ${Object.keys(profile).slice(0, 10).join(', ')}...`);
          return endpoint;
        } else {
          console.log(`⚠️ Empty or different response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        }
        
      } catch (error) {
        if (error.response) {
          console.log(`❌ Failed: ${error.response.status}`);
        } else {
          console.log(`❌ Failed: ${error.message}`);
        }
      }
    }
    
    console.log('\n❌ No working polling endpoint found');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

findCorrectPollingEndpoint();