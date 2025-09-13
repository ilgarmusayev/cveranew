// Test link protection functions locally

// Mock the link protection functions from the API
function extractAndProtectLinks(content) {
  const linkMap = new Map();
  let linkCounter = 0;
  
  // URL patterns to detect links
  const urlPatterns = [
    /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi,
    /www\.[^\s<>"{}|\\^`[\]]+/gi,
    /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"{}|\\^`[\]]*)?/gi
  ];
  
  function replaceLinkInText(text) {
    if (typeof text !== 'string') return text;
    
    urlPatterns.forEach(pattern => {
      text = text.replace(pattern, (match) => {
        const placeholder = `__LINK_PLACEHOLDER_${linkCounter}__`;
        linkMap.set(placeholder, match);
        linkCounter++;
        return placeholder;
      });
    });
    
    return text;
  }
  
  function recursivelyProtectLinks(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => recursivelyProtectLinks(item));
    } else if (obj && typeof obj === 'object') {
      const newObj = {};
      for (const [key, value] of Object.entries(obj)) {
        newObj[key] = recursivelyProtectLinks(value);
      }
      return newObj;
    } else if (typeof obj === 'string') {
      return replaceLinkInText(obj);
    }
    return obj;
  }
  
  return {
    content: recursivelyProtectLinks(content),
    linkMap
  };
}

function restoreLinks(content, linkMap) {
  function restoreLinkInText(text) {
    if (typeof text !== 'string') return text;
    
    linkMap.forEach((originalLink, placeholder) => {
      text = text.replace(new RegExp(placeholder, 'g'), originalLink);
    });
    
    return text;
  }
  
  function recursivelyRestoreLinks(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => recursivelyRestoreLinks(item));
    } else if (obj && typeof obj === 'object') {
      const newObj = {};
      for (const [key, value] of Object.entries(obj)) {
        newObj[key] = recursivelyRestoreLinks(value);
      }
      return newObj;
    } else if (typeof obj === 'string') {
      return restoreLinkInText(obj);
    }
    return obj;
  }
  
  return recursivelyRestoreLinks(content);
}

// Test the link protection system
function testLinkProtectionLocal() {
  console.log('🧪 Testing Link Protection System Locally\n');
  
  const testData = {
    personalInfo: {
      name: "Musayev Create",
      email: "musayev@example.com",
      linkedin: "https://linkedin.com/in/musayevcreate",
      github: "https://github.com/musayevcreate",
      website: "https://musayev.dev",
      portfolio: "www.musayev-portfolio.com"
    },
    experience: [
      {
        title: "Software Engineer",
        description: "İşlədiyi layihələr: https://project1.com və github.com/company/repo-da açıq mənbə koda töhfə verdi",
        company_url: "https://company.com"
      }
    ],
    projects: [
      {
        name: "Portfolio Saytı",
        description: "React ilə https://musayev.dev saytı yaratdı",
        github: "https://github.com/musayev/portfolio",
        demo: "https://portfolio-demo.vercel.app"
      }
    ],
    customSections: [
      {
        title: "Layihələr",
        content: "GitHub: github.com/musayev/project1 və portfolio: musayev.dev",
        link: "https://github.com/musayev"
      },
      {
        title: "Əlavə",
        content: "Portfolio saytım https://portfolio.dev da və demo: demo.vercel.app da mövcuddur",
        url: "portfolio.dev"
      }
    ]
  };
  
  console.log('📝 Original data:');
  console.log(JSON.stringify(testData, null, 2));
  
  // Step 1: Extract and protect links
  const { content: protectedContent, linkMap } = extractAndProtectLinks(testData);
  
  console.log('\n🔒 Protected content (links replaced with placeholders):');
  console.log(JSON.stringify(protectedContent, null, 2));
  
  console.log('\n🗺️ Link map:');
  linkMap.forEach((originalLink, placeholder) => {
    console.log(`  ${placeholder} → ${originalLink}`);
  });
  
  // Simulate translation (just modify some text while keeping placeholders)
  const simulatedTranslation = JSON.parse(JSON.stringify(protectedContent));
  if (simulatedTranslation.personalInfo.name) {
    simulatedTranslation.personalInfo.name = "Musiav Yaratmag"; // Simulated translation
  }
  if (simulatedTranslation.experience[0].title) {
    simulatedTranslation.experience[0].title = "Proqram Təminatı Mühəndisi"; // Simulated translation
  }
  
  console.log('\n🔄 Simulated translated content (with placeholders):');
  console.log(JSON.stringify(simulatedTranslation, null, 2));
  
  // Step 2: Restore links
  const finalContent = restoreLinks(simulatedTranslation, linkMap);
  
  console.log('\n✅ Final content (links restored):');
  console.log(JSON.stringify(finalContent, null, 2));
  
  // Verify links are preserved
  const originalLinks = extractLinksFromObject(testData);
  const finalLinks = extractLinksFromObject(finalContent);
  
  console.log('\n🔍 Link preservation check:');
  console.log(`Original links: ${originalLinks.length}`);
  originalLinks.forEach(link => console.log(`  ✓ ${link}`));
  
  console.log(`\nFinal links: ${finalLinks.length}`);
  finalLinks.forEach(link => console.log(`  ✓ ${link}`));
  
  const allPreserved = originalLinks.every(link => finalLinks.includes(link)) && 
                       originalLinks.length === finalLinks.length;
  
  if (allPreserved) {
    console.log('\n🎉 SUCCESS: All links preserved perfectly!');
  } else {
    console.log('\n❌ ERROR: Some links were lost or modified!');
  }
  
  return { originalLinks, finalLinks, allPreserved };
}

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
testLinkProtectionLocal();
