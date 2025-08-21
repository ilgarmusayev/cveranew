const axios = require('axios');

// Simple test with better error handling
async function simpleRapidAPITest() {
  console.log('🔍 Simple RapidAPI test with detailed error handling...');

  const config = {
    method: 'get',
    url: 'https://fresh-linkedin-profile-data.p.rapidapi.com/get-linkedin-profile',
    params: {
      linkedin_url: 'https://www.linkedin.com/in/musayevcreate/'
    },
    headers: {
      'X-RapidAPI-Key': 'e69773e8c2msh50ce2f81e481a35p1888abjsn83f1b967cbe4',
      'X-RapidAPI-Host': 'fresh-linkedin-profile-data.p.rapidapi.com'
    },
    timeout: 15000
  };

  try {
    console.log('📡 Making request to:', config.url);
    console.log('📋 Params:', config.params);
    console.log('🔑 Using API Key:', config.headers['X-RapidAPI-Key'].substring(0, 10) + '...');

    const response = await axios(config);

    console.log('✅ Success! Status:', response.status);
    console.log('📊 Response data keys:', Object.keys(response.data));

    // Check for skills
    if (response.data.skills) {
      console.log('🎯 Skills found:', response.data.skills);
    } else {
      console.log('❌ No skills field found');
      console.log('Available fields:', Object.keys(response.data));
    }

    return response.data;

  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('Error message:', error.message);

    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
      console.log('Response headers:', error.response.headers);
    } else if (error.request) {
      console.log('No response received');
      console.log('Request config:', error.config);
    }

    return null;
  }
}

// Test basic internet connectivity first
async function testConnectivity() {
  console.log('🌐 Testing basic internet connectivity...');
  try {
    const response = await axios.get('https://httpbin.org/get', { timeout: 5000 });
    console.log('✅ Internet connection OK');
    return true;
  } catch (error) {
    console.log('❌ Internet connection failed:', error.message);
    return false;
  }
}

async function runTests() {
  const hasInternet = await testConnectivity();
  if (!hasInternet) {
    console.log('❌ Cannot proceed without internet connection');
    return;
  }

  console.log('\n' + '='.repeat(50));
  await simpleRapidAPITest();
}

runTests();
