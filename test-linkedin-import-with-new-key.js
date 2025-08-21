const axios = require('axios');

console.log('🔍 LinkedIn Import Test - Yeni API Key ilə');
console.log('==========================================');

// Test yeni API key-in işləyib-işləmədiyini
async function testNewApiKey() {
  try {
    // Admin paneldən API key-ləri əldə et
    console.log('📊 Admin paneldən aktiv API key-lər yoxlanılır...');

    // Simulasiya: Yeni əlavə etdiyiniz key-i test edək
    // Bu sizin kod style-ınızla eynidir
    const api_key = 'YENİ_API_KEY_BURAYA'; // Admin paneldən əlavə etdiyiniz key
    const url = 'https://api.scrapingdog.com/linkedin';

    const params = {
      api_key: api_key,
      type: 'profile',
      linkId: 'musayevcreate',
      premium: 'false',
    };

    // Əvvəl account status yoxlayaq
    console.log('🔄 Yeni API key account status...');

    const accountResponse = await axios.get('https://api.scrapingdog.com/account', {
      params: { api_key: api_key }
    });

    const accountData = accountResponse.data;
    const remaining = accountData.requestLimit - accountData.requestUsed;

    console.log('📈 Yeni Key Status:');
    console.log('- Request Limit:', accountData.requestLimit);
    console.log('- Request Used:', accountData.requestUsed);
    console.log('- Remaining:', remaining);
    console.log('- Pack Type:', accountData.pack);
    console.log('');

    if (remaining <= 0) {
      console.log('❌ Yeni key də limit tükənib!');
      return false;
    }

    console.log('✅ Yeni key-də limit var, LinkedIn import test edilir...');

    // LinkedIn profil test - sizin kod style ilə
    const response = await axios
      .get(url, { params: params })
      .then(function (response) {
        if (response.status === 200) {
          const data = response.data;
          console.log('✅ LinkedIn Import UĞURLU!');
          console.log('📋 Profil məlumatları alındı:');
          console.log('- Name:', data.name || 'N/A');
          console.log('- Headline:', data.headline || 'N/A');
          console.log('- Location:', data.location || 'N/A');
          console.log('- Available fields:', Object.keys(data).slice(0, 10));
          return true;
        } else {
          console.log('❌ Request failed with status code: ' + response.status);
          return false;
        }
      })
      .catch(function (error) {
        console.error('❌ Error making the request: ' + error.message);

        if (error.message.includes('Unexpected token')) {
          console.log('🚨 Hələ də JSON parse xətası var!');
          console.log('Bu o deməkdir ki yeni key istifadə olunmur');
          return false;
        }

        return false;
      });

    return response;

  } catch (error) {
    console.error('❌ Test xətası:', error.message);
    return false;
  }
}

// LinkedIn import səhifəsində istifadə olunan API key source-nu yoxlayaq
console.log('');
console.log('💡 LinkedIn Import Səhifəsi Yoxlanması:');
console.log('1. /dashboard səhifəsində LinkedIn import düyməsini basın');
console.log('2. Console-da xəta var mı yoxlayın');
console.log('3. Network tab-da API request-lərə baxın');
console.log('');

console.log('🔧 Əgər hələ də "Failed to fetch" xətası varsa:');
console.log('1. Browser cache-ni təmizləyin');
console.log('2. Səhifəni hard refresh edin (Ctrl+F5)');
console.log('3. Application restart edin');
console.log('4. Admin paneldə köhnə key-i deaktiv edin');
console.log('');

// Fərqli test ssenariləri
async function testDifferentScenarios() {
  console.log('🧪 Müxtəlif Test Ssenariləri:');
  console.log('============================');

  // Test 1: Priority sistemi
  console.log('Test 1: Priority 1 olan key istifadə olunur mu?');
  console.log('Test 2: Köhnə key deaktiv olub mu?');
  console.log('Test 3: Yeni key aktiv status-da olub mu?');
  console.log('');

  console.log('📱 Test etmək üçün addımlar:');
  console.log('1. /sistem/api-keys səhifəsinə gedin');
  console.log('2. ScrapingDog key-lərinin statusunu yoxlayın');
  console.log('3. Priority 1 olan key-in aktiv olduğunu təsdiq edin');
  console.log('4. "Test et" düyməsi ilə key-i yoxlayın');
}

console.log('⚡ İndi LinkedIn import test edin:');
console.log('1. Dashboard-a gedin');
console.log('2. LinkedIn profil import edin');
console.log('3. "musayevcreate" profili test edin');
console.log('');

testDifferentScenarios();
