const axios = require('axios');

const api_key = '6882894b855f5678d36484c8';
const url = 'https://api.scrapingdog.com/linkedin';

const params = {
  api_key: api_key,
  type: 'profile',
  linkId: 'musayevcreate',
  premium: 'true', // Premium true etdik ki daha çox məlumat gətirsin
};

console.log('🔍 Testing ScrapingDog API for skills data...');

axios
  .get(url, { params: params })
  .then(function (response) {
    if (response.status === 200) {
      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        const profile = data[0];

        console.log('✅ API Response received');
        console.log('\n🔍 Skills Analysis:');
        console.log('Skills field exists:', 'skills' in profile);
        console.log('Skills type:', typeof profile.skills);
        console.log('Skills is array:', Array.isArray(profile.skills));
        console.log('Skills length:', profile.skills ? profile.skills.length : 0);
        console.log('Skills content:', profile.skills);

        console.log('\n📋 Other available fields:');
        const availableFields = Object.keys(profile);
        console.log('Total fields:', availableFields.length);

        // Skill-related sahələri axtaraq
        const skillRelatedFields = availableFields.filter(field =>
          field.toLowerCase().includes('skill') ||
          field.toLowerCase().includes('competenc') ||
          field.toLowerCase().includes('abilit') ||
          field.toLowerCase().includes('expert')
        );

        console.log('Skill-related fields:', skillRelatedFields);

        // Digər mümkün sahələri göstərək
        console.log('\nAll available fields:', availableFields);

        // Premium sahələri yoxlayaq
        console.log('\n🔍 Checking for premium-specific fields:');
        const premiumFields = ['skills', 'endorsements', 'recommendations', 'connections'];
        premiumFields.forEach(field => {
          if (field in profile) {
            console.log(`${field}:`, profile[field]);
          } else {
            console.log(`${field}: NOT AVAILABLE`);
          }
        });

      } else {
        console.log('❌ Unexpected data format:', data);
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
