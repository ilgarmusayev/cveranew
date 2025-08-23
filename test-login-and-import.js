const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Login test edilir...');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'musayev@gmail.com',
      password: 'test123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Login uğurlu!');
    console.log('🔑 Yeni JWT token:', response.data.token);
    
    return response.data.token;

  } catch (error) {
    console.error('❌ Login xətası:', error.response?.data || error.message);
    return null;
  }
}

async function testLinkedInImportWithNewToken() {
  const token = await testLogin();
  
  if (!token) {
    console.log('❌ Token alınmadı, import test edilə bilməz');
    return;
  }

  try {
    console.log('📱 LinkedIn import test edilir...');
    
    const response = await axios.post('http://localhost:3001/api/import/linkedin', {
      username: 'musayevcreate'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ LinkedIn import uğurlu!');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Import xətası:', error.response?.data || error.message);
  }
}

testLinkedInImportWithNewToken();
