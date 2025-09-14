/**
 * Test Volunteer Experience Import from LinkedIn
 */

const axios = require('axios');

async function testVolunteerImport() {
  console.log('🧪 Testing Volunteer Experience Import...\n');

  try {
    // Test API key (from database)
    const testApiKey = '68a99929b4148b34852a88be';
    const testUsername = 'afetkhalilli'; // Real profile for volunteer testing
    
    console.log(`🎯 Testing LinkedIn: ${testUsername}`);
    console.log(`🔑 Using API Key: ${testApiKey.substring(0, 8)}...${testApiKey.substring(testApiKey.length - 4)}`);
    
    const url = 'https://api.scrapingdog.com/linkedin';
    const params = {
      api_key: testApiKey,
      type: 'profile',
      linkId: testUsername,
      premium: 'false'
    };

    console.log('📡 Making API request...');
    const response = await axios.get(url, { params });
    
    if (response.data && response.data[0]) {
      const profileData = response.data[0];
      
      console.log('\n📋 Available Profile Fields:');
      console.log('='.repeat(50));
      Object.keys(profileData).forEach(key => {
        const value = profileData[key];
        if (Array.isArray(value)) {
          console.log(`  ${key}: Array[${value.length}]`);
          if (key.toLowerCase().includes('volunteer') || key.toLowerCase().includes('activity')) {
            console.log(`    Content: ${JSON.stringify(value, null, 2).substring(0, 200)}...`);
          }
        } else if (typeof value === 'object' && value !== null) {
          console.log(`  ${key}: Object`);
        } else {
          console.log(`  ${key}: ${typeof value} (${String(value).substring(0, 50)}...)`);
        }
      });

      // Focus on volunteer-related fields
      console.log('\n🤝 Volunteer-Related Fields:');
      console.log('='.repeat(50));
      
      const volunteerFields = [
        'volunteering', 'volunteer_experience', 'volunteer', 'volunteers',
        'volunteer_work', 'community_service', 'activities', 'volunteer_activities',
        'community_involvement', 'social_work', 'charitable_work'
      ];

      volunteerFields.forEach(field => {
        if (profileData[field]) {
          console.log(`✅ ${field}:`, profileData[field]);
        } else {
          console.log(`❌ ${field}: Not found`);
        }
      });

      // Check if volunteering field has data
      if (profileData.volunteering) {
        console.log('\n🎯 Volunteering Data Details:');
        console.log('Type:', typeof profileData.volunteering);
        console.log('Is Array:', Array.isArray(profileData.volunteering));
        if (Array.isArray(profileData.volunteering)) {
          console.log('Length:', profileData.volunteering.length);
          if (profileData.volunteering.length > 0) {
            console.log('First item:', JSON.stringify(profileData.volunteering[0], null, 2));
          } else {
            console.log('✅ Volunteering array is empty - this profile has no volunteer experience');
          }
        } else {
          console.log('Content:', profileData.volunteering);
        }
      }

      // Check activities for volunteer content
      if (profileData.activities && Array.isArray(profileData.activities)) {
        console.log('\n📱 Checking Activities for Volunteer Content:');
        const volunteerKeywords = [
          'volunteer', 'voluntary', 'könüllü', 'community', 'charity', 'non-profit',
          'nonprofit', 'ngo', 'foundation', 'social impact', 'humanitarian', 'civic',
          'community service', 'volunteer work', 'social work', 'giving back', 'help',
          'support', 'donate', 'fundraising', 'awareness', 'cause'
        ];

        const volunteerActivities = profileData.activities.filter(activity => {
          const title = (activity.title || '').toLowerCase();
          const activityType = (activity.activity || '').toLowerCase();
          
          return volunteerKeywords.some(keyword =>
            title.includes(keyword) || activityType.includes(keyword)
          );
        });

        if (volunteerActivities.length > 0) {
          console.log(`✅ Found ${volunteerActivities.length} volunteer-related activities:`);
          volunteerActivities.forEach((activity, index) => {
            console.log(`  ${index + 1}. ${activity.title?.substring(0, 100)}...`);
            console.log(`     Activity: ${activity.activity}`);
          });
        } else {
          console.log('❌ No volunteer-related content found in activities');
        }
      }

      // Check experience for volunteer entries
      if (profileData.experience && Array.isArray(profileData.experience)) {
        console.log('\n🔍 Checking Experience for Volunteer Entries:');
        const volunteerKeywords = [
          'volunteer', 'voluntary', 'könüllü', 'community', 'charity', 'non-profit',
          'nonprofit', 'ngo', 'foundation', 'social', 'humanitarian', 'civic'
        ];

        const possibleVolunteerExperience = profileData.experience.filter(exp => {
          const title = (exp.title || exp.position || '').toLowerCase();
          const company = (exp.company || exp.company_name || '').toLowerCase();
          const description = (exp.description || '').toLowerCase();

          return volunteerKeywords.some(keyword =>
            title.includes(keyword) ||
            company.includes(keyword) ||
            description.includes(keyword)
          );
        });

        if (possibleVolunteerExperience.length > 0) {
          console.log(`✅ Found ${possibleVolunteerExperience.length} possible volunteer entries in experience:`);
          possibleVolunteerExperience.forEach((exp, index) => {
            console.log(`  ${index + 1}. ${exp.title || 'No title'} at ${exp.company || exp.company_name || 'No company'}`);
          });
        } else {
          console.log('❌ No volunteer entries found in experience');
        }
      }

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

testVolunteerImport();
