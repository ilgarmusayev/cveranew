const axios = require('axios');
const BrightDataLinkedInScraper = require('./brightdata-linkedin-scraper');

// ScrapingDog formatına uyğun parametrlər
const api_key = process.env.BRIGHTDATA_API_KEY || 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae';

const params = {
  api_key: api_key,
  type: 'profile',
  linkId: 'musayevcreate',
  premium: 'false',
};

console.log('🔍 LinkedIn Import Başladı');
console.log('=========================');

// BrightData scraper obyekti
const scraper = new BrightDataLinkedInScraper(api_key, 'gd_l1viktl72bvl7bjuj0');

// Loading mesajı
console.log('⏳ Məlumatlar toplanır...');
console.log('LinkedIn profilindən məlumatlar gətirilir, xahiş edirik gözləyin...');

// Loading animation
const loadingInterval = setInterval(() => {
  process.stdout.write('.');
}, 2000);

scraper
  .scrapeProfile(params.linkId, { premium: params.premium })
  .then(function (response) {
    // Loading animation-u dayandır
    clearInterval(loadingInterval);
    console.log('\n');

    if (response) {
      console.log('✅ Məlumatlar uğurla toplandı!');
      console.log('CV səhifəsində bütün məlumatlar göstərilir...');
      console.log('');

      // CV bölümləri - CV səhifəsində göstəriləcək məlumatlar
      const data = response;

      console.log('📋 CV Səhifəsi - Hazır!');
      console.log('========================');

      // 1. Şəxsi Məlumatlar
      if (data.personal_info) {
        console.log('👤 1. Şəxsi Məlumatlar:');
        console.log(`   Ad: ${data.personal_info.name || 'N/A'}`);
        console.log(`   Başlıq: ${data.personal_info.headline || 'N/A'}`);
        console.log(`   Yer: ${data.personal_info.location || 'N/A'}`);
        if (data.personal_info.summary) {
          console.log(`   Haqqında: ${data.personal_info.summary.substring(0, 100)}...`);
        }
        console.log('');
      }

      // 2. İş Təcrübəsi
      if (data.experience && data.experience.length > 0) {
        console.log('💼 2. İş Təcrübəsi:');
        data.experience.forEach((exp, index) => {
          console.log(`   ${index + 1}. ${exp.title} - ${exp.company}`);
          if (exp.duration) console.log(`      Müddət: ${exp.duration}`);
          if (exp.description) console.log(`      Təsvir: ${exp.description.substring(0, 80)}...`);
        });
        console.log('');
      }

      // 3. Təhsil
      if (data.education && data.education.length > 0) {
        console.log('🎓 3. Təhsil:');
        data.education.forEach((edu, index) => {
          console.log(`   ${index + 1}. ${edu.degree || 'Dərəcə'} - ${edu.school}`);
          if (edu.field_of_study) console.log(`      Sahə: ${edu.field_of_study}`);
          if (edu.duration) console.log(`      Müddət: ${edu.duration}`);
        });
        console.log('');
      } else {
        console.log('🎓 3. Təhsil: Məlumat tapılmadı');
        console.log('');
      }

      // 4. Dillər
      if (data.languages && data.languages.length > 0) {
        console.log('🌐 4. Dillər:');
        data.languages.forEach((lang, index) => {
          console.log(`   ${index + 1}. ${lang.language} ${lang.proficiency ? '(' + lang.proficiency + ')' : ''}`);
        });
        console.log('');
      } else {
        console.log('🌐 4. Dillər: Məlumat tapılmadı');
        console.log('');
      }

      // 5. Layihələr
      if (data.projects && data.projects.length > 0) {
        console.log('🚀 5. Layihələr:');
        data.projects.forEach((proj, index) => {
          console.log(`   ${index + 1}. ${proj.title}`);
          if (proj.description) console.log(`      Təsvir: ${proj.description.substring(0, 80)}...`);
          if (proj.url) console.log(`      Link: ${proj.url}`);
        });
        console.log('');
      } else {
        console.log('🚀 5. Layihələr: Məlumat tapılmadı');
        console.log('');
      }

      // 6. Sertifikatlar (certifications + honors_and_awards)
      if (data.certifications && data.certifications.length > 0) {
        console.log('🏆 6. Sertifikatlar və Mükafatlar:');
        data.certifications.forEach((cert, index) => {
          console.log(`   ${index + 1}. ${cert.name} - ${cert.issuer || 'N/A'}`);
          if (cert.issue_date) console.log(`      Tarix: ${cert.issue_date}`);
        });
        console.log('');
      } else {
        console.log('🏆 6. Sertifikatlar və Mükafatlar: Məlumat tapılmadı');
        console.log('');
      }

      // 7. Könüllü Təcrübə
      if (data.volunteering && data.volunteering.length > 0) {
        console.log('🤝 7. Könüllü Təcrübə:');
        data.volunteering.forEach((vol, index) => {
          console.log(`   ${index + 1}. ${vol.role} - ${vol.organization}`);
          if (vol.cause) console.log(`      Məqsəd: ${vol.cause}`);
          if (vol.duration) console.log(`      Müddət: ${vol.duration}`);
        });
        console.log('');
      } else {
        console.log('🤝 7. Könüllü Təcrübə: Məlumat tapılmadı');
        console.log('');
      }

      console.log('✅ CV hazırdır! Bütün məlumatlar CV səhifəsində göstərilir.');

      // JSON formatında CV məlumatları
      console.log('📄 JSON formatında CV məlumatları:');
      console.log(JSON.stringify(data, null, 2));

    } else {
      clearInterval(loadingInterval);
      console.log('\n❌ Məlumatlar alınmadı');
    }
  })
  .catch(function (error) {
    clearInterval(loadingInterval);
    console.log('\n');
    console.error('❌ Import xətası: ' + error.message);

    if (error.message.includes('timeout')) {
      console.log('💡 LinkedIn import uzun çəkir, xahiş edirik bir qədər daha gözləyin');
    } else if (error.message.includes('authentication')) {
      console.log('💡 API açarı problemi, yenidən cəhd edin');
    }
  });
