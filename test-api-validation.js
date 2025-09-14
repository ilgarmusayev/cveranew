const { validateApiKeyForService, detectServiceFromApiKey, validateAndSuggestService } = require('./src/lib/api-key-validator');

console.log('🧪 Testing API Key Validation...\n');

// Test cases
const testCases = [
  {
    name: 'Valid ScrapingDog key',
    apiKey: '68a99929b4148b34852a88be',
    service: 'scrapingdog'
  },
  {
    name: 'Valid Gemini key', 
    apiKey: 'AIzaSyCKWZfMSrfxdrONcjU-Lu7tFfV7xK127jM',
    service: 'gemini'
  },
  {
    name: 'Gemini key as ScrapingDog (wrong)',
    apiKey: 'AIzaSyCKWZfMSrfxdrONcjU-Lu7tFfV7xK127jM',
    service: 'scrapingdog'
  },
  {
    name: 'ScrapingDog key as Gemini (wrong)',
    apiKey: '68a99929b4148b34852a88be',
    service: 'gemini'
  }
];

testCases.forEach(test => {
  console.log(`📋 ${test.name}:`);
  
  const isValid = validateApiKeyForService(test.apiKey, test.service);
  const detectedService = detectServiceFromApiKey(test.apiKey);
  const validation = validateAndSuggestService(test.apiKey, test.service);
  
  console.log(`   API Key: ${test.apiKey.substring(0, 10)}...`);
  console.log(`   Service: ${test.service}`);
  console.log(`   Valid: ${isValid ? '✅' : '❌'}`);
  console.log(`   Detected Service: ${detectedService || 'Unknown'}`);
  console.log(`   Validation: ${validation.message}`);
  if (validation.suggestedService) {
    console.log(`   Suggested: ${validation.suggestedService}`);
  }
  console.log('');
});

console.log('✅ API Key validation test completed!');
