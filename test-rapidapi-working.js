const axios = require('axios');

async function testRapidAPISkillsWorking() {
  console.log('🔍 Testing RapidAPI Fresh LinkedIn Profile Data - Skills Endpoint...');

  const config = {
    method: 'GET',
    url: 'https://fresh-linkedin-profile-data.p.rapidapi.com/get-extra-profile-data',
    params: {
      linkedin_url: 'https://www.linkedin.com/in/musayevcreate'
    },
    headers: {
      'x-rapidapi-host': 'fresh-linkedin-profile-data.p.rapidapi.com',
      'x-rapidapi-key': 'e69773e8c2msh50ce2f81e481a35p1888abjsn83f1b967cbe4'
    },
    timeout: 30000
  };

  try {
    console.log('📡 Making request to RapidAPI...');
    console.log('🔗 URL:', config.url);
    console.log('📋 LinkedIn URL:', config.params.linkedin_url);

    const response = await axios(config);

    console.log('✅ Success! Status:', response.status);

    const data = response.data;

    // Analiz edelim ki skills harada var
    console.log('\n🔍 Response Analysis:');
    console.log('Response type:', typeof data);
    console.log('Available fields:', Object.keys(data));

    // Skills axtaraq
    console.log('\n🎯 Skills Analysis:');
    if (data.skills) {
      console.log('✅ Skills field found!');
      console.log('Skills type:', typeof data.skills);
      console.log('Skills is array:', Array.isArray(data.skills));
      console.log('Skills length:', data.skills ? data.skills.length : 0);

      if (Array.isArray(data.skills) && data.skills.length > 0) {
        console.log('\n📋 Skills Details:');
        data.skills.forEach((skill, index) => {
          console.log(`Skill ${index + 1}:`, skill);
        });
      }
    } else {
      console.log('❌ No direct skills field found');
    }

    // Skill-related sahələri axtaraq
    const skillFields = Object.keys(data).filter(key =>
      key.toLowerCase().includes('skill') ||
      key.toLowerCase().includes('competenc') ||
      key.toLowerCase().includes('endorsement')
    );

    if (skillFields.length > 0) {
      console.log('\n🔍 Skill-related fields found:', skillFields);
      skillFields.forEach(field => {
        console.log(`${field}:`, data[field]);
      });
    }

    // Digər məlumatları da göstərək
    console.log('\n📊 Other Profile Data:');
    console.log('Name:', data.full_name || data.name);
    console.log('Headline:', data.headline);
    console.log('Experience count:', data.experience ? data.experience.length : 0);
    console.log('Education count:', data.education ? data.education.length : 0);

    // Full response structure (ilk 3000 simvol)
    console.log('\n📝 Full Response (preview):');
    const responseStr = JSON.stringify(data, null, 2);
    console.log(responseStr.substring(0, 3000) + (responseStr.length > 3000 ? '...\n[TRUNCATED]' : ''));

    return data;

  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('Error message:', error.message);

    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response headers:', error.response.headers);
      console.log('Response data:', error.response.data);
    } else if (error.request) {
      console.log('No response received');
      console.log('Request details:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
    }

    return null;
  }
}

// Test normal profile endpoint də
async function testNormalProfileEndpoint() {
  console.log('\n🔍 Testing normal profile endpoint as backup...');

  const config = {
    method: 'GET',
    url: 'https://fresh-linkedin-profile-data.p.rapidapi.com/get-linkedin-profile',
    params: {
      linkedin_url: 'https://www.linkedin.com/in/musayevcreate'
    },
    headers: {
      'x-rapidapi-host': 'fresh-linkedin-profile-data.p.rapidapi.com',
      'x-rapidapi-key': 'e69773e8c2msh50ce2f81e481a35p1888abjsn83f1b967cbe4'
    },
    timeout: 30000
  };

  try {
    const response = await axios(config);
    console.log('✅ Normal endpoint - Status:', response.status);

    const data = response.data;
    console.log('Available fields:', Object.keys(data));

    if (data.skills) {
      console.log('Skills found in normal endpoint:', data.skills);
    }

    return data;

  } catch (error) {
    console.log('❌ Normal endpoint error:', error.response?.status, error.response?.data || error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting RapidAPI LinkedIn Skills Tests...\n');

  // Test əsas endpoint
  const extraData = await testRapidAPISkillsWorking();

  // Test normal endpoint
  const normalData = await testNormalProfileEndpoint();

  console.log('\n📊 Test Summary:');
  console.log('Extra endpoint success:', !!extraData);
  console.log('Normal endpoint success:', !!normalData);

  if (extraData?.skills || normalData?.skills) {
    console.log('🎉 SKILLS FOUND! We can proceed with integration.');
  } else {
    console.log('⚠️ No skills found in either endpoint.');
  }
}

runAllTests();
