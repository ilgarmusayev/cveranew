const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModelNames() {
  console.log('🧪 Gemini Model Adlarını Test Edirik...\n');
  
  const testApiKey = 'AIzaSyBw5R_tGGODLAKmWbdrFbEGZ_8SkKK2Rkhg'; // DB-dən alınmış
  const geminiAI = new GoogleGenerativeAI(testApiKey);
  
  const testPrompt = 'Test: Return "success"';
  
  const modelsToTest = [
    // Flash models
    'gemini-1.5-flash',
    'gemini-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-001',
    'gemini-flash-1.5',
    
    // Pro models  
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.5-pro-latest',
    'gemini-1.5-pro-001',
    'gemini-pro-latest',
    
    // Experimental models
    'gemini-2.0-flash-exp',
    'gemini-exp-1206',
    'gemini-exp-1121',
    'gemini-2.0-flash-thinking-exp-1219',
    
    // Other possible names
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro',
    'models/gemini-pro',
  ];
  
  console.log(`📋 ${modelsToTest.length} model adı test ediləcək:\n`);
  
  const workingModels = [];
  const failedModels = [];
  
  for (const modelName of modelsToTest) {
    console.log(`🔍 Testing: ${modelName}`);
    
    try {
      const model = geminiAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(testPrompt);
      const response = result.response.text();
      
      console.log(`✅ SUCCESS: ${modelName}`);
      console.log(`   Response: ${response.substring(0, 50)}...`);
      workingModels.push(modelName);
      
    } catch (error) {
      console.log(`❌ FAILED: ${modelName}`);
      console.log(`   Error: ${error.message.substring(0, 100)}...`);
      failedModels.push({ name: modelName, error: error.message });
      
      if (error.status === 429) {
        console.log(`   🚨 Quota exceeded, waiting 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    // Rate limit protection
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('');
  }
  
  console.log('\n🎯 TEST NƏTİCƏLƏRİ:');
  console.log('='.repeat(50));
  
  console.log(`\n✅ İŞLƏYƏN MODELLƏR (${workingModels.length}):`);
  workingModels.forEach((model, index) => {
    console.log(`   ${index + 1}. ${model}`);
  });
  
  console.log(`\n❌ İŞLƏMƏYƏN MODELLƏR (${failedModels.length}):`);
  failedModels.slice(0, 5).forEach(item => {
    console.log(`   - ${item.name}: ${item.error.substring(0, 80)}...`);
  });
  
  if (workingModels.length > 0) {
    console.log(`\n🌟 TÖVSİYƏ: Bu modellərdən birini istifadə edin:`);
    console.log(`   1. ${workingModels[0]} (ən yaxşı seçim)`);
    if (workingModels[1]) console.log(`   2. ${workingModels[1]} (alternativ)`);
  } else {
    console.log(`\n🚨 Heç bir model işləmir! API key və ya quota problemini yoxlayın.`);
  }
}

testModelNames();