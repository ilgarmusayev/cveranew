const axios = require('axios');

// Test multiple RapidAPI LinkedIn endpoints
async function testMultipleRapidAPIs() {
  console.log('🔍 Testing multiple RapidAPI LinkedIn endpoints...');

  const rapidApiKey = 'e69773e8c2msh50ce2f81e481a35p1888abjsn83f1b967cbe4';

  // Test 1: Fresh LinkedIn Profile Data
  console.log('\n📡 Test 1: Fresh LinkedIn Profile Data API');
  try {
    const options1 = {
      method: 'GET',
      url: 'https://fresh-linkedin-profile-data.p.rapidapi.com/get-extra-profile-data',
      params: {
        linkedin_url: 'https://www.linkedin.com/in/musayevcreate/'
      },
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'fresh-linkedin-profile-data.p.rapidapi.com'
      },
      timeout: 10000
    };

    const response1 = await axios.request(options1);
    console.log('✅ Fresh LinkedIn API - Status:', response1.status);
    console.log('Data keys:', Object.keys(response1.data));
    if (response1.data.skills) {
      console.log('Skills found:', response1.data.skills.length);
    }
  } catch (error1) {
    console.log('❌ Fresh LinkedIn API Error:', error1.response?.status, error1.response?.data || error1.message);
  }

  // Test 2: LinkedIn Data API
  console.log('\n📡 Test 2: LinkedIn Data API');
  try {
    const options2 = {
      method: 'GET',
      url: 'https://linkedin-data-api.p.rapidapi.com/get-profile-data-by-url',
      params: {
        url: 'https://www.linkedin.com/in/musayevcreate/'
      },
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'linkedin-data-api.p.rapidapi.com'
      },
      timeout: 10000
    };

    const response2 = await axios.request(options2);
    console.log('✅ LinkedIn Data API - Status:', response2.status);
    console.log('Data keys:', Object.keys(response2.data));
    if (response2.data.skills) {
      console.log('Skills found:', response2.data.skills.length);
    }
  } catch (error2) {
    console.log('❌ LinkedIn Data API Error:', error2.response?.status, error2.response?.data || error2.message);
  }

  // Test 3: LinkedIn Profile Scraper
  console.log('\n📡 Test 3: LinkedIn Profile Scraper');
  try {
    const options3 = {
      method: 'GET',
      url: 'https://linkedin-profile-scraper-api.p.rapidapi.com/profile',
      params: {
        url: 'https://www.linkedin.com/in/musayevcreate/'
      },
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'linkedin-profile-scraper-api.p.rapidapi.com'
      },
      timeout: 10000
    };

    const response3 = await axios.request(options3);
    console.log('✅ LinkedIn Scraper API - Status:', response3.status);
    console.log('Data keys:', Object.keys(response3.data));
    if (response3.data.skills) {
      console.log('Skills found:', response3.data.skills.length);
    }
  } catch (error3) {
    console.log('❌ LinkedIn Scraper API Error:', error3.response?.status, error3.response?.data || error3.message);
  }

  // Test 4: Simple LinkedIn endpoint
  console.log('\n📡 Test 4: Simple approach');
  try {
    const options4 = {
      method: 'GET',
      url: 'https://linkedin-api8.p.rapidapi.com/get-profile-posts',
      params: {
        username: 'musayevcreate'
      },
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'linkedin-api8.p.rapidapi.com'
      },
      timeout: 10000
    };

    const response4 = await axios.request(options4);
    console.log('✅ LinkedIn API8 - Status:', response4.status);
    console.log('Data keys:', Object.keys(response4.data));
  } catch (error4) {
    console.log('❌ LinkedIn API8 Error:', error4.response?.status, error4.response?.data || error4.message);
  }
}

testMultipleRapidAPIs();
