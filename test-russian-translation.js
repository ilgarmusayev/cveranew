const axios = require('axios');
const { config } = require('dotenv');

config();

async function testRussianTranslation() {
  console.log('\n🇷🇺 Testing Russian CV Translation...\n');

  const testCV = {
    personalInfo: {
      fullName: "Elçin Musayev",
      position: "Software Developer",
      email: "elchin@example.com",
      phone: "+994 55 123 45 67",
      location: "Bakı, Azərbaycan"
    },
    summary: "Təcrübəli proqram təminatı mütəxəssisi",
    experience: [
      {
        company: "Tech Şirkəti",
        position: "Senior Developer",
        duration: "2020-2024",
        description: "Web tətbiqləri hazırlamaq və komanda ilə işləmək"
      }
    ],
    skills: ["JavaScript", "React.js", "Node.js", "PostgreSQL"],
    education: [
      {
        institution: "Bakı Dövlət Universiteti",
        degree: "Proqram Mühəndisliyi",
        year: "2016-2020"
      }
    ]
  };

  try {
    const response = await axios.post('http://localhost:3000/api/ai/translate-cv', {
      cvData: testCV,
      targetLanguage: 'ru'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Russian Translation Status:', response.status);
    console.log('📄 Translated CV Data:');
    console.log(JSON.stringify(response.data, null, 2));

    // Check if Russian section names are applied
    const translatedData = response.data;
    if (translatedData.personalInfo) {
      console.log('\n🔍 Section Names Check:');
      console.log('Personal Info translated to Russian:', translatedData.personalInfo);
    }

  } catch (error) {
    console.error('❌ Russian Translation Error:', error.response?.data || error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
}

// Run the test
testRussianTranslation();