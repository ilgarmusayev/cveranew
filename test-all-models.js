const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAllPossibleModels() {
  try {
    console.log('🔍 Testing ALL possible Gemini models...');
    
    const apiKey = 'AIzaSyC2ibKvEuDyilAwgMKUBIRiwkAdz1ROGdM';
    const geminiAI = new GoogleGenerativeAI(apiKey);
    
    // Extended list of model names
    const modelNames = [
      // Current generation models
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash-8b-001',
      'gemini-1.5-flash-8b-latest',
      'gemini-1.5-flash-001',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-001',
      'gemini-1.5-pro-latest',
      
      // Older generation models
      'gemini-1.0-pro-001',
      'gemini-1.0-pro-latest',
      'gemini-pro',
      'gemini-pro-latest',
      
      // Models with full path
      'models/gemini-1.5-flash-8b',
      'models/gemini-1.5-flash-8b-001',
      'models/gemini-1.5-flash-001',
      'models/gemini-1.5-pro-001',
      'models/gemini-1.0-pro-001',
      'models/gemini-pro',
      
      // Alternative names
      'text-bison-001',
      'chat-bison-001',
      'codechat-bison-001'
    ];
    
    const workingModels = [];
    
    for (const modelName of modelNames) {
      try {
        console.log(`🧪 Testing: ${modelName}`);
        const model = geminiAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent('Say "test"');
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ ${modelName} WORKS! Response: ${text.trim()}`);
        workingModels.push(modelName);
        
      } catch (error) {
        const errorMsg = error.message.includes('404') ? '404 Not Found' : 
                        error.message.includes('403') ? '403 Forbidden' :
                        error.message.substring(0, 60) + '...';
        console.log(`❌ ${modelName}: ${errorMsg}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎉 WORKING MODELS FOUND: ${workingModels.length}`);
    workingModels.forEach((model, index) => {
      console.log(`   ${index + 1}. ${model}`);
    });
    
    if (workingModels.length > 0) {
      console.log(`\n🔧 Recommended model: ${workingModels[0]}`);
      return workingModels[0];
    } else {
      console.log('\n💔 No working models found');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

testAllPossibleModels();