const axios = require('axios');

async function testRapidAPISkills() {
  const options = {
    method: 'GET',
    url: 'https://fresh-linkedin-profile-data.p.rapidapi.com/get-extra-profile-data',
    params: {
      linkedin_url: 'https://www.linkedin.com/in/musayevcreate'
    },
    headers: {
      'x-rapidapi-key': 'e69773e8c2msh50ce2f81e481a35p1888abjsn83f1b967cbe4',
      'x-rapidapi-host': 'fresh-linkedin-profile-data.p.rapidapi.com'
    }
  };

  try {
    console.log('🔍 Testing RapidAPI LinkedIn scraper for skills...');
    const response = await axios.request(options);

    if (response.status === 200) {
      const data = response.data;
      console.log('✅ RapidAPI Response received');

      console.log('\n🔍 Skills Analysis:');
      console.log('Skills field exists:', 'skills' in data);
      console.log('Skills type:', typeof data.skills);
      console.log('Skills is array:', Array.isArray(data.skills));
      console.log('Skills length:', data.skills ? data.skills.length : 0);
      console.log('Skills content:', data.skills);

      console.log('\n📋 Available fields:');
      const availableFields = Object.keys(data);
      console.log('Total fields:', availableFields.length);
      console.log('Fields:', availableFields);

      // Skill-related sahələri axtaraq
      const skillRelatedFields = availableFields.filter(field =>
        field.toLowerCase().includes('skill') ||
        field.toLowerCase().includes('competenc') ||
        field.toLowerCase().includes('abilit') ||
        field.toLowerCase().includes('expert') ||
        field.toLowerCase().includes('endorsement')
      );

      console.log('\nSkill-related fields:', skillRelatedFields);

      // Skills məlumatlarını ətraflı göstərək
      if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
        console.log('\n🎯 Skills Details:');
        data.skills.forEach((skill, index) => {
          console.log(`Skill ${index + 1}:`, skill);
        });
      } else {
        console.log('\n❌ No skills array found');
      }

      // Check for other possible skill locations
      const possibleSkillFields = ['skills', 'skill', 'competencies', 'abilities', 'endorsements'];
      possibleSkillFields.forEach(field => {
        if (data[field]) {
          console.log(`\n📍 Found ${field}:`, data[field]);
        }
      });

    } else {
      console.log('❌ Request failed with status code: ' + response.status);
      console.log('Response data:', response.data);
    }
  } catch (error) {
    console.error('❌ Error making the request: ' + error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testRapidAPISkills();
