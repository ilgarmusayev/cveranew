const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findWorkingModels() {
  console.log('🔍 İşləyən Model Axtarışı...\n');
  
  try {
    // Database-dən API key götür
    const activeKey = await prisma.apiKey.findFirst({
      where: {
        service: 'gemini',
        active: true
      },
      orderBy: { priority: 'asc' }
    });
    
    if (!activeKey) {
      console.log('❌ API key tapılmadı');
      return;
    }
    
    const apiKey = activeKey.apiKey;
    console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
    
    // Test v1 API-də mövcud modelləri
    console.log('\n📋 v1 API-də mövcud modellər:');
    try {
      const modelsUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
      const response = await fetch(modelsUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ v1 models found:');
        
        if (data.models) {
          data.models.forEach((model, index) => {
            console.log(`   ${index + 1}. ${model.name}`);
            
            // Check if it supports generateContent
            if (model.supportedGenerationMethods?.includes('generateContent')) {
              console.log(`      ✅ Supports generateContent`);
            }
          });
          
          // Test first available model
          const firstModel = data.models.find(m => 
            m.supportedGenerationMethods?.includes('generateContent')
          );
          
          if (firstModel) {
            console.log(`\n🧪 Testing first available model: ${firstModel.name}`);
            
            // Extract model name (remove models/ prefix if exists)
            const modelName = firstModel.name.replace('models/', '');
            
            const testUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;
            
            const testResponse = await fetch(testUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: "Say OK" }] }]
              })
            });
            
            if (testResponse.ok) {
              const testData = await testResponse.json();
              const text = testData.candidates?.[0]?.content?.parts?.[0]?.text || 'Response received';
              console.log(`✅ ${modelName} işləyir:`, text.trim());
              
              console.log(`\n🎯 TÖVSİYƏ: Bu modeli istifadə edin: ${modelName}`);
            } else {
              const errorText = await testResponse.text();
              console.log(`❌ ${modelName} test failed:`, testResponse.status);
              console.log('   Error:', errorText.substring(0, 100) + '...');
            }
          }
        }
      } else {
        console.log('❌ v1 models list failed:', response.status);
      }
    } catch (error) {
      console.log('❌ v1 models error:', error.message);
    }
    
    // Test v1beta-da quota problemi həlli
    console.log('\n📋 v1beta quota problemi həlli:');
    console.log('1. Rate limiting daha sərt edin');
    console.log('2. Başqa API key istifadə edin');
    console.log('3. Daily usage reset edin');
    console.log('4. Daha az təkrarlı sorğular göndərin');
    
    // API key rotation test
    console.log('\n📋 API Key Rotation Test:');
    const allGeminiKeys = await prisma.apiKey.findMany({
      where: {
        service: 'gemini',
        active: true
      },
      orderBy: { dailyUsage: 'asc' }
    });
    
    console.log(`Mövcud ${allGeminiKeys.length} Gemini API key:`);
    allGeminiKeys.forEach((key, index) => {
      console.log(`   ${index + 1}. ID: ${key.id.substring(0, 8)}... Usage: ${key.dailyUsage}/${key.dailyLimit}`);
    });
    
    // Test least used key
    const leastUsedKey = allGeminiKeys[0];
    if (leastUsedKey && leastUsedKey.dailyUsage < leastUsedKey.dailyLimit) {
      console.log(`\n🔄 Testing least used key: ${leastUsedKey.id.substring(0, 8)}...`);
      
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const geminiAI = new GoogleGenerativeAI(leastUsedKey.apiKey);
        const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const result = await model.generateContent("Test - say OK");
        console.log('✅ Least used key işləyir:', result.response.text().trim());
        
        console.log(`🎯 TÖVSİYƏ: Bu API key istifadə edin: ${leastUsedKey.id}`);
      } catch (error) {
        console.log('❌ Least used key failed:', error.message.substring(0, 100) + '...');
        
        if (error.message.includes('quota') || error.message.includes('429')) {
          console.log('   🚨 Bu key-də də quota problemi var!');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findWorkingModels();