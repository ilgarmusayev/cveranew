const axios = require('axios');

async function testRussianDateTranslation() {
  console.log('\n🇷🇺 Testing Russian Date Translation...\n');

  const testCV = {
    personalInfo: {
      fullName: "Elçin Musayev",
      summary: "Təcrübəli proqram təminatı mütəxəssisi"
    },
    experience: [
      {
        company: "Tech Şirkəti",
        position: "Senior Developer",
        startDate: "January 2020",
        endDate: "December 2023",
        duration: "January 2020 - December 2023",
        description: "İş təcrübəsi Mart 2020-ci ildən başlayıb"
      }
    ],
    education: [
      {
        institution: "Bakı Dövlət Universiteti",
        degree: "Proqram Mühəndisliyi",
        startDate: "September 2016",
        endDate: "June 2020",
        duration: "Sentyabr 2016 - İyun 2020"
      }
    ]
  };

  try {
    console.log('📤 Sending request to test Russian date translation...');
    
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

    console.log('✅ Response Status:', response.status);
    
    if (response.data && response.data.translatedData) {
      const translatedData = response.data.translatedData;
      
      console.log('\n📅 Date Translation Results:');
      console.log('==========================================');
      
      if (translatedData.experience && translatedData.experience[0]) {
        const exp = translatedData.experience[0];
        console.log('Experience Dates:');
        console.log('  Start Date:', exp.startDate);
        console.log('  End Date:', exp.endDate);
        console.log('  Duration:', exp.duration);
        console.log('  Description:', exp.description);
      }
      
      if (translatedData.education && translatedData.education[0]) {
        const edu = translatedData.education[0];
        console.log('\nEducation Dates:');
        console.log('  Start Date:', edu.startDate);
        console.log('  End Date:', edu.endDate);
        console.log('  Duration:', edu.duration);
      }
      
      console.log('\n📄 Full translated response:');
      console.log(JSON.stringify(translatedData, null, 2));
    } else {
      console.log('📄 Full Response Data:');
      console.log(JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Translation Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testRussianDateTranslation();