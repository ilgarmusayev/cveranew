const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiApiVersions() {
  console.log('🔍 Gemini API Versiyalarını Test Edirik...\n');
  
  // Test API key (environment variable)
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY environment variable not found');
    return;
  }
  
  console.log(`🔑 API Key (masked): ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
  
  const geminiAI = new GoogleGenerativeAI(apiKey);
  
  // Test different models and versions
  const modelsToTest = [
    // v1 stable versions
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    
    // v1beta versions (current)
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'gemini-pro-latest',
    
    // Possible new versions
    'gemini-2.0-flash',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash-001'
  ];
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`\n🤖 Testing model: ${modelName}`);
      
      const model = geminiAI.getGenerativeModel({ model: modelName });
      
      const testPrompt = "Test message: Just respond with 'OK' to confirm the model is working.";
      
      const startTime = Date.now();
      const result = await model.generateContent(testPrompt);
      const endTime = Date.now();
      
      const response = result.response.text();
      const responseTime = endTime - startTime;
      
      console.log(`✅ ${modelName}: SUCCESS`);
      console.log(`   Response: ${response.substring(0, 50)}${response.length > 50 ? '...' : ''}`);
      console.log(`   Response Time: ${responseTime}ms`);
      console.log(`   Status: Working properly`);
      
    } catch (error) {
      console.log(`❌ ${modelName}: FAILED`);
      console.log(`   Error: ${error.message}`);
      
      if (error.message.includes('429')) {
        console.log(`   Issue: Rate limit/Quota exceeded`);
      } else if (error.message.includes('404')) {
        console.log(`   Issue: Model not found/not available`);
      } else if (error.message.includes('400')) {
        console.log(`   Issue: Bad request/Invalid model name`);
      }
    }
    
    // Wait 1 second between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 TÖVSİYƏLƏR:');
  console.log('1. Əgər v1 versiyaları işləyirsə, onlara keçin');
  console.log('2. gemini-1.5-flash ən yaxşı seçimdir (sürətli və ucuz)');
  console.log('3. Rate limit problemləri üçün Flash modelini seçin');
  console.log('4. v1beta API-dən v1 API-ya keçməyi düşünün');
}

testGeminiApiVersions().catch(console.error);