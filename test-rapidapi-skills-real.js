const axios = require('axios');

async function testRapidAPISkills() {
  console.log('🔍 Testing RapidAPI LinkedIn scraper for skills...');

  const options = {
    method: 'GET',
    url: 'https://fresh-linkedin-profile-data.p.rapidapi.com/get-extra-profile-data',
    params: {
      linkedin_url: 'https://www.linkedin.com/in/musayevcreate/',
      include_skills: 'true',
      include_recommendations: 'true'
    },
    headers: {
      'x-rapidapi-key': 'e69773e8c2msh50ce2f81e481a35p1888abjsn83f1b967cbe4',
      'x-rapidapi-host': 'fresh-linkedin-profile-data.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);

    if (response.status === 200) {
      const data = response.data;
      console.log('✅ RapidAPI Response received');

      console.log('\n🔍 Full Response Structure:');
      console.log('Response keys:', Object.keys(data));

      console.log('\n🔍 Skills Analysis:');
      console.log('Skills field exists:', 'skills' in data);
      console.log('Skills type:', typeof data.skills);
      console.log('Skills is array:', Array.isArray(data.skills));
      console.log('Skills length:', data.skills ? data.skills.length : 0);

      if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
        console.log('\n🎯 Skills Details:');
        data.skills.forEach((skill, index) => {
          console.log(`Skill ${index + 1}:`, skill);
        });
      } else {
        console.log('Skills content:', data.skills);
      }

      // Digər mümkün skill field-lərini yoxlayaq
      const skillRelatedFields = Object.keys(data).filter(field =>
        field.toLowerCase().includes('skill') ||
        field.toLowerCase().includes('competenc') ||
        field.toLowerCase().includes('abilit') ||
        field.toLowerCase().includes('expert') ||
        field.toLowerCase().includes('endorsement')
      );

      console.log('\n🔍 Skill-related fields found:', skillRelatedFields);

      skillRelatedFields.forEach(field => {
        console.log(`${field}:`, data[field]);
      });

      // Digər əsas məlumatları da göstərək
      console.log('\n📋 Other Profile Data:');
      console.log('Name:', data.full_name || data.name || data.firstName + ' ' + data.lastName);
      console.log('Headline:', data.headline);
      console.log('Experience count:', data.experience ? data.experience.length : 0);
      console.log('Education count:', data.education ? data.education.length : 0);

      // Full response for debugging
      console.log('\n📊 Full Response (first 2000 chars):');
      console.log(JSON.stringify(data, null, 2).substring(0, 2000) + '...');

    } else {
      console.log('❌ Request failed with status code:', response.status);
    }
  } catch (error) {
    console.error('❌ Error making the request:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testRapidAPISkills();
