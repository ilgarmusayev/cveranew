const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkApiKeyStatus() {
  console.log('🔍 Checking API Key Status...\n');
  
  try {
    // Get all API keys grouped by service
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: [
        { service: 'asc' },
        { priority: 'asc' }
      ]
    });
    
    if (apiKeys.length === 0) {
      console.log('❌ No API keys found in database');
      return;
    }
    
    // Group by service
    const serviceGroups = {};
    apiKeys.forEach(key => {
      if (!serviceGroups[key.service]) {
        serviceGroups[key.service] = [];
      }
      serviceGroups[key.service].push(key);
    });
    
    // Display status for each service
    Object.entries(serviceGroups).forEach(([service, keys]) => {
      console.log(`📋 ${service.toUpperCase()} API Keys (${keys.length} total):`);
      console.log('═'.repeat(50));
      
      keys.forEach((key, index) => {
        const statusIcon = key.active ? '✅' : '❌';
        const usagePercent = ((key.dailyUsage / key.dailyLimit) * 100).toFixed(1);
        const lastUsedStr = key.lastUsed 
          ? new Date(key.lastUsed).toLocaleString()
          : 'Never';
        const lastResultIcon = key.lastResult?.includes('SUCCESS') ? '✅' : 
                              key.lastResult?.includes('FAILED') ? '❌' : '⚪';
        
        console.log(`   ${index + 1}. ${statusIcon} ${key.name || 'Unnamed Key'}`);
        console.log(`      ID: ${key.id}`);
        console.log(`      Key: ${key.apiKey.substring(0, 15)}...`);
        console.log(`      Priority: ${key.priority} | Active: ${key.active}`);
        console.log(`      Usage: ${key.dailyUsage}/${key.dailyLimit} (${usagePercent}%)`);
        console.log(`      Total Usage: ${key.usageCount} requests`);
        console.log(`      Last Used: ${lastUsedStr}`);
        console.log(`      Last Result: ${lastResultIcon} ${key.lastResult || 'None'}`);
        
        // Usage warnings
        if (usagePercent > 80) {
          console.log(`      ⚠️  High usage warning (${usagePercent}%)`);
        }
        if (!key.active) {
          console.log(`      🚫 Key is deactivated`);
        }
        if (key.lastResult?.includes('FAILED')) {
          console.log(`      ❌ Recent failure detected`);
        }
        
        console.log('');
      });
      
      // Service summary
      const activeKeys = keys.filter(k => k.active).length;
      const totalRequests = keys.reduce((sum, k) => sum + k.usageCount, 0);
      const avgUsage = keys.reduce((sum, k) => sum + (k.dailyUsage / k.dailyLimit), 0) / keys.length;
      
      console.log(`   📊 ${service.toUpperCase()} Summary:`);
      console.log(`      Active Keys: ${activeKeys}/${keys.length}`);
      console.log(`      Total Requests: ${totalRequests}`);
      console.log(`      Average Daily Usage: ${(avgUsage * 100).toFixed(1)}%`);
      console.log('');
    });
    
    // Overall system health
    const totalKeys = apiKeys.length;
    const activeKeys = apiKeys.filter(k => k.active).length;
    const healthyKeys = apiKeys.filter(k => 
      k.active && 
      !k.lastResult?.includes('FAILED') && 
      (k.dailyUsage / k.dailyLimit) < 0.8
    ).length;
    
    console.log('🏥 System Health:');
    console.log('═'.repeat(30));
    console.log(`Total API Keys: ${totalKeys}`);
    console.log(`Active Keys: ${activeKeys}`);  
    console.log(`Healthy Keys: ${healthyKeys}`);
    console.log(`Health Score: ${((healthyKeys / totalKeys) * 100).toFixed(1)}%`);
    
    if (healthyKeys < totalKeys * 0.5) {
      console.log('⚠️  WARNING: Less than 50% of keys are healthy!');
    } else if (healthyKeys === totalKeys) {
      console.log('✅ All keys are healthy!');
    } else {
      console.log('👍 System is in good condition');
    }
    
  } catch (error) {
    console.error('❌ Error checking API key status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkApiKeyStatus();