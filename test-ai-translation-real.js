// Real AI Translation Test
const fs = require('fs');

async function testRealAITranslation() {
  const testData = {
    personalInfo: {
      name: "John Doe",
      email: "john@example.com",
      linkedin: "https://linkedin.com/in/johndoe",
      github: "https://github.com/johndoe",
      website: "https://johndoe.dev"
    },
    experience: [
      {
        title: "Senior Software Engineer",
        description: "Developed multiple projects including github.com/company/main-project and contributed to open source",
        company_url: "https://tech-company.com"
      }
    ],
    customSections: [
      {
        title: "Projects",
        content: "My portfolio: portfolio.dev and GitHub: github.com/johndoe/portfolio",
        link: "https://github.com/johndoe"
      }
    ]
  };

  console.log('🚀 Testing Real AI Translation API...\n');

  try {
    const response = await fetch('http://localhost:3000/api/ai/translate-cv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cvData: testData,
        targetLanguage: 'az'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Translation successful!');
    console.log('\n📝 Original data:');
    console.log(JSON.stringify(testData, null, 2));
    
    console.log('\n🔄 Translated data:');
    console.log(JSON.stringify(result.translatedData, null, 2));

    // Check link preservation
    const originalText = JSON.stringify(testData);
    const translatedText = JSON.stringify(result.translatedData);
    
    const testLinks = [
      'linkedin.com/in/johndoe',
      'github.com/johndoe',
      'johndoe.dev',
      'github.com/company/main-project',
      'tech-company.com',
      'portfolio.dev',
      'github.com/johndoe/portfolio'
    ];
    
    console.log('\n🔍 Link Preservation Check:');
    let allLinksPreserved = true;
    
    testLinks.forEach(link => {
      if (translatedText.includes(link)) {
        console.log(`✅ ${link} - PRESERVED`);
      } else {
        console.log(`❌ ${link} - MISSING`);
        allLinksPreserved = false;
      }
    });
    
    if (allLinksPreserved) {
      console.log('\n🎉 SUCCESS: All links preserved in real AI translation!');
    } else {
      console.log('\n⚠️ WARNING: Some links were lost during translation!');
    }

  } catch (error) {
    console.error('❌ Error testing AI translation:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure your Next.js development server is running:');
      console.log('   npm run dev');
    }
  }
}

testRealAITranslation();
