const axios = require('axios');

async function testRussianTranslationSimple() {
  console.log('\n🇷🇺 Testing Russian CV Translation API...\n');

  const testCV = {
    personalInfo: {
      fullName: "Elçin Musayev",
      position: "Software Developer"
    },
    summary: "Təcrübəli proqram təminatı mütəxəssisi",
    experience: [
      {
        company: "Tech Şirkəti",
        position: "Senior Developer",
        description: "Web tətbiqləri hazırlamaq"
      }
    ]
  };

  try {
    console.log('📤 Sending request to translation API...');
    
    const response = await axios.post('http://localhost:3000/api/ai/translate-cv', {
      cvData: testCV,
      targetLanguage: 'russian',  // Frontend sends 'russian' 
      sourceLanguage: 'auto'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Response Status:', response.status);
    console.log('📄 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Translation Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testRussianTranslationSimple();