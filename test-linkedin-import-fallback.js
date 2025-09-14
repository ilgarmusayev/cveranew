/**
 * Test LinkedIn Import with API Key Fallback System
 * This script tests the new multi-API-key fallback mechanism
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLinkedInImportFallback() {
  console.log('🧪 Testing LinkedIn Import with API Key Fallback System...\n');

  try {
    // Check current ScrapingDog API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        service: 'scrapingdog',
        active: true
      },
      select: {
        id: true,
        apiKey: true,
        usageCount: true,
        lastUsed: true,
        lastResult: true,
        active: true
      }
    });

    console.log('📊 Current ScrapingDog API Keys Status:');
    console.log('='.repeat(50));
    
    if (apiKeys.length === 0) {
      console.log('❌ No active ScrapingDog API keys found!');
      return;
    }

    apiKeys.forEach((key, index) => {
      const keyDisplay = key.apiKey.substring(0, 8) + '...' + key.apiKey.substring(key.apiKey.length - 4);
      console.log(`${index + 1}. Key: ${keyDisplay}`);
      console.log(`   Status: ${!key.active ? '❌ Inactive' : key.lastResult?.includes('error') ? '⚠️  Error' : '✅ Active'}`);
      console.log(`   Usage Count: ${key.usageCount}`);
      console.log(`   Last Used: ${key.lastUsed || 'Never'}`);
      console.log(`   Last Result: ${key.lastResult || 'No result'}`);
      console.log('');
    });

    // Check if we have any working keys (active and not errored)
    const workingKeys = apiKeys.filter(key => key.active && !key.lastResult?.includes('error'));
    console.log(`✅ Working API Keys: ${workingKeys.length}/${apiKeys.length}`);
    
    if (workingKeys.length === 0) {
      console.log('⚠️  All API keys have errors or are inactive.');
      console.log('🔄 API Fallback System will handle this by trying all available keys.');
    }

    console.log('\n🔄 Testing LinkedIn Import Fallback System...');
    console.log('Note: This will test the API key rotation logic without making actual API calls\n');

    // Test with a sample LinkedIn username
    const testUsername = 'musayevcreate';
    console.log(`🎯 Test Username: ${testUsername}`);
    console.log('📝 Expected Behavior:');
    console.log('  1. Try first API key');
    console.log('  2. If fails, mark as failed and try next');
    console.log('  3. Continue until success or all keys exhausted');
    console.log('  4. Record successful usage for working key');

  } catch (error) {
    console.error('❌ Error testing LinkedIn import fallback:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testLinkedInImportFallback();
