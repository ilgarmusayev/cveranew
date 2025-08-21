const axios = require('axios');

const api_key = '6882894b855f5678d36484c8';
const url = 'https://api.scrapingdog.com/linkedin';

const params = {
  api_key: api_key,
  type: 'profile',
  linkId: 'musayevcreate',
  premium: 'false',
};

console.log('🔍 Testing LinkedIn API response...');

axios
  .get(url, { params: params })
  .then(function (response) {
    if (response.status === 200) {
      const data = response.data;
      console.log('✅ API Response Status:', response.status);
      console.log('📊 Raw Data Structure:');
      console.log(JSON.stringify(data, null, 2));

      // Analyze the data structure
      console.log('\n🔍 Data Analysis:');
      console.log('Data type:', typeof data);
      console.log('Is Array:', Array.isArray(data));

      if (Array.isArray(data) && data.length > 0) {
        console.log('Array length:', data.length);
        console.log('First item keys:', Object.keys(data[0]));

        const profile = data[0];
        console.log('\n📋 Profile Data:');
        console.log('Name:', profile.full_name || profile.name || profile.fullName);
        console.log('Headline:', profile.headline);
        console.log('About:', profile.about);
        console.log('Experience:', profile.experience ? profile.experience.length : 0);
        console.log('Education:', profile.education ? profile.education.length : 0);
        console.log('Skills:', profile.skills ? profile.skills.length : 0);
      } else if (typeof data === 'object') {
        console.log('Object keys:', Object.keys(data));
        console.log('Name:', data.full_name || data.name || data.fullName);
        console.log('Headline:', data.headline);
        console.log('About:', data.about);
        console.log('Experience:', data.experience ? data.experience.length : 0);
        console.log('Education:', data.education ? data.education.length : 0);
        console.log('Skills:', data.skills ? data.skills.length : 0);
      }
    } else {
      console.log('❌ Request failed with status code: ' + response.status);
    }
  })
  .catch(function (error) {
    console.error('❌ Error making the request: ' + error.message);
    if (error.response) {
      console.log('Response data:', error.response.data);
      console.log('Response status:', error.response.status);
    }
  });
