const axios = require('axios');

// 🔑 YENİ API KEY BURAYA DAXİL EDİN - hazırda limit tükənmiş key var
const api_key = '6882894b855f5678d36484c8'; // Bu key-in limiti tükənib
const url = 'https://api.scrapingdog.com/linkedin';

const params = {
  api_key: api_key,
  type: 'profile',
  linkId: 'musayevcreate',
  premium: 'false',
};

console.log('🔍 ScrapingDog API Test - Current Key Status');
console.log('============================================');

// Əvvəlcə account status yoxlayaq
axios.get('https://api.scrapingdog.com/account', {
  params: { api_key: api_key }
})
.then(function(accountResponse) {
  console.log('📊 Account Status:');
  console.log(`- Request Limit: ${accountResponse.data.requestLimit}`);
  console.log(`- Request Used: ${accountResponse.data.requestUsed}`);
  console.log(`- Remaining: ${accountResponse.data.requestLimit - accountResponse.data.requestUsed}`);
  console.log(`- LinkedIn Calls: ${accountResponse.data.linkedin_thread_count || 'N/A'}`);
  console.log(`- Pack Type: ${accountResponse.data.pack}`);
  console.log('');

  if (accountResponse.data.requestUsed >= accountResponse.data.requestLimit) {
    console.log('❌ API limit tükəndi! Yeni API key lazımdır.');
    console.log('🔗 Yeni key almaq üçün: https://www.scrapingdog.com/');
    console.log('');
    console.log('🛠️ Yeni key aldıqdan sonra bu faylda dəyişdirin:');
    console.log('📁 /home/musayev/Documents/lastcvera/.env.local');
    console.log('📝 SCRAPINGDOG_API_KEY=YENİ_KEY_BURAYA');
    return;
  }

  // Əgər limit qalıbsa, LinkedIn API test et
  console.log('✅ Limit qalıb, LinkedIn API test edilir...');
  return testLinkedInAPI();
})
.catch(function(error) {
  console.error('❌ Account status error: ' + error.message);
});

function testLinkedInAPI() {
  return axios
    .get(url, { params: params })
    .then(function (response) {
      if (response.status === 200) {
        const data = response.data;
        console.log('✅ LinkedIn API işləyir!');
        console.log('📋 Gələn data fields:', Object.keys(data));
        return data;
      } else {
        console.log('❌ Request failed with status code: ' + response.status);
      }
    })
    .catch(function (error) {
      console.error('❌ Error making the request: ' + error.message);

      // JSON parse xətası üçün əlavə məlumat
      if (error.message.includes('Unexpected token')) {
        console.log('');
        console.log('🚨 JSON Parse Xətası - Bu adətən o deməkdir ki:');
        console.log('1. API HTML səhifə qaytarır JSON əvəzinə');
        console.log('2. API key səhvdir və ya limit tükənib');
        console.log('3. ScrapingDog serveri problem yaşayır');
      }
    });
}

// ENV faylında API key dəyişdirmək üçün köməkçi
console.log('');
console.log('📝 Yeni API key əlavə etmək üçün:');
console.log('1. https://www.scrapingdog.com/ saytından yeni key alın');
console.log('2. .env.local faylına əlavə edin: SCRAPINGDOG_API_KEY=yeni_key');
console.log('3. Aplikasiyanı restart edin');
console.log('');
