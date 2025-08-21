const axios = require('axios');

async function testWithActiveApiKey() {
  console.log('🧪 Testing LinkedIn scraping with active database API key...');

  // Use the active API key from database
  const api_key = '68878f54f5cc644b92ec13d6'; // The one found as active in database
  const url = 'https://api.scrapingdog.com/linkedin';

  const params = {
    api_key: api_key,
    type: 'profile',
    linkId: 'khalidbabasoy',
    premium: 'false',
  };

  try {
    console.log('📡 Making request with fresh API key...');

    const response = await axios.get(url, {
      params: params,
      timeout: 30000,
      headers: {
        'User-Agent': 'CVERA-LinkedIn-Scraper/2.0'
      }
    });

    if (response.status === 200) {
      console.log('✅ Success! LinkedIn profile scraped successfully');
      console.log('📊 Response status:', response.status);
      console.log('📦 Profile data found:', !!response.data);
      console.log('👤 Profile name:', response.data?.first_name, response.data?.last_name);
    }

  } catch (error) {
    console.error('❌ Error with fresh API key:');
    console.error('- Status:', error.response?.status);
    console.error('- Message:', error.message);
    console.error('- Data:', error.response?.data);
  }
}

testWithActiveApiKey();
