const axios = require('axios');

async function testScrapingDogAPI() {
  console.log('🔍 ScrapingDog API test ediliyor...');

  const api_key = '68a99929b4148b34852a88be';
  const url = 'https://api.scrapingdog.com/linkedin';
  
  const params = {
    api_key: api_key,
    type: 'profile',
    linkId: 'musayevcreate', // Test üçün sizin LinkedIn username-iniz
    premium: 'false',
  };
  
  try {
    console.log('📡 ScrapingDog API çağırışı...');
    console.log('🔗 URL:', url);
    console.log('📋 Params:', params);

    const response = await axios.get(url, { 
      params: params,
      timeout: 30000
    });
    
    if (response.status === 200) {
      const data = response.data;
      console.log('✅ ScrapingDog API uğurlu!');
      console.log('📊 Response Status:', response.status);
      console.log('🔍 Full response data:', JSON.stringify(data, null, 2));
      
      // Check if data is an array
      let profileData = data;
      if (Array.isArray(data) && data.length > 0) {
        profileData = data[0];
        console.log('📋 Using first element from array');
      }
      
      console.log('🔍 Profile data keys:', Object.keys(profileData));
      
      // Məlumatları analiz et
      console.log('\n📋 Profile məlumatları:');
      console.log('Ad:', profileData.firstName || profileData.name || profileData.full_name || 'N/A');
      console.log('Soyad:', profileData.lastName || profileData.last_name || 'N/A');
      console.log('Başlıq:', profileData.headline || profileData.title || profileData.job_title || 'N/A');
      console.log('Yer:', profileData.location || profileData.geo || 'N/A');
      console.log('Haqqında:', profileData.summary || profileData.about ? (profileData.summary || profileData.about).substring(0, 100) + '...' : 'N/A');
      
      if (profileData.experience && Array.isArray(profileData.experience)) {
        console.log('🏢 İş təcrübəsi:', profileData.experience.length, 'pozisiya');
      }
      
      if (profileData.education && Array.isArray(profileData.education)) {
        console.log('🎓 Təhsil:', profileData.education.length, 'məktəb');
      }
      
      if (profileData.skills && Array.isArray(profileData.skills)) {
        console.log('🎯 Skills:', profileData.skills.length, 'bacarıq');
        console.log('İlk 5 skill:', profileData.skills.slice(0, 5));
      }
      
      console.log('\n🎉 ScrapingDog API test uğurludur!');
      return profileData;
    } else {
      console.log('❌ Request failed with status code: ' + response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ ScrapingDog API xətası:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

testScrapingDogAPI();
