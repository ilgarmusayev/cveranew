const axios = require('axios');

async function testLinkedInScraping() {
  console.log('🔍 Testing LinkedIn scraping with ScrapingDog API...');

  const api_key = '6882894b855f5678d36484c8';
  const url = 'https://api.scrapingdog.com/linkedin';

  const params = {
    api_key: api_key,
    type: 'profile',
    linkId: 'khalidbabasoy', // Using the profile from your error
    premium: 'false',
  };

  try {
    console.log('📡 Making request with params:', params);

    const response = await axios.get(url, {
      params: params,
      timeout: 30000,
      headers: {
        'User-Agent': 'CVERA-LinkedIn-Scraper/2.0'
      }
    });

    if (response.status === 200) {
      console.log('✅ Success! Response status:', response.status);
      console.log('📦 Response data:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('❌ Unexpected status code:', response.status);
    }

  } catch (error) {
    console.error('❌ Error details:');
    console.error('- Message:', error.message);
    console.error('- Status:', error.response?.status);
    console.error('- Status Text:', error.response?.statusText);
    console.error('- Response Data:', error.response?.data);

    if (error.response?.status === 400) {
      console.log('🔍 400 Bad Request Analysis:');
      console.log('- This usually means invalid parameters');
      console.log('- Check if linkId format is correct');
      console.log('- Verify API key is valid');
      console.log('- Make sure the LinkedIn username exists');
    }
  }
}

// Test with both profiles
async function testMultipleProfiles() {
  const profiles = ['khalidbabasoy', 'musayevcreate'];

  for (const profile of profiles) {
    console.log(`\n🧪 Testing profile: ${profile}`);

    const api_key = '6882894b855f5678d36484c8';
    const url = 'https://api.scrapingdog.com/linkedin';

    const params = {
      api_key: api_key,
      type: 'profile',
      linkId: profile,
      premium: 'false',
    };

    try {
      const response = await axios.get(url, {
        params: params,
        timeout: 30000
      });

      console.log(`✅ ${profile}: Success (${response.status})`);

    } catch (error) {
      console.log(`❌ ${profile}: Failed`);
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.message}`);
      console.log(`   Data: ${JSON.stringify(error.response?.data)}`);
    }

    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testMultipleProfiles();
