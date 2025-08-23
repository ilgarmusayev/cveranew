require('dotenv').config();
const { ScrapingDogLinkedInService } = require('./src/lib/services/scrapingdog-linkedin.ts');

async function testScrapingDogService() {
  try {
    console.log('🔍 ScrapingDog LinkedIn Service test başlayır...');
    
    const service = new ScrapingDogLinkedInService();
    const result = await service.scrapeLinkedInProfile('https://www.linkedin.com/in/musayevcreate/');
    
    if (result) {
      console.log('✅ Service uğurlu!');
      console.log('📋 Profile məlumatları:', {
        name: result.name,
        firstName: result.firstName,
        lastName: result.lastName,
        headline: result.headline,
        location: result.location,
        summary: result.summary.substring(0, 100) + '...',
        experienceCount: result.experience.length,
        educationCount: result.education.length,
        skillsCount: result.skills.length,
        projectsCount: result.projects?.length || 0,
        awardsCount: result.awards?.length || 0
      });
      
      console.log('\n🏢 Experience sample:');
      if (result.experience.length > 0) {
        console.log(result.experience[0]);
      }
      
      console.log('\n🎓 Education sample:');
      if (result.education.length > 0) {
        console.log(result.education[0]);
      }
      
      console.log('\n🏆 Awards sample:');
      if (result.awards && result.awards.length > 0) {
        console.log(result.awards[0]);
      }
    } else {
      console.log('❌ Service uğursuz');
    }
  } catch (error) {
    console.error('❌ Test xətası:', error);
  }
}

testScrapingDogService();
