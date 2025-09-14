/**
 * Test Real LinkedIn Import with Enhanced Debug for afetkhalilli
 */

const axios = require('axios');

async function testRealLinkedInImportDebug() {
  console.log('🧪 Testing Real LinkedIn Import with Enhanced Debug...\n');

  try {
    const testApiKey = '68a99929b4148b34852a88be';
    const testUsername = 'afetkhalilli';
    
    console.log(`🎯 Testing LinkedIn: ${testUsername}`);
    
    const url = 'https://api.scrapingdog.com/linkedin';
    const params = {
      api_key: testApiKey,
      type: 'profile',
      linkId: testUsername,
      premium: 'false'
    };

    console.log('📡 Fetching LinkedIn data...');
    const response = await axios.get(url, { params });
    
    if (response.data && response.data[0]) {
      const profileData = response.data[0];
      
      console.log('✅ LinkedIn data received');
      console.log(`📊 Profile keys: ${Object.keys(profileData).length}`);
      
      // Check volunteer data specifically
      console.log('\n❤️ VOLUNTEER DATA ANALYSIS:');
      console.log('='.repeat(60));
      
      console.log('📊 Data type:', typeof profileData);
      console.log('📊 Data keys:', Object.keys(profileData));
      console.log('📊 Raw profileData.volunteering:', profileData.volunteering);
      
      // Log all volunteer-related fields in detail
      Object.keys(profileData).forEach(key => {
        if (key.toLowerCase().includes('volunteer') || key.toLowerCase().includes('community')) {
          console.log(`🔍 Found volunteer field "${key}":`, profileData[key]);
        }
      });

      // Check if volunteering field exists and has data
      if (profileData.volunteering) {
        console.log('\n🎯 Volunteering Field Analysis:');
        console.log('Type:', typeof profileData.volunteering);
        console.log('Is Array:', Array.isArray(profileData.volunteering));
        if (Array.isArray(profileData.volunteering)) {
          console.log('Length:', profileData.volunteering.length);
          if (profileData.volunteering.length > 0) {
            console.log('\n📋 Volunteer Entries:');
            profileData.volunteering.forEach((vol, index) => {
              console.log(`Entry ${index + 1}:`, {
                company_name: vol.company_name,
                company_position: vol.company_position,
                starts_at: vol.starts_at,
                ends_at: vol.ends_at,
                company_duration: vol.company_duration,
                description: vol.description
              });
            });
          } else {
            console.log('❌ Volunteering array is empty');
          }
        } else {
          console.log('Content:', profileData.volunteering);
        }
      } else {
        console.log('❌ No volunteering field found');
      }

      console.log('\n🔄 This data would be processed by parseVolunteerExperience function');
      console.log('📝 The enhanced debug logs will show exactly what happens during parsing');

    } else {
      console.log('❌ No profile data received');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testRealLinkedInImportDebug();
