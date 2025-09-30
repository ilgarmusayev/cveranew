// Quick test of BrightData API v3 endpoint
const axios = require('axios');

async function testBrightDataV3() {
  try {
    const API_KEY = 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae';
    const DATASET_ID = 'gd_l1viktl72bvl7bjuj0';
    const TEST_URL = 'https://linkedin.com/in/musayevcreate';
    
    console.log('🧪 Testing BrightData v3 API...');
    console.log('🔗 Dataset ID:', DATASET_ID);
    console.log('🔗 Test URL:', TEST_URL);
    
    const endpoint = `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${DATASET_ID}&include_errors=true`;
    console.log('📡 Endpoint:', endpoint);
    
    const response = await axios.post(
      endpoint,
      [{"url": TEST_URL}],
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Success! Status:', response.status);
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.snapshot_id) {
      console.log('🎉 Snapshot ID received:', response.data.snapshot_id);
      console.log('⏳ Scraping triggered successfully!');
      
      // You can now poll for results using:
      // GET https://api.brightdata.com/dca/snapshot/{snapshot_id}?format=json
      console.log('\n📋 Next step: Poll for results using:');
      console.log(`GET https://api.brightdata.com/dca/snapshot/${response.data.snapshot_id}?format=json`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testBrightDataV3();