const axios = require('axios');

// Test ediləcək LinkedIn profili
const linkedinUsername = 'musayevcreate';

// Sizin təlimatınızdakı eyni konfiqurasiya
const api_key = '6882894b855f5678d36484c8';
const url = 'https://api.scrapingdog.com/linkedin';

const params = {
  api_key: api_key,
  type: 'profile',
  linkId: linkedinUsername,
  premium: 'false',
};

console.log('🔍 Test edilir: LinkedIn profil import');
console.log('📋 Parametrlər:', params);

axios
  .get(url, { params: params })
  .then(function (response) {
    console.log('\n✅ Uğurlu cavab alındı!');
    console.log('📊 Status:', response.status);
    console.log('📦 Data tipi:', typeof response.data);
    console.log('📝 Array-dirmi:', Array.isArray(response.data));

    if (response.status === 200) {
      const data = response.data;

      // Array formatını yoxla
      let profileData = data;
      if (Array.isArray(data) && data.length > 0) {
        profileData = data[0];
        console.log('🔄 Array formatından çıxarıldı');
      } else if (data['0']) {
        profileData = data['0'];
        console.log('🔄 "0" key formatından çıxarıldı');
      }

      console.log('\n📋 Mövcud data sahələri:');
      console.log(Object.keys(profileData));

      console.log('\n👤 Şəxsi məlumatlar:');
      console.log('  Ad:', profileData.full_name || profileData.name || profileData.fullName);
      console.log('  Başlıq:', profileData.headline);
      console.log('  Haqqında:', profileData.about);
      console.log('  Yer:', profileData.location);

      console.log('\n💼 İş təcrübəsi:');
      if (Array.isArray(profileData.experience)) {
        profileData.experience.forEach((exp, index) => {
          console.log(`  ${index + 1}. ${exp.position || exp.title} - ${exp.company_name || exp.company}`);
        });
      } else {
        console.log('  İş təcrübəsi tapılmadı');
      }

      console.log('\n🎓 Təhsil:');
      if (Array.isArray(profileData.education)) {
        profileData.education.forEach((edu, index) => {
          console.log(`  ${index + 1}. ${edu.college_name || edu.school} - ${edu.college_degree || edu.degree}`);
        });
      } else {
        console.log('  Təhsil məlumatı tapılmadı');
      }

      console.log('\n🛠️ Bacarıqlar:');
      if (Array.isArray(profileData.skills)) {
        console.log('  Bacarıqlar:', profileData.skills.slice(0, 10).join(', '));
      } else {
        console.log('  Bacarıqlar tapılmadı');
      }

      console.log('\n🔗 Faydalı linklər:');
      console.log('  Profil URL:', profileData.public_profile_url);

      console.log('\n📄 Raw data (debug üçün):');
      console.log(JSON.stringify(profileData, null, 2));

    } else {
      console.log('❌ Sorğu uğursuz: ' + response.status);
    }
  })
  .catch(function (error) {
    console.error('❌ Xəta baş verdi:');
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    } else {
      console.error('  Mesaj:', error.message);
    }
  });
