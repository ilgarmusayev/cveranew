// Dashboard API test script
const axios = require('axios');

async function testDashboardAPI() {
  try {
    console.log('🔍 Dashboard API-ni test edirəm...');

    // Your user credentials (replace with actual token if needed)
    const loginData = {
      email: 'musayevcreate@gmail.com',
      password: 'your-password' // You'll need to provide this
    };

    console.log('1️⃣ Login edirəm...');

    // First login to get token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', loginData);

    if (loginResponse.data.accessToken) {
      console.log('✅ Login uğurlu!');

      const token = loginResponse.data.accessToken;

      console.log('2️⃣ CV-ləri yükləyirəm...');

      // Test CV API with token
      const cvsResponse = await axios.get('http://localhost:3000/api/cv', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 API Cavabı:', cvsResponse.data);
      console.log('📋 CV sayı:', cvsResponse.data.cvs?.length || 0);

      if (cvsResponse.data.cvs && cvsResponse.data.cvs.length > 0) {
        console.log('✅ CV-lər tapıldı:');
        cvsResponse.data.cvs.slice(0, 5).forEach((cv, index) => {
          console.log(`   ${index + 1}. ${cv.title} (${cv.id})`);
        });
      } else {
        console.log('❌ CV-lər tapılmadı və ya boş array qaytarıldı');
        console.log('Debug: Response structure:', Object.keys(cvsResponse.data));
      }

    } else {
      console.log('❌ Login uğursuz:', loginResponse.data);
    }

  } catch (error) {
    console.error('❌ Test xətası:', error.response?.data || error.message);
  }
}

testDashboardAPI();
