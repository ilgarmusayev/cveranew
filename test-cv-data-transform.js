const axios = require('axios');

// Test ScrapingDog API response transformation
const testScrapingDogTransform = async () => {
  console.log('🧪 Testing ScrapingDog API data transformation...\n');

  const api_key = '6882894b855f5678d36484c8';
  const url = 'https://api.scrapingdog.com/linkedin';

  const params = {
    api_key: api_key,
    type: 'profile',
    linkId: 'musayevcreate',
    premium: 'false',
  };

  try {
    console.log('📡 Making request to ScrapingDog API...');
    const response = await axios.get(url, { params: params });

    if (response.status === 200) {
      const data = response.data;
      console.log('✅ API Response received successfully');
      console.log('📊 Response structure:', {
        type: typeof data,
        isArray: Array.isArray(data),
        keys: typeof data === 'object' ? Object.keys(data) : 'N/A',
        length: Array.isArray(data) ? data.length : 'N/A'
      });

      // Test data transformation logic
      let profileData = data;

      // Handle array format
      if (Array.isArray(data) && data.length > 0) {
        profileData = data[0];
        console.log('✅ Extracted profile data from array format');
      }

      // Handle nested data structure
      if (profileData && profileData.data && typeof profileData.data === 'object') {
        profileData = profileData.data;
        console.log('✅ Extracted profile data from nested data property');
      }

      if (!profileData || typeof profileData !== 'object') {
        console.error('❌ Invalid profile data structure:', profileData);
        return;
      }

      console.log('\n🔍 Profile data analysis:');
      console.log('- Keys available:', Object.keys(profileData));
      console.log('- Full name:', profileData.fullName || profileData.full_name || profileData.name || 'Not found');
      console.log('- Email:', profileData.email || 'Not found');
      console.log('- Skills:', Array.isArray(profileData.skills) ? `${profileData.skills.length} skills found` : 'No skills array found');
      console.log('- Experience:', Array.isArray(profileData.experience) ? `${profileData.experience.length} experiences found` : 'No experience array found');
      console.log('- Education:', Array.isArray(profileData.education) ? `${profileData.education.length} education entries found` : 'No education array found');

      // Test skills transformation specifically
      if (profileData.skills && Array.isArray(profileData.skills)) {
        console.log('\n🛠️ Skills transformation test:');
        const transformedSkills = profileData.skills.map((skill, index) => {
          const skillObj = {
            id: `skill-${index}-${Date.now()}`,
            name: '',
            level: 'Intermediate'
          };

          if (typeof skill === 'string') {
            skillObj.name = skill;
          } else if (typeof skill === 'object' && skill !== null) {
            skillObj.name = skill.name || skill.skill || skill.title || '';
          }

          return skillObj;
        }).filter(skill => skill.name.trim() !== '');

        console.log(`✅ Transformed ${transformedSkills.length} skills:`, transformedSkills.slice(0, 5).map(s => s.name));
      }

      console.log('\n🎯 Transformation test completed successfully!');

    } else {
      console.log('❌ Request failed with status code:', response.status);
    }
  } catch (error) {
    console.error('❌ Error making the request:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Run the test
testScrapingDogTransform();
