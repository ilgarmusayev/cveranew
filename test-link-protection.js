const fs = require('fs');

// Test link protection system
async function testLinkProtection() {
  console.log('🧪 Testing AI Translation Link Protection System\n');
  
  // Test data with various links
  const testCV = {
    personalInfo: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1-234-567-8900",
      linkedin: "https://linkedin.com/in/johndoe",
      github: "https://github.com/johndoe",
      website: "https://johndoe.dev",
      portfolio: "www.johndoe-portfolio.com"
    },
    experience: [
      {
        title: "Software Engineer",
        company: "Tech Company",
        description: "Worked on projects like https://project1.com and contributed to open source at https://github.com/company/repo",
        url: "https://company.com"
      }
    ],
    projects: [
      {
        name: "Portfolio Website",
        description: "Created my portfolio at https://johndoe.dev with React",
        github: "https://github.com/johndoe/portfolio",
        demo: "https://portfolio-demo.vercel.app"
      },
      {
        name: "E-commerce App",
        description: "Built an e-commerce platform. Live demo: www.mystore.com and source code: github.com/johndoe/ecommerce",
        url: "https://mystore.herokuapp.com"
      }
    ],
    sectionNames: {
      personalInfo: "Personal Information",
      experience: "Work Experience",
      projects: "Projects"
    }
  };
  
  try {
    // Make request to translation API
    console.log('📡 Sending test data to translation API...');
    
    const response = await fetch('http://localhost:3000/api/ai/translate-cv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.TEST_JWT_TOKEN || 'test-token'
      },
      body: JSON.stringify({
        cvData: testCV,
        targetLanguage: 'az',
        sourceLanguage: 'en'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Translation completed successfully!\n');
    
    // Check if links are preserved
    console.log('🔍 Checking link preservation...\n');
    
    const originalLinks = extractLinksFromObject(testCV);
    const translatedLinks = extractLinksFromObject(result.translatedData || result);
    
    console.log('📋 Original links found:');
    originalLinks.forEach(link => console.log(`   ✓ ${link}`));
    
    console.log('\n📋 Links in translated data:');
    translatedLinks.forEach(link => console.log(`   ✓ ${link}`));
    
    // Compare links
    const preserved = originalLinks.every(link => translatedLinks.includes(link));
    
    if (preserved && originalLinks.length === translatedLinks.length) {
      console.log('\n🎉 SUCCESS: All links preserved correctly!');
    } else {
      console.log('\n❌ WARNING: Some links may have been modified!');
      console.log('Missing links:', originalLinks.filter(link => !translatedLinks.includes(link)));
      console.log('Extra links:', translatedLinks.filter(link => !originalLinks.includes(link)));
    }
    
    // Save results for inspection
    fs.writeFileSync('test-link-protection-results.json', JSON.stringify({
      original: testCV,
      translated: result,
      linkComparison: {
        original: originalLinks,
        translated: translatedLinks,
        preserved
      }
    }, null, 2));
    
    console.log('\n📄 Results saved to test-link-protection-results.json');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Helper function to extract all links from an object
function extractLinksFromObject(obj) {
  const links = [];
  const urlPatterns = [
    /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi,
    /www\.[^\s<>"{}|\\^`[\]]+/gi,
    /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"{}|\\^`[\]]*)?/gi
  ];
  
  function searchInValue(value) {
    if (typeof value === 'string') {
      urlPatterns.forEach(pattern => {
        const matches = value.match(pattern) || [];
        matches.forEach(match => {
          if (!links.includes(match)) {
            links.push(match);
          }
        });
      });
    } else if (Array.isArray(value)) {
      value.forEach(item => searchInValue(item));
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(val => searchInValue(val));
    }
  }
  
  searchInValue(obj);
  return links;
}

// Run the test
testLinkProtection().catch(console.error);
