const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testFixedAPILogic() {
  console.log('🔍 Testing Fixed ScrapingDog Logic');
  console.log('==================================');
  
  try {
    // Get working API key using the new logic
    const workingKeys = await prisma.apiKey.findMany({
      where: {
        service: 'scrapingdog',
        active: true,
        lastResult: 'success'
      },
      orderBy: [
        { usageCount: 'asc' },
        { priority: 'asc' }
      ],
      take: 5
    });

    if (workingKeys.length === 0) {
      console.log('❌ No working keys found');
      return;
    }

    console.log(`✅ Found ${workingKeys.length} working keys`);
    
    // Test with least used key
    const bestKey = workingKeys[0];
    console.log(`🔑 Using key: ${bestKey.apiKey.substring(0, 8)}*** (Usage: ${bestKey.usageCount})`);
    
    // Test LinkedIn scraping
    const params = {
      api_key: bestKey.apiKey,
      type: 'profile',
      linkId: 'musayevcreate', // Test your profile
      premium: 'false'
    };
    
    console.log('📡 Making test request...');
    const response = await axios.get('https://api.scrapingdog.com/linkedin', {
      params: params,
      timeout: 20000
    });
    
    console.log('✅ SUCCESS! Status:', response.status);
    console.log('✅ Response keys:', Object.keys(response.data));
    
    if (response.data && typeof response.data === 'object') {
      // Check if it's an array (ScrapingDog format)
      if (Array.isArray(response.data) && response.data.length > 0) {
        const profile = response.data[0];
        console.log('📊 Profile data preview:', {
          fullName: profile.fullName || profile.name,
          headline: profile.headline,
          location: profile.location,
          experience: profile.experience?.length || 0,
          education: profile.education?.length || 0,
          skills: profile.skills?.length || 0
        });
      }
    }
    
    // Update key usage
    await prisma.apiKey.update({
      where: { id: bestKey.id },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date(),
        lastResult: 'success'
      }
    });
    
    console.log('✅ API key usage updated successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testFixedAPILogic();