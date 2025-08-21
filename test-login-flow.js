const axios = require('axios');

async function testLoginFlow() {
  try {
    console.log('🔐 Giriş prosesini test edirəm...');

    const baseUrl = 'http://localhost:3000';

    // Test 1: Try to login with your account
    console.log('\n1️⃣ Login API-ni test edirəm...');

    const loginData = {
      email: 'ilgar@gmail.com',
      password: 'yourpassword' // Replace with actual password if you know it
    };

    try {
      const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: function (status) {
          return status < 500; // Accept any status code less than 500
        }
      });

      console.log('Login response status:', loginResponse.status);
      console.log('Login response data:', loginResponse.data);

      if (loginResponse.status === 200 && loginResponse.data.accessToken) {
        const token = loginResponse.data.accessToken;
        console.log('✅ Token alındı:', token.substring(0, 20) + '...');

        // Test 2: Try to access protected route with token
        console.log('\n2️⃣ Protected route-u test edirəm...');

        const protectedResponse = await axios.get(`${baseUrl}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          },
          validateStatus: function (status) {
            return status < 500;
          }
        });

        console.log('Protected route status:', protectedResponse.status);
        console.log('Protected route data:', protectedResponse.data);

        if (protectedResponse.status === 200) {
          console.log('✅ Token düzgün işləyir!');
        } else {
          console.log('❌ Token ilə problem var');
        }

      } else {
        console.log('❌ Login uğursuz oldu');
      }

    } catch (loginError) {
      console.log('❌ Login request error:', loginError.message);
      if (loginError.response) {
        console.log('Error status:', loginError.response.status);
        console.log('Error data:', loginError.response.data);
      }
    }

    // Test 3: Check dashboard redirect logic
    console.log('\n3️⃣ Dashboard route-u test edirəm...');

    try {
      const dashboardResponse = await axios.get(`${baseUrl}/dashboard`, {
        maxRedirects: 0, // Don't follow redirects
        validateStatus: function (status) {
          return status < 500;
        }
      });

      console.log('Dashboard response status:', dashboardResponse.status);
      console.log('Dashboard headers location:', dashboardResponse.headers.location);

    } catch (dashboardError) {
      if (dashboardError.response) {
        console.log('Dashboard redirect status:', dashboardError.response.status);
        console.log('Dashboard redirect location:', dashboardError.response.headers.location);
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testLoginFlow();
