// Test BrightData API key and service
const { getBrightDataApiKey } = require('./src/lib/api-service');
const { BrightDataLinkedInService } = require('./src/lib/services/brightdata-linkedin');

async function testBrightDataSetup() {
  try {
    console.log('🔍 Testing BrightData setup...');
    
    // Test API key
    console.log('1. Testing API key retrieval...');
    const apiKey = await getBrightDataApiKey();
    if (apiKey) {
      console.log('✅ API key found:', apiKey.substring(0, 8) + '...');
    } else {
      console.log('❌ No BrightData API key found in database');
      console.log('💡 Add a BrightData API key in admin panel: /sistem/api-keys');
      return;
    }
    
    // Test service initialization
    console.log('2. Testing service initialization...');
    const service = new BrightDataLinkedInService();
    console.log('✅ BrightData service initialized');
    
    // Test API endpoint format
    console.log('3. API endpoint configuration:');
    console.log('   Base URL: https://api.brightdata.com/datasets/v3');
    console.log('   Dataset ID: gd_l1viktl72bvl7bjuj0');
    console.log('   Status URL: https://api.brightdata.com/dca/snapshot');
    
    console.log('🎉 BrightData setup looks good!');
    console.log('📝 Ready to test LinkedIn import');
    
  } catch (error) {
    console.error('❌ BrightData setup test failed:', error.message);
  }
}

testBrightDataSetup();