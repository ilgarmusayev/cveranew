// Test BrightData API key system
const { PrismaClient } = require('@prisma/client');
const { getBrightDataApiKey } = require('./src/lib/api-service.ts');

const prisma = new PrismaClient();

async function testBrightDataSystem() {
  try {
    console.log('🧪 Testing BrightData API Key System...\n');
    
    // Test 1: Check database for BrightData keys
    console.log('1️⃣ Checking database for BrightData API keys:');
    const brightDataKeys = await prisma.apiKey.findMany({
      where: {
        service: 'brightdata',
        active: true
      },
      select: {
        id: true,
        service: true,
        apiKey: true,
        active: true,
        usageCount: true,
        lastUsed: true
      }
    });
    
    console.log(`   Found ${brightDataKeys.length} BrightData API keys`);
    brightDataKeys.forEach((key, index) => {
      console.log(`   Key ${index + 1}: ${key.apiKey.substring(0, 8)}... (Active: ${key.active}, Usage: ${key.usageCount})`);
    });
    
    // Test 2: Test getBrightDataApiKey function
    console.log('\n2️⃣ Testing getBrightDataApiKey function:');
    try {
      const apiKey = await getBrightDataApiKey();
      if (apiKey) {
        console.log(`   ✅ API key retrieved: ${apiKey.substring(0, 8)}...`);
      } else {
        console.log('   ❌ No API key returned');
      }
    } catch (error) {
      console.log(`   ❌ Error getting API key: ${error.message}`);
    }
    
    // Test 3: Check if api_keys table exists (new format)
    console.log('\n3️⃣ Checking new api_keys table:');
    try {
      const newApiKeys = await prisma.$queryRaw`
        SELECT service_name, api_key, is_active 
        FROM api_keys 
        WHERE service_name = 'brightdata_linkedin'
      `;
      console.log(`   Found ${newApiKeys.length} keys in new api_keys table`);
      console.log('   Keys:', newApiKeys);
    } catch (error) {
      console.log(`   ❌ New api_keys table error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBrightDataSystem();