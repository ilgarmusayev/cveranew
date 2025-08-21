const axios = require('axios');

async function testBrightDataAPI() {
  try {
    console.log('🧪 Testing BrightData API integration...');

    const api_key = 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae';
    const url = 'https://api.brightdata.com/dca/dataset/get_snapshot';

    const requestBody = {
      dataset_id: 'linkedin_public_data',
      format: 'json',
      filters: {
        profile_url: 'https://linkedin.com/in/musayevcreate'
      },
      exclude_fields: ['skills', 'endorsements', 'skill_assessments'] // Skills xaric edilir
    };

    const headers = {
      'Authorization': `Bearer ${api_key}`,
      'Content-Type': 'application/json'
    };

    console.log('📡 Making BrightData API request...');
    console.log('🔧 Request body:', JSON.stringify(requestBody, null, 2));

    const response = await axios.post(url, requestBody, {
      headers: headers,
      timeout: 30000
    });

    console.log('✅ BrightData API Response Status:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log('🎉 BrightData API working correctly!');
      console.log('⚠️ Skills data excluded as requested');
      return true;
    } else {
      console.log('❌ BrightData API failed with status:', response.status);
      return false;
    }

  } catch (error) {
    console.error('❌ BrightData API test failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
      console.error('📊 Error status:', error.response.status);
    }
    return false;
  }
}

testBrightDataAPI();
