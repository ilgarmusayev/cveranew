const axios = require('axios');

// Test ScrapingDog API for certifications debugging
async function testScrapingDogCertifications() {
  try {
    console.log('🏆 Testing ScrapingDog API for certifications...');
    
    const apiKey = '68a99929b4148b34852a88be';
    const testUsername = 'musayevcreate'; // Your LinkedIn username
    
    const params = {
      api_key: apiKey,
      type: 'profile',
      linkId: testUsername,
      premium: 'true'
    };

    console.log('📡 Making request to ScrapingDog API...');
    const response = await axios.get('https://api.scrapingdog.com/linkedin', {
      params: params,
      timeout: 30000
    });

    if (response.status !== 200) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = response.data;
    console.log('✅ API Response received');
    
    // Log all possible certification fields
    console.log('\n=== RAW API RESPONSE STRUCTURE ===');
    console.log('Response keys:', Object.keys(data));
    
    // Check if data is array or object
    let profileData = data;
    if (Array.isArray(data) && data.length > 0) {
      profileData = data[0];
      console.log('📊 Using first element from array response');
    }
    
    console.log('\n=== PROFILE DATA KEYS ===');
    console.log('Profile keys:', Object.keys(profileData));
    
    // Look for certification-related fields
    const certificationFields = [
      'certifications',
      'certificates', 
      'certification',
      'certs',
      'credentials',
      'licenses',
      'achievements'
    ];
    
    console.log('\n=== CERTIFICATION FIELDS CHECK ===');
    certificationFields.forEach(field => {
      if (profileData[field]) {
        console.log(`✅ Found ${field}:`, profileData[field]);
      } else {
        console.log(`❌ No ${field} field found`);
      }
    });
    
    // Look for any field containing 'cert' or 'licens'
    console.log('\n=== FIELDS CONTAINING "CERT" OR "LICENS" ===');
    Object.keys(profileData).forEach(key => {
      if (key.toLowerCase().includes('cert') || key.toLowerCase().includes('licens')) {
        console.log(`🔍 Found: ${key}:`, profileData[key]);
      }
    });
    
    // Log sample of full response for manual inspection
    console.log('\n=== FULL RESPONSE SAMPLE (first 2000 chars) ===');
    console.log(JSON.stringify(profileData, null, 2).substring(0, 2000) + '...');
    
  } catch (error) {
    console.error('❌ Error testing certifications:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testScrapingDogCertifications();
