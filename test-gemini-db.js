const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGeminiApiVersionsFromDB() {
  console.log('🔍 Gemini API Versiyalarını Database key ilə test edirik...\n');
  
  try {
    // Get API key from database
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        service: 'gemini',
        active: true
      },
      orderBy: {
        priority: 'asc'
      }
    });
    
    if (!apiKeyRecord) {
      console.log('❌ No active Gemini API key found in database');
      return;
    }
    
    console.log(`🔑 Using API Key ID: ${apiKeyRecord.id}`);
    console.log(`🔑 API Key (masked): ${apiKeyRecord.apiKey.substring(0, 10)}...${apiKeyRecord.apiKey.substring(apiKeyRecord.apiKey.length - 5)}`);
    console.log(`📊 Current usage: ${apiKeyRecord.dailyUsage}/${apiKeyRecord.dailyLimit}\n`);
    
    const geminiAI = new GoogleGenerativeAI(apiKeyRecord.apiKey);
    
    // Test different models
    const modelsToTest = [
      // Stable v1 versions (should have higher limits)
      'gemini-1.5-flash',
      'gemini-1.5-pro', 
      'gemini-pro',
      
      // Current beta versions
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-pro-latest',
      
      // Potential newer versions
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-8b'
    ];
    
    const workingModels = [];
    
    for (const modelName of modelsToTest) {
      try {
        console.log(`🤖 Testing: ${modelName}`);
        
        const model = geminiAI.getGenerativeModel({ model: modelName });
        
        const testPrompt = "Just respond with 'Test OK' to confirm this model works.";
        
        const startTime = Date.now();
        const result = await model.generateContent(testPrompt);
        const endTime = Date.now();
        
        const response = result.response.text();
        const responseTime = endTime - startTime;
        
        console.log(`✅ SUCCESS - Response: "${response.trim()}" (${responseTime}ms)`);
        workingModels.push({
          name: modelName,
          responseTime,
          response: response.trim()
        });
        
      } catch (error) {
        console.log(`❌ FAILED - ${error.message.substring(0, 100)}`);
        
        if (error.message.includes('429')) {
          console.log(`   🚨 Rate limit/Quota exceeded`);
        } else if (error.message.includes('404')) {
          console.log(`   📋 Model not found`);
        } else if (error.message.includes('400')) {
          console.log(`   ⚠️  Invalid request`);
        }
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎯 TEST NƏTİCƏLƏRİ:');
    console.log('='.repeat(50));
    
    if (workingModels.length > 0) {
      console.log(`✅ İşləyən modellər: ${workingModels.length}`);
      
      workingModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name} - ${model.responseTime}ms`);
      });
      
      // En sürətli model
      const fastest = workingModels.sort((a, b) => a.responseTime - b.responseTime)[0];
      console.log(`\n⚡ Ən sürətli: ${fastest.name} (${fastest.responseTime}ms)`);
      
      // Tövsiyə
      const recommended = workingModels.find(m => m.name === 'gemini-1.5-flash') || workingModels[0];
      console.log(`💡 Tövsiyə: ${recommended.name}`);
      
    } else {
      console.log(`❌ Heç bir model işləmir`);
      console.log(`🔍 Səbəblər:`);
      console.log(`   - API key quota bitmiş ola bilər`);
      console.log(`   - Rate limit aktiv ola bilər`);
      console.log(`   - API key yanlış ola bilər`);
    }
    
  } catch (error) {
    console.error('❌ Xəta:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testGeminiApiVersionsFromDB();