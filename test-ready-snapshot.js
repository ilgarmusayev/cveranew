// Test ready BrightData snapshot directly
const axios = require('axios');

async function testReadySnapshot() {
  try {
    const API_KEY = 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae';
    // Use a recent snapshot ID that should be ready
    const SNAPSHOT_ID = 'sd_mg6vkuvc24e5nokjyt'; // or provide a newer one
    
    console.log('🔍 Testing ready BrightData snapshot...');
    console.log('📋 Snapshot ID:', SNAPSHOT_ID);
    
    const endpoint = `https://api.brightdata.com/datasets/v3/snapshot/${SNAPSHOT_ID}`;
    console.log('📡 Endpoint:', endpoint);
    
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      timeout: 30000
    });
    
    console.log('✅ Success! Status:', response.status);
    console.log('📊 Response type:', typeof response.data);
    console.log('📊 Is Array:', Array.isArray(response.data));
    
    if (Array.isArray(response.data)) {
      console.log('📊 Array length:', response.data.length);
      if (response.data.length > 0) {
        const profile = response.data[0];
        console.log('🎉 Profile data found!');
        console.log('👤 Name:', profile.name || 'N/A');
        console.log('🏢 Company:', profile.current_company?.name || 'N/A');
        console.log('📍 Location:', profile.location || profile.city || 'N/A');
        console.log('💼 Experience count:', profile.experience?.length || 0);
        console.log('🎓 Education count:', profile.education?.length || 0);
        
        console.log('\n📋 Profile keys:');
        console.log(Object.keys(profile).slice(0, 15).join(', '));
        
        return true;
      }
    } else if (response.data && typeof response.data === 'object') {
      console.log('📊 Object response - checking status...');
      console.log('Status:', response.data.status || 'N/A');
      console.log('Message:', response.data.message || 'N/A');
      console.log('Keys:', Object.keys(response.data));
      
      // If single profile object
      if (response.data.name || response.data.first_name) {
        console.log('🎉 Single profile detected!');
        console.log('👤 Name:', response.data.name || `${response.data.first_name} ${response.data.last_name}` || 'N/A');
        return true;
      }
    }
    
    console.log('\n📊 Full response sample:');
    console.log(JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testReadySnapshot();