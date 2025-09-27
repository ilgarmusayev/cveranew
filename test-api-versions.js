const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testApiVersions() {
  console.log('🔍 API Versiya Testləri...\n');
  
  // Database-dən götürülən API key
  const apiKey = 'AIzaSyC2ibA_v5pPfXqyiKi_PTK6pCzpn5ROGdM';
  
  // Test 1: Default SDK (v1beta)
  console.log('📋 Test 1: Default SDK (v1beta) versiyası');
  try {
    const geminiAI = new GoogleGenerativeAI(apiKey);
    const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent("Say OK");
    console.log('✅ v1beta işləyir:', result.response.text().trim());
  } catch (error) {
    console.log('❌ v1beta xətası:', error.message.substring(0, 150) + '...');
    
    if (error.message.includes('v1beta')) {
      console.log('   🎯 URL-də v1beta istifadə olunur');
    }
  }
  
  // Test 2: Manual fetch ilə v1 API
  console.log('\n📋 Test 2: Manual fetch ilə v1 API');
  try {
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    
    const response = await fetch(url + `?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Say OK" }]
        }]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ v1 API işləyir:', data.candidates?.[0]?.content?.parts?.[0]?.text || 'Response received');
    } else {
      const errorText = await response.text();
      console.log('❌ v1 API xətası:', response.status, errorText.substring(0, 150) + '...');
    }
  } catch (error) {
    console.log('❌ v1 fetch xətası:', error.message);
  }
  
  // Test 3: Check available models via v1
  console.log('\n📋 Test 3: v1 API ilə mövcud modellər');
  try {
    const modelsUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    
    const response = await fetch(modelsUrl);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Mövcud modellər (v1):');
      
      if (data.models && data.models.length > 0) {
        data.models.slice(0, 5).forEach(model => {
          console.log(`   - ${model.name}`);
        });
        
        // Check for specific models
        const flashModel = data.models.find(m => m.name.includes('flash'));
        const proModel = data.models.find(m => m.name.includes('pro'));
        
        if (flashModel) console.log(`   🚀 Flash model mövcud: ${flashModel.name}`);
        if (proModel) console.log(`   🧠 Pro model mövcud: ${proModel.name}`);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Models list xətası:', response.status, errorText.substring(0, 150) + '...');
    }
  } catch (error) {
    console.log('❌ Models fetch xətası:', error.message);
  }
  
  console.log('\n🎯 NƏTİCƏ:');
  console.log('1. SDK default olaraq v1beta istifadə edir');  
  console.log('2. v1 API-ni manual fetch ilə test etdik');
  console.log('3. Əgər v1 işləyirsə, custom API client yarada bilərik');
}

testApiVersions().catch(console.error);