const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listAvailableModels() {
  try {
    console.log('🔍 Listing available Gemini models...');
    
    const apiKey = 'AIzaSyC2ibKvEuDyilAwgMKUBIRiwkAdz1ROGdM';
    const geminiAI = new GoogleGenerativeAI(apiKey);
    
    // Try to list models (this might not work with all API keys)
    try {
      const models = await geminiAI.listModels();
      console.log('📋 Available models:');
      models.forEach(model => {
        console.log(`  - ${model.name} (${model.displayName})`);
      });
    } catch (listError) {
      console.log('⚠️ Cannot list models, trying common model names...');
    }
    
    // Test common model names
    const modelNames = [
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest', 
      'gemini-1.5-pro-001',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-pro-latest',
      'models/gemini-pro',
      'models/gemini-1.5-flash',
      'gemini-1.0-pro'
    ];
    
    for (const modelName of modelNames) {
      try {
        console.log(`🧪 Testing model: ${modelName}`);
        const model = geminiAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Test');
        const response = await result.response;
        const text = response.text();
        console.log(`✅ ${modelName} WORKS! Response: ${text.substring(0, 50)}...`);
        break; // Stop at first working model
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message.substring(0, 100)}...`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing models:', error.message);
  }
}

listAvailableModels();