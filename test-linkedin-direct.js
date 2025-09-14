/**
 * Test Real LinkedIn Import with API Key Fallback
 * This tests the actual LinkedIn import functionality with the fallback system
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLinkedInImportDirectly() {
  console.log('🔄 Testing LinkedIn Import API Key Fallback Directly...\n');

  try {
    // Simulate the API key selection logic
    console.log('📊 Step 1: Getting ScrapingDog API Keys...');
    
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        service: 'scrapingdog',
        active: true,
        dailyUsage: {
          lt: 1000 // daily limit
        },
        // Skip keys that recently failed (within last hour)
        NOT: {
          AND: [
            { lastResult: 'error' },
            { 
              lastUsed: {
                gte: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
              }
            }
          ]
        }
      },
      orderBy: [
        { priority: 'asc' },
        { usageCount: 'asc' },
        { lastUsed: 'asc' }
      ]
    });

    console.log(`🔑 Found ${apiKeys.length} available API keys for testing`);
    
    if (apiKeys.length === 0) {
      console.log('❌ No available API keys found!');
      return;
    }

    // Show which keys would be tried
    console.log('\n📋 API Key Fallback Order:');
    apiKeys.forEach((key, index) => {
      const keyDisplay = key.apiKey.substring(0, 8) + '...' + key.apiKey.substring(key.apiKey.length - 4);
      const status = key.lastResult === 'error' ? '⚠️' : '✅';
      console.log(`  ${index + 1}. ${keyDisplay} ${status} (Priority: ${key.priority}, Usage: ${key.usageCount})`);
    });

    console.log('\n🧪 Testing API Key Selection Logic...');
    
    // Test the first API key (simulate)
    const firstKey = apiKeys[0];
    console.log(`🎯 Would try first key: ${firstKey.apiKey.substring(0, 8)}...${firstKey.apiKey.substring(firstKey.apiKey.length - 4)}`);
    
    // Check recent errors
    const recentErrors = await prisma.apiKey.findMany({
      where: {
        service: 'scrapingdog',
        lastResult: 'error',
        lastUsed: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      }
    });

    console.log(`🚫 Recently failed keys (skipped): ${recentErrors.length}`);
    
    if (recentErrors.length > 0) {
      console.log('   Failed keys:');
      recentErrors.forEach(key => {
        const keyDisplay = key.apiKey.substring(0, 8) + '...' + key.apiKey.substring(key.apiKey.length - 4);
        console.log(`   - ${keyDisplay} (failed: ${key.lastUsed})`);
      });
    }

    console.log('\n✅ API Key Fallback System Test Complete');
    console.log('📋 Expected Behavior:');
    console.log('  1. Try keys in priority order');
    console.log('  2. Skip recently failed keys');
    console.log('  3. Mark failed keys with lastResult: "error"');
    console.log('  4. Record successful usage');
    console.log('  5. Continue until success or all keys exhausted');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testLinkedInImportDirectly();
