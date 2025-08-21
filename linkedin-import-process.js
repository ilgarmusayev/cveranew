const axios = require('axios');
const BrightDataLinkedInScraper = require('./brightdata-linkedin-scraper');

/**
 * BrightData LinkedIn Import - ScrapingDog formatına uyğun
 * Məlumatlar gələnə qədər "Məlumatlar toplanır..." göstərir
 * Sonra CV səhifəsində bütün məlumatları göstərir
 */

// BrightData API açarı və dataset ID
const api_key = process.env.BRIGHTDATA_API_KEY || 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae';

// ScrapingDog formatında parametrlər
const params = {
  api_key: api_key,
  type: 'profile',
  linkId: 'musayevcreate',
  premium: 'false',
};

console.log('🔍 LinkedIn Import Başladı');
console.log('=========================');

// Import prosesi
async function importLinkedInProfile() {
  const scraper = new BrightDataLinkedInScraper(api_key, 'gd_l1viktl72bvl7bjuj0');

  try {
    console.log('⏳ Məlumatlar toplanır...');
    console.log('LinkedIn profilindən məlumatlar gətirilir, xahiş edirik gözləyin...');
    console.log('');

    // Loading animation
    const loadingInterval = setInterval(() => {
      process.stdout.write('.');
    }, 1000);

    // BrightData-dan məlumatları al
    const response = await scraper.scrapeProfile(params.linkId, { premium: params.premium });

    // Loading animation-u dayandır
    clearInterval(loadingInterval);
    console.log('\n');

    if (response) {
      console.log('✅ Məlumatlar uğurla toplandı!');
      console.log('CV səhifəsində görüntülənir...');
      console.log('');

      // CV səhifəsində göstəriləcək məlumatlar
      const data = response;

      console.log('📋 CV Məlumatları - Hazır!');
      console.log('===========================');

      // 1. Şəxsi Məlumatlar
      if (data.personal_info) {
        console.log('👤 Şəxsi Məlumatlar:');
        console.log(`✓ Ad: ${data.personal_info.name || 'N/A'}`);
        console.log(`✓ Başlıq: ${data.personal_info.headline || 'N/A'}`);
        console.log(`✓ Yer: ${data.personal_info.location || 'N/A'}`);
        if (data.personal_info.summary) {
          console.log(`✓ Haqqında: ${data.personal_info.summary.substring(0, 100)}...`);
        }
        console.log('');
      }

      // 2. İş Təcrübəsi
      if (data.experience && data.experience.length > 0) {
        console.log('💼 İş Təcrübəsi:');
        data.experience.forEach((exp, index) => {
          console.log(`✓ ${index + 1}. ${exp.title} - ${exp.company}`);
          if (exp.duration) console.log(`   Müddət: ${exp.duration}`);
        });
        console.log('');
      }

      // 3. Təhsil
      if (data.education && data.education.length > 0) {
        console.log('🎓 Təhsil:');
        data.education.forEach((edu, index) => {
          console.log(`✓ ${index + 1}. ${edu.degree || 'Dərəcə'} - ${edu.school}`);
          if (edu.field_of_study) console.log(`   Sahə: ${edu.field_of_study}`);
        });
        console.log('');
      }

      // 4. Dillər
      if (data.languages && data.languages.length > 0) {
        console.log('🌐 Dillər:');
        data.languages.forEach((lang, index) => {
          console.log(`✓ ${index + 1}. ${lang.language} ${lang.proficiency ? '(' + lang.proficiency + ')' : ''}`);
        });
        console.log('');
      }

      // 5. Layihələr
      if (data.projects && data.projects.length > 0) {
        console.log('🚀 Layihələr:');
        data.projects.forEach((proj, index) => {
          console.log(`✓ ${index + 1}. ${proj.title}`);
        });
        console.log('');
      }

      // 6. Sertifikatlar
      if (data.certifications && data.certifications.length > 0) {
        console.log('🏆 Sertifikatlar:');
        data.certifications.forEach((cert, index) => {
          console.log(`✓ ${index + 1}. ${cert.name} - ${cert.issuer || 'N/A'}`);
        });
        console.log('');
      }

      // 7. Könüllü Təcrübə
      if (data.volunteering && data.volunteering.length > 0) {
        console.log('🤝 Könüllü Təcrübə:');
        data.volunteering.forEach((vol, index) => {
          console.log(`✓ ${index + 1}. ${vol.role} - ${vol.organization}`);
        });
        console.log('');
      }

      console.log('✅ CV həzirdir! Bütün məlumatlar CV səhifəsində göstərilir.');
      console.log('');

      // Return data for CV page
      return data;

    } else {
      console.log('❌ Məlumatlar alınmadı');
      throw new Error('LinkedIn məlumatları tapılmadı');
    }

  } catch (error) {
    console.log('');
    console.error('❌ Import xətası:', error.message);

    if (error.message.includes('timeout')) {
      console.log('💡 LinkedIn import uzun çəkir, xahiş edirik bir qədər daha gözləyin');
    } else if (error.message.includes('authentication')) {
      console.log('💡 API açarı problemi, yenidən cəhd edin');
    }

    throw error;
  }
}

// ScrapingDog formatında istifadə
console.log('🔄 LinkedIn import prosesi başlayır...');
importLinkedInProfile()
  .then(function(data) {
    console.log('🎉 Import tamamlandı!');
    console.log('CV səhifəsində bütün məlumatlar mövcuddur.');
  })
  .catch(function(error) {
    console.error('❌ Import uğursuz oldu:', error.message);
  });

module.exports = {
  importLinkedInProfile,
  params
};
