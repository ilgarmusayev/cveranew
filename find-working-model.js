const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testWorkingModels() {
  try {
    console.log('🧪 Testing Google AI models with active API key...');
    
    const apiKey = 'AIzaSyC2ibKvEuDyilAwgMKUBIRiwkAdz1ROGdM';
    const geminiAI = new GoogleGenerativeAI(apiKey);
    
    // Test newer model names that are more likely to work
    const modelNames = [
      'gemini-1.5-flash-001',
      'gemini-1.5-pro-001', 
      'gemini-1.0-pro-001',
      'gemini-1.0-pro-latest',
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash-8b-001',
      'text-bison-001',
      'models/gemini-1.5-flash-001',
      'models/gemini-1.5-pro-001',
      'models/gemini-1.0-pro-001'
    ];
    
    let workingModel = null;
    
    for (const modelName of modelNames) {
      try {
        console.log(`🔍 Testing: ${modelName}`);
        const model = geminiAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent('Translate "hello" to Azerbaijani');
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ ${modelName} WORKS!`);
        console.log(`   Response: ${text.trim()}`);
        workingModel = modelName;
        break;
        
      } catch (error) {
        console.log(`❌ ${modelName}: ${error.message.includes('404') ? '404 Not Found' : error.message.substring(0, 60)}...`);
      }
    }
    
    if (workingModel) {
      console.log(`\n🎉 WORKING MODEL FOUND: ${workingModel}`);
      return workingModel;
    } else {
      console.log('\n💔 No working models found');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

testWorkingModels().then(workingModel => {
  if (workingModel) {
    console.log(`\n📝 Update your code to use: ${workingModel}`);
  }
});