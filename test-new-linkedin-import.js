// Test script for the new LinkedIn import system
const { linkedInImportService } = require('./src/lib/services/linkedin-import.ts');

async function testLinkedInImport() {
  console.log('🧪 Testing new LinkedIn import system...');

  // Test with a sample user ID (you'll need to replace with a real user ID)
  const testUserId = 'test-user-id';
  const testLinkedInUrl = 'https://linkedin.com/in/musayevcreate';

  try {
    // Test 1: Check import limits
    console.log('\n1️⃣ Testing import limits check...');
    const limits = await linkedInImportService.checkImportLimit(testUserId);
    console.log('Import limits:', limits);

    // Test 2: Test LinkedIn URL extraction
    console.log('\n2️⃣ Testing LinkedIn URL parsing...');
    const testUrls = [
      'https://linkedin.com/in/musayevcreate',
      'linkedin.com/in/musayevcreate',
      'musayevcreate',
      'https://www.linkedin.com/in/musayevcreate/'
    ];

    for (const url of testUrls) {
      console.log(`URL: "${url}" → Username: "${linkedInImportService.extractLinkedInUsername(url)}"`);
    }

    // Test 3: Full import (commented out to avoid API usage during testing)
    /*
    console.log('\n3️⃣ Testing full LinkedIn import...');
    const result = await linkedInImportService.importLinkedInProfile(testUserId, testLinkedInUrl);
    console.log('Import result:', result);
    */

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testLinkedInImport();
