const { ScrapingDogLinkedInService } = require('../src/lib/services/scrapingdog-linkedin.ts');

async function testFixedScrapingDog() {
  console.log('🔍 Testing Fixed ScrapingDog Service');
  console.log('===================================');
  
  try {
    const service = new ScrapingDogLinkedInService();
    
    // Test with working LinkedIn profile
    const result = await service.scrapeLinkedInProfile('williamhgates');
    
    console.log('✅ SUCCESS! Profile scraped successfully');
    console.log('Profile data:', {
      name: result?.name,
      headline: result?.headline,
      location: result?.location,
      experienceCount: result?.experience?.length || 0,
      educationCount: result?.education?.length || 0,
      skillsCount: result?.skills?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFixedScrapingDog();