const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiModels() {
  console.log('🧪 Gemini Model Testləri...\n');
  
  // Test API key (ilk DB key istifadə edəcəyik)
  const testApiKey = 'AIzaSyC2ibVtmM8dNRG8pCK1JwHGy4nnVsROGdM'; // Production-da DB-dən alacaq
  
  const geminiAI = new GoogleGenerativeAI(testApiKey);
  
  const testPrompt = `Test prompt: Generate 3 professional skills for a software developer. Return as JSON format:
  {
    "skills": ["skill1", "skill2", "skill3"]
  }`;
  
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-exp-1206'
  ];
  
  console.log('📋 Test ediləcək modellər:');
  modelsToTest.forEach((model, index) => {
    console.log(`${index + 1}. ${model}`);
  });
  console.log('');
  
  for (const modelName of modelsToTest) {
    console.log(`🔍 Testing: ${modelName}`);
    console.log('-'.repeat(50));
    
    const startTime = Date.now();
    
    try {
      const model = geminiAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(testPrompt);
      const response = result.response.text();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Success! Response time: ${duration}ms`);
      console.log(`📄 Response length: ${response.length} characters`);
      console.log(`📝 Response preview: ${response.substring(0, 200)}...`);
      
      // JSON parse test
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log(`🎯 JSON parsing: Success`);
          console.log(`📊 Skills found: ${parsed.skills?.length || 0}`);
        } else {
          console.log(`⚠️  JSON parsing: No JSON found in response`);
        }
      } catch (parseError) {
        console.log(`❌ JSON parsing: Failed`);
      }
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`❌ Error after ${duration}ms:`);
      console.log(`   Message: ${error.message}`);
      console.log(`   Status: ${error.status || 'Unknown'}`);
      
      if (error.message.includes('quota')) {
        console.log(`   🚨 Quota issue detected!`);
      }
      if (error.message.includes('429')) {
        console.log(`   🚨 Rate limit exceeded!`);
      }
      if (error.message.includes('model')) {
        console.log(`   🚨 Model not found or not supported!`);
      }
    }
    
    console.log('');
    
    // 2 saniyə gözlə rate limit üçün
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('🎯 TEST NƏTİCƏLƏRİ ÖZƏT:');
  console.log('='.repeat(60));
  console.log('Tövsiyə:');
  console.log('1. Əgər gemini-2.0-flash-exp işləyirsə, ona keç');
  console.log('2. Əgər yox isə, gemini-1.5-flash-də qal');
  console.log('3. Rate limiting artıq aktivdir');
  console.log('4. API key rotation sistemi işləyir');
  
  console.log('\n🔧 Model dəyişikliyi üçün:');
  console.log('src/app/api/ai/suggest-skills/route.ts faylında');
  console.log('model: "gemini-1.5-flash" => model: "gemini-2.0-flash-exp"');
}

testGeminiModels().catch(console.error);