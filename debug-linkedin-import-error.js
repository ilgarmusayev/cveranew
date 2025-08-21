// LinkedIn Import Xətası Həll Edici Test
const axios = require('axios');

// Sizin hazırki API key (limit tükənib)
const api_key = '6882894b855f5678d36484c8';
const url = 'https://api.scrapingdog.com/linkedin';

const params = {
  api_key: api_key,
  type: 'profile',
  linkId: 'musayevcreate',
  premium: 'false',
};

console.log('🔍 LinkedIn Import Xətası Debug');
console.log('===============================');
console.log('Test edilən profil: musayevcreate');
console.log('İstifadə olunan API key:', api_key.substring(0, 8) + '***');
console.log('');

// Əvvəlcə account status yoxlayaq
axios.get('https://api.scrapingdog.com/account', {
  params: { api_key: api_key }
})
.then(function(accountResponse) {
  console.log('📊 API Key Status:');
  console.log('- Request Limit:', accountResponse.data.requestLimit);
  console.log('- Request Used:', accountResponse.data.requestUsed);
  console.log('- Remaining:', accountResponse.data.requestLimit - accountResponse.data.requestUsed);
  console.log('- Pack Type:', accountResponse.data.pack);
  console.log('');

  const remaining = accountResponse.data.requestLimit - accountResponse.data.requestUsed;

  if (remaining <= 0) {
    console.log('❌ PROBLEMİN SƏBƏBİ TAPILDI!');
    console.log('API limit tamamilə tükənib:', accountResponse.data.requestUsed + '/' + accountResponse.data.requestLimit);
    console.log('');
    console.log('🔧 HƏLL YOLU:');
    console.log('1. https://www.scrapingdog.com/ saytından yeni API key alın');
    console.log('2. /sistem/api-keys admin panelində əlavə edin');
    console.log('3. Köhnə key-i deaktiv edin');
    console.log('');
    console.log('💡 YENİ KEY ALDIQDAN SONRA:');
    console.log('- LinkedIn import işləyəcək');
    console.log('- JSON parse xətası aradan qalxacaq');
    console.log('- "Failed to fetch LinkedIn profile" xətası həll olacaq');
    return;
  }

  console.log('✅ API limit qalıb, LinkedIn API test edilir...');
  return testLinkedInImport();
})
.catch(function(error) {
  console.error('❌ Account status xətası:', error.message);
});

function testLinkedInImport() {
  console.log('🔄 LinkedIn profil import test edilir...');

  axios
    .get(url, { params: params })
    .then(function (response) {
      if (response.status === 200) {
        const data = response.data;
        console.log('✅ LinkedIn import uğurlu!');
        console.log('📋 Alınan profil məlumatları:');
        console.log('- Name:', data.name || 'N/A');
        console.log('- Headline:', data.headline || 'N/A');
        console.log('- Location:', data.location || 'N/A');
        console.log('- Data keys:', Object.keys(data));
      } else {
        console.log('❌ Request failed with status code: ' + response.status);
      }
    })
    .catch(function (error) {
      console.error('❌ Error making the request: ' + error.message);

      if (error.message.includes('Unexpected token')) {
        console.log('');
        console.log('🚨 LINKEDIN IMPORT XƏTASININ SƏBƏBİ:');
        console.log('- API HTML səhifə qaytarır JSON əvəzinə');
        console.log('- Bu o deməkdir ki API key limiti tükənib');
        console.log('- LinkedIn import "Failed to fetch" deyir');
        console.log('');
        console.log('✅ HƏLL: Yeni API key alın və admin paneldə əlavə edin');
      }
    });
}

console.log('');
console.log('📝 Admin Panel API Key Əlavə Etmə:');
console.log('1. /sistem/login - admin giriş');
console.log('2. /sistem/api-keys - API key idarəetmə');
console.log('3. "Yeni API Key Əlavə Et" düyməsi');
console.log('4. Service: scrapingdog, Priority: 1');
console.log('');
