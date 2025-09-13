const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

// Test volunteer experience and certifications import
async function testVolunteerAndCertifications() {
  console.log('🧪 Testing Volunteer Experience & Certifications Import\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Get active API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        service: 'scrapingdog',
        active: true
      },
      orderBy: {
        priority: 'asc'
      }
    });
    
    if (apiKeys.length === 0) {
      throw new Error('No active ScrapingDog API keys found');
    }
    
    console.log(`Found ${apiKeys.length} active API keys`);
    
    // Test with your profile (which should have volunteer/certifications data)
    const testProfile = 'musayevcreate';
    
    for (let i = 0; i < Math.min(apiKeys.length, 2); i++) {
      const apiKey = apiKeys[i];
      
      console.log(`\n--- Testing with API key ${i + 1}: ${apiKey.apiKey.substring(0, 8)}*** ---`);
      
      try {
        const params = {
          api_key: apiKey.apiKey,
          type: 'profile',
          linkId: testProfile,
          premium: 'true'
        };
        
        console.log('📡 Making ScrapingDog request...');
        const response = await axios.get('https://api.scrapingdog.com/linkedin', {
          params: params,
          timeout: 30000
        });
        
        if (response.status === 200) {
          const data = response.data;
          console.log('✅ Response received, size:', JSON.stringify(data).length, 'chars');
          
          // Check for volunteer and certification data in raw response
          console.log('\n🔍 Checking for volunteer data in response:');
          const volunteerFields = [
            'volunteering', 'volunteer', 'volunteer_experience', 
            'volunteerExperience', 'volunteer_work'
          ];
          
          volunteerFields.forEach(field => {
            if (data[field]) {
              console.log(`✅ Found ${field}:`, Array.isArray(data[field]) ? data[field].length + ' items' : typeof data[field]);
              if (Array.isArray(data[field]) && data[field].length > 0) {
                console.log('   Sample:', data[field][0]);
              }
            } else {
              console.log(`❌ No ${field} found`);
            }
          });
          
          console.log('\n🏆 Checking for certification data in response:');
          const certificationFields = [
            'certifications', 'certificates', 'certification', 'certificate'
          ];
          
          certificationFields.forEach(field => {
            if (data[field]) {
              console.log(`✅ Found ${field}:`, Array.isArray(data[field]) ? data[field].length + ' items' : typeof data[field]);
              if (Array.isArray(data[field]) && data[field].length > 0) {
                console.log('   Sample:', data[field][0]);
              }
            } else {
              console.log(`❌ No ${field} found`);
            }
          });
          
          // Check all top-level fields
          console.log('\n📋 All available fields in response:');
          Object.keys(data).forEach(key => {
            const value = data[key];
            if (Array.isArray(value)) {
              console.log(`  ${key}: Array[${value.length}]`);
            } else if (typeof value === 'object' && value !== null) {
              console.log(`  ${key}: Object`);
            } else {
              console.log(`  ${key}: ${typeof value}`);
            }
          });
          
          // If data is an array, check first element
          if (Array.isArray(data) && data.length > 0) {
            console.log('\n📋 Fields in first array element:');
            Object.keys(data[0]).forEach(key => {
              const value = data[0][key];
              if (Array.isArray(value)) {
                console.log(`  ${key}: Array[${value.length}]`);
              } else if (typeof value === 'object' && value !== null) {
                console.log(`  ${key}: Object`);
              } else {
                console.log(`  ${key}: ${typeof value}`);
              }
            });
          }
          
          break; // If successful, no need to try other keys
          
        } else {
          console.log(`❌ Failed with status: ${response.status}`);
        }
        
      } catch (error) {
        console.error(`❌ Error with key ${apiKey.apiKey.substring(0, 8)}***:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testVolunteerAndCertifications().catch(console.error);
