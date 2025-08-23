const axios = require('axios');

async function testLinkedInCVCreation() {
  try {
    console.log('🔧 LinkedIn CV yaradılması test edilir...');
    
    // Test istifadəçisi üçün JWT token (gerçək token əvəz edilməlidir)
    const testToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJmNWJlZWQxMC05YzRiLTRlNGYtYWVlYy1mNDExMDQ2NzU4Y2UiLCJlbWFpbCI6Im11c2F5ZXZAZ21haWwuY29tIiwiaWF0IjoxNzQzMTE0MDE5LCJleHAiOjE3NDMxNjgwMTl9.7E_J4mJFFzN5qQmgKDRCBsOhqVkk8I4zE4Ny8k5eCdY';
    
    const response = await axios.post('http://localhost:3001/api/import/linkedin', {
      username: 'musayevcreate'
    }, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ LinkedIn import və CV yaradılması uğurlu:');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.cvId) {
      console.log(`🎉 CV uğurla yaradıldı! CV ID: ${response.data.cvId}`);
      console.log(`👤 Ad: ${response.data.summary?.name}`);
      console.log(`💼 İş təcrübəsi sayı: ${response.data.summary?.experienceCount}`);
      console.log(`🎓 Təhsil sayı: ${response.data.summary?.educationCount}`);
      console.log(`🔧 Bacarıq sayı: ${response.data.summary?.skillsCount}`);
    }

  } catch (error) {
    console.error('❌ Test xətası:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('🔑 JWT token yenilənməlidir');
    }
  }
}

testLinkedInCVCreation();
