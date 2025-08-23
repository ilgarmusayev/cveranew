const axios = require('axios');

async function testComprehensiveLinkedInImport() {
  try {
    console.log('🔧 LinkedIn-dən tam məlumat import testi...');
    
    // Test istifadəçisi üçün login edərək token alırıq
    console.log('🔐 Login edilir...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'musayev@gmail.com',
      password: 'test123'
    });

    if (!loginResponse.data.token) {
      throw new Error('Token alınmadı');
    }

    const token = loginResponse.data.token;
    console.log('✅ Token alındı');

    // LinkedIn import test
    console.log('📱 LinkedIn import başlanır...');
    const importResponse = await axios.post('http://localhost:3000/api/import/linkedin', {
      username: 'musayevcreate'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ LinkedIn import uğurlu!');
    console.log('📊 Import nəticəsi:', JSON.stringify(importResponse.data, null, 2));
    
    if (importResponse.data.success && importResponse.data.cvId) {
      console.log('\n🎉 CV uğurla yaradıldı!');
      console.log(`📋 CV ID: ${importResponse.data.cvId}`);
      console.log(`👤 Ad: ${importResponse.data.summary?.name}`);
      console.log(`💼 İş təcrübəsi: ${importResponse.data.summary?.experienceCount || 0}`);
      console.log(`🎓 Təhsil: ${importResponse.data.summary?.educationCount || 0}`);
      console.log(`🔧 Bacarıqlar: ${importResponse.data.summary?.skillsCount || 0}`);
      console.log(`📂 Layihələr: ${importResponse.data.summary?.projectsCount || 0}`);
      console.log(`🏆 Mükafatlar: ${importResponse.data.summary?.awardsCount || 0}`);
      console.log(`�️ Şərəf mükafatları: ${importResponse.data.summary?.honorsCount || 0}`);
      console.log(`📜 Sertifikatlar: ${importResponse.data.summary?.certificationsCount || 0}`);
      console.log(`🌍 Dillər: ${importResponse.data.summary?.languagesCount || 0}`);
      console.log(`❤️ Könüllü işlər: ${importResponse.data.summary?.volunteeringCount || 0}`);
      console.log(`📈 Ümumi bölmələr: ${importResponse.data.summary?.totalSections || 0}`);
      
      console.log('\n💾 CV məlumatlarını yoxlayırıq...');
      
      // CV məlumatlarını yoxla
      const cvResponse = await axios.get(`http://localhost:3000/api/cvs/${importResponse.data.cvId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (cvResponse.data.success) {
        const cvData = cvResponse.data.cv.cv_data;
        console.log('📋 CV məlumatları uğurla alındı:');
        console.log(`- Şəxsi məlumatlar: ${cvData.personalInfo?.fullName || 'Yoxdur'}`);
        console.log(`- İş təcrübəsi sayı: ${cvData.experience?.length || 0}`);
        console.log(`- Təhsil sayı: ${cvData.education?.length || 0}`);
        console.log(`- Bacarıq sayı: ${cvData.skills?.length || 0}`);
        console.log(`- Layihə sayı: ${cvData.projects?.length || 0}`);
        console.log(`- Mükafat sayı: ${cvData.awards?.length || 0}`);
        console.log(`- Şərəf mükafatı sayı: ${cvData.honors?.length || 0}`);
        console.log(`- Sertifikat sayı: ${cvData.certifications?.length || 0}`);
        console.log(`- Dil sayı: ${cvData.languages?.length || 0}`);
        console.log(`- Könüllü təcrübə sayı: ${cvData.volunteering?.length || 0}`);
        
        // Detaylı məlumatları göstər
        if (cvData.personalInfo) {
          console.log('\n👤 Şəxsi məlumatlar:');
          console.log(`  - Ad: ${cvData.personalInfo.fullName}`);
          console.log(`  - Başlıq: ${cvData.personalInfo.title}`);
          console.log(`  - Yer: ${cvData.personalInfo.location}`);
          console.log(`  - Xülasə: ${cvData.personalInfo.summary?.substring(0, 100)}...`);
        }
        
        if (cvData.experience?.length > 0) {
          console.log('\n💼 İş təcrübəsi (ilk 2):');
          cvData.experience.slice(0, 2).forEach((exp, i) => {
            console.log(`  ${i+1}. ${exp.position} @ ${exp.company} (${exp.startDate} - ${exp.endDate || 'Hal-hazırda'})`);
          });
        }
      } else {
        console.log('❌ CV məlumatları alınmadı');
      }
    }

  } catch (error) {
    console.error('❌ Test xətası:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('🔑 Authentication problemi - credentials yoxlanılmalıdır');
    }
  }
}

testComprehensiveLinkedInImport();
