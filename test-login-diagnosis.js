const axios = require('axios');

async function testLoginFlow() {
  console.log('🔍 Testing login functionality...');

  try {
    // Test 1: Check if server is running
    console.log('\n1. Testing server connectivity...');
    const healthCheck = await axios.get('http://localhost:3000/api/health').catch(() => null);
    if (!healthCheck) {
      console.log('❌ Server is not running on localhost:3000');
      console.log('Please start the server with: npm run dev');
      return;
    }
    console.log('✅ Server is running');

    // Test 2: Test login API with sample credentials
    console.log('\n2. Testing login API...');
    const loginData = {
      email: 'test@example.com',
      password: 'testpassword'
    };

    try {
      const loginResponse = await axios.post('http://localhost:3000/api/auth/login', loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Login API Response:', {
        status: loginResponse.status,
        message: loginResponse.data.message,
        hasToken: !!loginResponse.data.accessToken,
        hasUser: !!loginResponse.data.user
      });

    } catch (loginError) {
      console.log('❌ Login API Error:', {
        status: loginError.response?.status,
        message: loginError.response?.data?.message || loginError.message,
        data: loginError.response?.data
      });

      // If it's a 401, that's expected for test credentials
      if (loginError.response?.status === 401) {
        console.log('ℹ️  401 error is expected for test credentials - API is working');
      }
    }

    // Test 3: Check database connection
    console.log('\n3. Testing database connectivity...');
    try {
      const dbTest = await axios.get('http://localhost:3000/api/users/test-db').catch(() => null);
      if (dbTest) {
        console.log('✅ Database connection working');
      } else {
        console.log('⚠️  Database test endpoint not available');
      }
    } catch (dbError) {
      console.log('❌ Database connection issue:', dbError.message);
    }

    // Test 4: Check JWT utilities
    console.log('\n4. Testing JWT functionality...');
    try {
      const jwtTest = await axios.get('http://localhost:3000/api/auth/test-jwt').catch(() => null);
      if (jwtTest) {
        console.log('✅ JWT functions working');
      } else {
        console.log('⚠️  JWT test endpoint not available');
      }
    } catch (jwtError) {
      console.log('❌ JWT error:', jwtError.message);
    }

  } catch (error) {
    console.error('❌ General test error:', error.message);
  }
}

// Run the test
testLoginFlow().then(() => {
  console.log('\n📋 LOGIN TROUBLESHOOTING GUIDE:');
  console.log('================================');
  console.log('If you see specific errors above, here are the solutions:');
  console.log('');
  console.log('🔧 Common Login Issues & Fixes:');
  console.log('1. Server not running → npm run dev');
  console.log('2. Database connection error → Check DATABASE_URL in .env');
  console.log('3. JWT errors → Check JWT_SECRET in .env');
  console.log('4. User not found → Create test user first');
  console.log('5. Password mismatch → Check password hashing');
  console.log('6. Token generation error → Check JWT configuration');
  console.log('');
  console.log('To create a test user, run:');
  console.log('node create-test-user.js');
}).catch(console.error);
