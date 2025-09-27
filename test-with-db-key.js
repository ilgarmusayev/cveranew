const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWithDatabaseApiKey() {
  console.log('🔍 Database API Key ilə Test...\n');
  
  try {
    // Database-dən canlı API key götür
    const activeKey = await prisma.apiKey.findFirst({
      where: {
        service: 'gemini',
        active: true,
        dailyUsage: {
          lt: prisma.apiKey.fields.dailyLimit
        }
      },
      orderBy: [
        { priority: 'asc' },
        { usageCount: 'asc' }
      ]
    });
    
    if (!activeKey) {
      console.log('❌ Aktiv API key tapılmadı');
      return;
    }
    
    console.log(`✅ API Key tapıldı: ${activeKey.id}`);
    console.log(`   Usage: ${activeKey.dailyUsage}/${activeKey.dailyLimit}`);
    console.log(`   Key: ${activeKey.apiKey.substring(0, 10)}...${activeKey.apiKey.substring(activeKey.apiKey.length - 5)}`);
    
    const apiKey = activeKey.apiKey;
    
    // Test 1: v1beta (SDK default)
    console.log('\n📋 Test 1: v1beta (SDK) versiyası');
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const geminiAI = new GoogleGenerativeAI(apiKey);
      const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent("Test connection - respond with OK");
      console.log('✅ v1beta (SDK) işləyir:', result.response.text().trim());
    } catch (error) {
      console.log('❌ v1beta (SDK) xətası:', error.message.substring(0, 100) + '...');
      
      if (error.message.includes('quota') || error.message.includes('429')) {
        console.log('   🚨 QUOTA EXCEEDEd - Bu problem!');
      }
    }
    
    // Test 2: v1 manual
    console.log('\n📋 Test 2: v1 manual API');
    try {
      const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
      
      const response = await fetch(url + `?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Test connection - respond with OK" }]
          }]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Response received';
        console.log('✅ v1 manual API işləyir:', text.trim());
      } else {
        const errorText = await response.text();
        console.log('❌ v1 manual API xətası:', response.status);
        
        if (response.status === 429) {
          console.log('   🚨 QUOTA EXCEEDED - v1-də də quota problem!');
        }
        
        console.log('   Error:', errorText.substring(0, 150) + '...');
      }
    } catch (error) {
      console.log('❌ v1 fetch xətası:', error.message);
    }
    
    // Test 3: Alternative models v1beta-da
    console.log('\n📋 Test 3: Alternative models v1beta-da');
    const alternativeModels = ['gemini-pro', 'gemini-1.0-pro'];
    
    for (const modelName of alternativeModels) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const geminiAI = new GoogleGenerativeAI(apiKey);
        const model = geminiAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent("OK");
        console.log(`✅ ${modelName} işləyir:`, result.response.text().trim());
        break; // İşləyən model tapıldı
      } catch (error) {
        console.log(`❌ ${modelName} xətası:`, error.message.substring(0, 80) + '...');
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('❌ Database xətası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWithDatabaseApiKey();