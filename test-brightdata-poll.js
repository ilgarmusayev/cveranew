// Test polling BrightData snapshot results
const axios = require('axios');

async function testPollBrightDataSnapshot() {
  try {
    const API_KEY = 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae';
    const SNAPSHOT_ID = 'sd_mg6vkuvc24e5nokjyt'; // From previous test
    
    console.log('🔍 Polling BrightData snapshot results...');
    console.log('📋 Snapshot ID:', SNAPSHOT_ID);
    
    const endpoint = `https://api.brightdata.com/dca/snapshot/${SNAPSHOT_ID}?format=json`;
    console.log('📡 Endpoint:', endpoint);
    
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      timeout: 30000
    });
    
    console.log('✅ Success! Status:', response.status);
    console.log('📊 Response length:', JSON.stringify(response.data).length, 'characters');
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      const profile = response.data[0];
      console.log('🎉 Profile data received!');
      console.log('👤 Name:', profile.name);
      console.log('🏢 Current Company:', profile.current_company?.name);
      console.log('📍 Location:', profile.location || profile.city);
      console.log('💼 Experience Count:', profile.experience?.length || 0);
      console.log('🎓 Education Count:', profile.education?.length || 0);
      
      // Show data structure
      console.log('\n📋 Available fields:');
      console.log(Object.keys(profile).sort());
      
      // Sample experience
      if (profile.experience && profile.experience.length > 0) {
        console.log('\n💼 Sample experience:');
        console.log(JSON.stringify(profile.experience[0], null, 2));
      }
      
      // Sample education
      if (profile.education && profile.education.length > 0) {
        console.log('\n🎓 Sample education:');
        console.log(JSON.stringify(profile.education[0], null, 2));
      }
      
    } else {
      console.log('⚠️ No profile data yet - still processing');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
    
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

testPollBrightDataSnapshot();