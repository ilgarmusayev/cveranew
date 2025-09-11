// Test LinkedIn username extraction
function testLinkedInUsernameExtraction() {
  const extractLinkedInUsername = (input) => {
    if (!input?.trim()) return null;

    const cleanInput = input.trim();

    // If it's already just a username (no URL), return it
    if (!cleanInput.includes('/') && !cleanInput.includes('linkedin.com')) {
      return cleanInput.replace('@', ''); // Remove @ if present
    }

    // Extract from LinkedIn URL patterns - supports various formats:
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-_.]+)/i,
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/pub\/([a-zA-Z0-9\-_.]+)/i,
    ];

    for (const pattern of patterns) {
      const match = cleanInput.match(pattern);
      if (match?.[1]) {
        return match[1].replace(/\/$/, '').split('?')[0].split('#')[0];
      }
    }

    return null;
  };

  const testCases = [
    // URLs
    'https://www.linkedin.com/in/afetkhalilli/',
    'https://linkedin.com/in/afetkhalilli',
    'www.linkedin.com/in/afetkhalilli',
    'linkedin.com/in/afetkhalilli',
    'https://www.linkedin.com/in/afetkhalilli?trk=public_profile',
    
    // Plain usernames
    'afetkhalilli',
    'musayevcreate',
    '@afetkhalilli',
    
    // Edge cases
    'https://www.linkedin.com/in/afet-khalilli-123/',
    'https://www.linkedin.com/in/afet_khalilli_123',
    'linkedin.com/in/afet.khalilli.123',
  ];

  console.log('🔍 Testing LinkedIn Username Extraction:');
  console.log('==========================================');
  
  testCases.forEach(testCase => {
    const result = extractLinkedInUsername(testCase);
    console.log(`✅ "${testCase}" → "${result}"`);
  });
}

testLinkedInUsernameExtraction();
