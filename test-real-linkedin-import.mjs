/**
 * Test Real LinkedIn Import with API Key Fallback
 * This tests the actual LinkedIn import functionality with the fallback system
 */

import { linkedInImportService } from './src/lib/services/linkedin-import';

async function testRealLinkedInImport() {
  console.log('🔄 Testing Real LinkedIn Import with API Fallback...\n');

  try {
    // Test with a sample LinkedIn username
    const testUsername = 'musayevcreate'; // Your LinkedIn username
    console.log(`🎯 Testing LinkedIn import for: ${testUsername}`);
    
    console.log('📋 This test will:');
    console.log('  1. Try all available ScrapingDog API keys');
    console.log('  2. Parse volunteer experience and certifications');
    console.log('  3. Show detailed field mapping');
    console.log('  4. Track API key usage and failures\n');

    const startTime = Date.now();
    
    // Import LinkedIn profile
    const result = await linkedInImportService.importLinkedInProfile(testUsername);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`\n⏱️  Import completed in ${duration}ms`);
    console.log('📊 Import Result:');
    console.log('='.repeat(50));

    if (result.success) {
      console.log('✅ Import Status: SUCCESS');
      console.log(`📝 Profile Data Quality: ${Object.keys(result.data || {}).length} sections imported`);
      
      const data = result.data;
      if (data) {
        // Show imported sections
        Object.keys(data).forEach(section => {
          if (data[section] && Array.isArray(data[section]) && data[section].length > 0) {
            console.log(`  ✅ ${section}: ${data[section].length} items`);
          } else if (data[section] && typeof data[section] === 'string' && data[section].trim()) {
            console.log(`  ✅ ${section}: "${data[section].substring(0, 50)}..."`);
          } else if (data[section] && typeof data[section] === 'object') {
            console.log(`  ✅ ${section}: ${JSON.stringify(data[section]).substring(0, 50)}...`);
          } else {
            console.log(`  ⚪ ${section}: Empty or not imported`);
          }
        });

        // Detailed volunteer experience check
        if (data.volunteerExperience && data.volunteerExperience.length > 0) {
          console.log('\n🤝 Volunteer Experience Details:');
          data.volunteerExperience.forEach((vol, index) => {
            console.log(`  ${index + 1}. ${vol.organization || 'No org'} - ${vol.role || 'No role'}`);
            console.log(`     Dates: ${vol.startDate || 'N/A'} to ${vol.endDate || 'Present'}`);
            console.log(`     Description: ${(vol.description || 'No description').substring(0, 100)}...`);
          });
        } else {
          console.log('\n🤝 Volunteer Experience: None imported');
        }

        // Detailed certifications check
        if (data.certifications && data.certifications.length > 0) {
          console.log('\n🏆 Certifications Details:');
          data.certifications.forEach((cert, index) => {
            console.log(`  ${index + 1}. ${cert.name || 'No name'}`);
            console.log(`     Issuer: ${cert.issuer || 'No issuer'}`);
            console.log(`     Date: ${cert.issueDate || 'No date'}`);
          });
        } else {
          console.log('\n🏆 Certifications: None imported');
        }
      }
    } else {
      console.log('❌ Import Status: FAILED');
      console.log(`💬 Error: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRealLinkedInImport();
