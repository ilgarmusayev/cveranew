/**
 * Test Enhanced LinkedIn Import Service with Real API
 * Testing afetkhalilli profile with enhanced debug logs
 */

const axios = require('axios');

async function testEnhancedLinkedInImport() {
  console.log('🧪 Testing Enhanced LinkedIn Import with afetkhalilli...\n');

  try {
    const testApiKey = '68a99929b4148b34852a88be';
    const testUsername = 'afetkhalilli';
    
    console.log(`🎯 Testing LinkedIn: ${testUsername}`);
    console.log('🔍 This will test our enhanced parseVolunteerExperience function...\n');

    // Make direct LinkedIn API call
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
      console.log(`📊 Volunteer entries in raw data: ${profileData.volunteering?.length || 0}`);
      
      // Now test our LinkedIn import service directly
      console.log('\n🔄 Testing Our LinkedIn Import Service...');
      
      // Import the actual LinkedIn import service
      try {
        // Use the LinkedIn import service API endpoint
        const importResponse = await axios.post('http://localhost:3000/api/import/linkedin', {
          linkedinUsername: testUsername
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (importResponse.data.success) {
          console.log('✅ LinkedIn Import Service Response:');
          console.log(`📊 Volunteer experiences imported: ${importResponse.data.stats?.volunteerCount || 0}`);
          console.log('📋 Import stats:', importResponse.data.stats);
          
          if (importResponse.data.stats?.volunteerCount > 0) {
            console.log('\n🎉 SUCCESS! Volunteer experiences were imported!');
            console.log('✅ Problem SOLVED! The volunteer data is now being imported correctly.');
          } else {
            console.log('\n❌ Still no volunteer experiences imported');
            console.log('🔍 Debug: Need to check why parseVolunteerExperience is not working');
          }
        } else {
          console.log('❌ LinkedIn import failed:', importResponse.data.error);
        }

      } catch (importError) {
        console.log('❌ Failed to call import service:', importError.message);
        console.log('🔍 Testing volunteer parsing logic directly...');
        
        // Test the parsing logic directly
        const volunteerData = profileData.volunteering || [];
        console.log(`📊 Raw volunteer data length: ${volunteerData.length}`);
        
        if (volunteerData.length > 0) {
          console.log('✅ Volunteer data exists in API response');
          console.log('📋 First volunteer entry:', volunteerData[0]);
          
          // Test parsing manually
          const parsedVolunteer = volunteerData.map((vol, index) => ({
            id: `vol-${index}`,
            organization: vol.company_name || '',
            role: vol.company_position || '',
            startDate: vol.starts_at || '',
            endDate: vol.ends_at || '',
            current: !vol.ends_at || vol.ends_at === '',
            description: vol.description || ''
          }));

          console.log('✅ Manual parsing result:');
          parsedVolunteer.forEach((vol, index) => {
            console.log(`  ${index + 1}. ${vol.organization} - ${vol.role}`);
          });
          
          console.log('\n🎯 Parsing logic works! Check why import service is not using this data.');
        } else {
          console.log('❌ No volunteer data in API response');
        }
      }

    } else {
      console.log('❌ No profile data received from LinkedIn API');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEnhancedLinkedInImport();
