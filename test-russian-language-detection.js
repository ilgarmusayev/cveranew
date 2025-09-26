const axios = require('axios');

async function testRussianLanguageDetection() {
  console.log('\n🇷🇺 Testing Russian Language Detection...\n');

  const testCV = {
    personalInfo: {
      fullName: "Test User",
      title: "Software Developer",
      summary: "Experienced software developer"
    }
  };

  try {
    console.log('📤 Sending CV to translate to Russian...');
    
    const response = await axios.post('http://localhost:3000/api/ai/translate-cv', {
      cvData: testCV,
      targetLanguage: 'russian',
      sourceLanguage: 'auto'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 45000
    });

    console.log('✅ Translation Response Status:', response.status);
    
    if (response.data && response.data.translatedData) {
      const translatedData = response.data.translatedData;
      
      console.log('\n🔍 Language Detection Data:');
      console.log('==========================================');
      console.log('cvLanguage:', translatedData.cvLanguage);
      console.log('translationMetadata.targetLanguage:', translatedData.translationMetadata?.targetLanguage);
      console.log('translationMetadata.frontendTargetLanguage:', translatedData.translationMetadata?.frontendTargetLanguage);
      console.log('Has Cyrillic in summary:', /[а-яё]/i.test(translatedData.personalInfo?.summary || ''));
      console.log('Has Cyrillic in title:', /[а-яё]/i.test(translatedData.personalInfo?.title || ''));
      
      console.log('\n📝 Translated Content:');
      console.log('Title:', translatedData.personalInfo?.title);
      console.log('Summary (first 100 chars):', translatedData.personalInfo?.summary?.substring(0, 100));
      
    } else {
      console.log('📄 Full Response:');
      console.log(JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Translation Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testRussianLanguageDetection();