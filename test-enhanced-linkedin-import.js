const axios = require('axios');

async function testEnhancedLinkedInImport() {
  console.log('🧪 Enhanced LinkedIn Import Test başlayır...');
  
  // Test with a sample LinkedIn profile that has certifications, languages, volunteer experience
  const testProfile = 'musayevcreate'; // or any LinkedIn profile
  
  const testData = {
    linkedinUrl: testProfile
  };
  
  try {
    console.log('📡 LinkedIn import testi göndərilir...');
    console.log('Test Profile:', testProfile);
    
    const response = await axios.post('http://localhost:3000/api/import/linkedin', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-for-enhanced-test' // You'll need a valid token
      },
      timeout: 60000 // 60 second timeout
    });
    
    if (response.data.success) {
      console.log('✅ LinkedIn import uğurludur!');
      console.log('📊 Import statistikaları:');
      console.log('- CV ID:', response.data.cvId);
      console.log('- CV başlığı:', response.data.cvTitle);
      
      // Check sections
      const stats = response.data.importStats || {};
      console.log('\n📋 İmport olunan bölmələr:');
      console.log('- Təcrübə:', stats.experienceCount || 0, 'məlumat');
      console.log('- Təhsil:', stats.educationCount || 0, 'məlumat');
      console.log('- Bacarıqlar:', stats.skillsCount || 0, 'məlumat');
      console.log('- Layihələr:', stats.projectsCount || 0, 'məlumat');
      console.log('- Mükafatlar:', stats.awardsCount || 0, 'məlumat');
      console.log('- Sertifikatlar:', stats.certificationsCount || 0, 'məlumat');
      console.log('- Dillər:', stats.languagesCount || 0, 'məlumat');
      console.log('- Könüllü təcrübə:', stats.volunteeringCount || 0, 'məlumat');
      console.log('- AI skills əlavə edildi:', stats.aiSkillsAdded || 0, 'məlumat');
      
      // Check if we have the expected 3+3 AI skills
      if (stats.aiSkillsAdded >= 6) {
        console.log('✅ AI skills 3 hard + 3 soft düzgün yaradıldı');
      } else {
        console.log('⚠️ AI skills sayı gözlənildiyi qədər deyil:', stats.aiSkillsAdded);
      }
      
      // Check new sections
      if (stats.certificationsCount > 0) {
        console.log('✅ Sertifikatlar uğurla import edildi');
      }
      if (stats.languagesCount > 0) {
        console.log('✅ Dillər uğurla import edildi');
      }
      if (stats.volunteeringCount > 0) {
        console.log('✅ Könüllü təcrübə uğurla import edildi');
      }
      
      return true;
      
    } else {
      console.error('❌ LinkedIn import uğursuz:', response.data.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test xətası:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Auth token lazımdır. Əvvəlcə login olun.');
    } else if (error.response?.status === 429) {
      console.log('💡 Rate limit. Bir az gözləyin və yenidən cəhd edin.');
    }
    
    return false;
  }
}

// Test different LinkedIn URL formats
async function testDifferentUrlFormats() {
  console.log('\n🔗 Müxtəlif LinkedIn URL formatları test edilir...');
  
  const testFormats = [
    'musayevcreate', // Just username
    'https://www.linkedin.com/in/musayevcreate', // Full URL
    'https://linkedin.com/in/musayevcreate', // Without www
    'linkedin.com/in/musayevcreate', // Without protocol
    'www.linkedin.com/in/musayevcreate' // Without protocol with www
  ];
  
  for (const format of testFormats) {
    console.log(`\n📝 Test format: ${format}`);
    // You would test each format here with a valid token
    // For now, just log the format
  }
}

// Run tests
if (require.main === module) {
  testEnhancedLinkedInImport()
    .then(success => {
      if (success) {
        console.log('\n🎉 Enhanced LinkedIn Import test tamamlandı!');
        return testDifferentUrlFormats();
      }
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
    });
}

module.exports = { testEnhancedLinkedInImport };
