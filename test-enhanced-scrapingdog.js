const path = require('path');
require('ts-node').register({
  project: path.join(__dirname, 'tsconfig.json'),
});

const { ScrapingDogLinkedInService } = require('./src/lib/services/scrapingdog-linkedin.ts');

// Test the enhanced ScrapingDog service with rotation and retry
async function testEnhancedScrapingDog() {
  console.log('🧪 Testing Enhanced ScrapingDog Service with Rotation & Retry\n');
  
  const service = new ScrapingDogLinkedInService();
  
  try {
    console.log('--- Testing with your profile ---');
    const profile = await service.scrapeLinkedInProfile('musayevcreate');
    
    if (profile) {
      console.log('✅ Profile scraped successfully:');
      console.log(`   Name: ${profile.name}`);
      console.log(`   Headline: ${profile.headline}`);
      console.log(`   Location: ${profile.location}`);
      console.log(`   Experience entries: ${profile.experience.length}`);
      console.log(`   Education entries: ${profile.education.length}`);
      console.log(`   Skills: ${profile.skills.length}`);
      
      if (profile.volunteering && profile.volunteering.length > 0) {
        console.log(`   Volunteer experiences: ${profile.volunteering.length}`);
      }
      
      if (profile.certifications && profile.certifications.length > 0) {
        console.log(`   Certifications: ${profile.certifications.length}`);
      }
      
    } else {
      console.log('❌ No profile data returned');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEnhancedScrapingDog().catch(console.error);
