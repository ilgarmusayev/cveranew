const axios = require('axios');

console.log('=== LinkedIn OAuth Callback Debug ===\n');

async function debugLinkedInCallback() {
  try {
    // Test the environment variables
    console.log('1. Checking Environment Variables:');
    const requiredEnvVars = [
      'LINKEDIN_CLIENT_ID',
      'LINKEDIN_CLIENT_SECRET',
      'LINKEDIN_REDIRECT_URI'
    ];

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      console.log(`   ${envVar}: ${value ? '✓ Set' : '✗ Missing'}`);
      if (value) {
        console.log(`     Value: ${envVar === 'LINKEDIN_CLIENT_SECRET' ? '[HIDDEN]' : value}`);
      }
    }

    // Test database connection
    console.log('\n2. Testing Database Connection:');
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$connect();
      console.log('   ✓ Database connection successful');
      await prisma.$disconnect();
    } catch (dbError) {
      console.log('   ✗ Database connection failed:', dbError.message);
    }

    // Test JWT generation
    console.log('\n3. Testing JWT Generation:');
    try {
      const { generateJWT } = require('./src/lib/jwt');
      const testToken = generateJWT({ userId: 'test', email: 'test@example.com' });
      console.log('   ✓ JWT generation successful');
    } catch (jwtError) {
      console.log('   ✗ JWT generation failed:', jwtError.message);
    }

    // Test LinkedIn API endpoints
    console.log('\n4. Testing LinkedIn API Endpoints:');

    // Test token endpoint accessibility
    try {
      const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken',
        'grant_type=client_credentials',
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          validateStatus: () => true // Don't throw on error status
        }
      );
      console.log(`   Token endpoint status: ${tokenResponse.status} (${tokenResponse.status < 500 ? '✓' : '✗'})`);
    } catch (error) {
      console.log('   ✗ Token endpoint unreachable:', error.message);
    }

    // Test userinfo endpoint accessibility
    try {
      const userinfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': 'Bearer invalid_token' },
        validateStatus: () => true
      });
      console.log(`   Userinfo endpoint status: ${userinfoResponse.status} (${userinfoResponse.status === 401 ? '✓' : '✗'})`);
    } catch (error) {
      console.log('   ✗ Userinfo endpoint unreachable:', error.message);
    }

    // Check redirect URI configuration
    console.log('\n5. Redirect URI Configuration:');
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    if (redirectUri) {
      console.log(`   Configured URI: ${redirectUri}`);
      console.log(`   Protocol: ${redirectUri.startsWith('https://') ? '✓ HTTPS' : '✗ Not HTTPS'}`);
      console.log(`   Domain: ${redirectUri.includes('cvera.net') ? '✓ cvera.net' : '✗ Wrong domain'}`);
      console.log(`   Path: ${redirectUri.includes('/api/auth/linkedin/callback') ? '✓ Correct path' : '✗ Wrong path'}`);
    }

    // Simulate callback request
    console.log('\n6. Simulating Callback Request:');
    console.log('   Testing common callback scenarios...');

    const testScenarios = [
      { name: 'Missing code parameter', url: 'https://cvera.net/api/auth/linkedin/callback' },
      { name: 'OAuth error', url: 'https://cvera.net/api/auth/linkedin/callback?error=access_denied' },
      { name: 'Valid structure', url: 'https://cvera.net/api/auth/linkedin/callback?code=test_code&state=test_state' }
    ];

    for (const scenario of testScenarios) {
      try {
        const url = new URL(scenario.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        console.log(`   ${scenario.name}:`);
        console.log(`     Code: ${code || 'None'}`);
        console.log(`     Error: ${error || 'None'}`);

        if (error) {
          console.log(`     → Would redirect to: https://cvera.net/api/auth/linkedin-error?error=linkedin_oauth_ugursuz&details=${error}`);
        } else if (!code) {
          console.log(`     → Would redirect to: https://cvera.net/api/auth/linkedin-error?error=avtorizasiya_kodu_alinmadi`);
        } else {
          console.log(`     → Would proceed with token exchange`);
        }
      } catch (urlError) {
        console.log(`   ✗ ${scenario.name}: Invalid URL format`);
      }
    }

  } catch (error) {
    console.error('Debug script error:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

debugLinkedInCallback();
