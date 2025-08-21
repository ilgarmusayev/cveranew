🔗 Yeni ScrapingDog API Key Almaq Üçün:

1. https://www.scrapingdog.com/ saytına daxil olun
2. Yeni hesab yaradın (fərqli email istifadə edin)
3. Free plan seçin (1000 free request)
4. API key alın

Hazırki key status:
❌ 6882894b855f5678d36484c8 - Limit tükənib (7050/7000)

Yeni key aldıqdan sonra admin paneldə əlavə edin:
📍 /sistem/api-keys
✅ Service: ScrapingDog
✅ Priority: 1 (ən yüksək)
✅ Daily Limit: 1000

Test üçün kod:
const newApiKey = 'YENİ_KEY_BURAYA';
const url = 'https://api.scrapingdog.com/linkedin';
const params = {
  api_key: newApiKey,
  type: 'profile', 
  linkId: 'musayevcreate',
  premium: 'false',
};
