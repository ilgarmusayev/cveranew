const { PrismaClient } = require('@prisma/client');
const { ScrapingDogLinkedInService } = require('./src/lib/services/scrapingdog-linkedin.ts');

// Test transformation after fix
async function testTransformationAfterFix() {
  console.log('🧪 Testing Transformation After Fix\n');
  
  const prisma = new PrismaClient();
  const scrapingDogService = new ScrapingDogLinkedInService(prisma);
  
  try {
    // Sample data based on what we saw in the API response
    const sampleData = [{
      fullName: "Test User",
      linkedin_internal_id: "test123",
      first_name: "Test",
      last_name: "User",
      public_identifier: "testuser",
      headline: "Test Headline",
      location: "Test Location",
      about: "Test About",
      experience: [],
      education: [],
      volunteering: [
        {
          organization: "Red Cross",
          role: "Volunteer Coordinator",
          cause: "Healthcare",
          duration: "2020-2023",
          description: "Coordinated volunteer activities"
        }
      ],
      certification: [
        {
          name: "AWS Solutions Architect",
          organization: "Amazon Web Services",
          issueDate: "2023-01-01",
          credentialId: "AWS123456"
        }
      ],
      projects: [],
      awards: []
    }];
    
    console.log('📊 Sample input data:');
    console.log('Volunteering:', sampleData[0].volunteering);
    console.log('Certification:', sampleData[0].certification);
    
    // Transform the data
    const transformed = await scrapingDogService.transformScrapingDogData(sampleData);
    
    console.log('\n✅ Transformed data:');
    console.log('Volunteering:', transformed.volunteering);
    console.log('Certifications:', transformed.certifications);
    
    // Check if data is properly transformed
    if (transformed.volunteering && transformed.volunteering.length > 0) {
      console.log('\n🎉 Volunteer data successfully transformed!');
      console.log('First volunteer:', transformed.volunteering[0]);
    } else {
      console.log('\n❌ No volunteer data in transformed result');
    }
    
    if (transformed.certifications && transformed.certifications.length > 0) {
      console.log('\n🏆 Certification data successfully transformed!');
      console.log('First certification:', transformed.certifications[0]);
    } else {
      console.log('\n❌ No certification data in transformed result');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTransformationAfterFix().catch(console.error);
