const axios = require('axios');

// Test LinkedIn import endpoint - ONLY BrightData
async function testLinkedInImport() {
  console.log('🧪 LinkedIn import testi başlayır (YALNIZ BrightData)...');

  try {
    // Test data
    const testData = {
      linkedinUrl: 'https://www.linkedin.com/in/musayevcreate'
    };

    // You'll need to replace this with a valid JWT token
    const testToken = 'your-jwt-token-here';

    console.log('📡 BrightData API-yə sorğu göndərilir...');

    const response = await axios.post('http://localhost:3000/api/import/linkedin', testData, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 120 seconds timeout for BrightData scraping
    });

    if (response.status === 200) {
      console.log('✅ BrightData test uğurludur!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('❌ Test uğursuz:', response.status);
    }

  } catch (error) {
    console.error('❌ Test xətası:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

// Test BrightData API directly
async function testBrightDataAPI() {
  console.log('🔍 BrightData API direct test...');

  const api_key = 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae';
  const dataset_id = 'gd_l1viktl72bvl7bjuj0';
  const linkedinUrl = 'https://www.linkedin.com/in/musayevcreate';

  try {
    console.log('📡 BrightData trigger çağırılır...');

    const requestData = [{
      url: linkedinUrl
    }];

    const response = await axios.post(
      `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${dataset_id}&include_errors=false`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ BrightData trigger response:', response.data);

    if (response.data.snapshot_id) {
      console.log(`✅ Snapshot yaradıldı: ${response.data.snapshot_id}`);
      console.log('⏳ Production-da snapshot məlumatları avtomatik alınacaq...');
    }

  } catch (error) {
    console.error('❌ BrightData test xətası:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

console.log('🎯 LinkedIn Import Test - YALNIZ BrightData');
console.log('=====================================');

// Run tests
async function runTests() {
  console.log('\n1️⃣ BrightData API Direct Test:');
  await testBrightDataAPI();

  console.log('\n2️⃣ Full LinkedIn Import Test:');
  console.log('⚠️  JWT token dəyişdirin və test edin');
  // await testLinkedInImport();
}

runTests();
