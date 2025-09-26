const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testEnvironmentKeys() {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2, 
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean);
  
  console.log(`🔍 Testing ${keys.length} API keys from environment...`);
  
  const modelNames = ['gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
  
  for (let i = 0; i < keys.length; i++) {
    console.log(`\n🔑 Testing API Key ${i + 1}: ${keys[i].substring(0, 10)}...`);
    
    for (const modelName of modelNames) {
      try {
        const geminiAI = new GoogleGenerativeAI(keys[i]);
        const model = geminiAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "Hello"');
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ KEY ${i + 1} + ${modelName} WORKS!`);
        console.log(`   Response: ${text.trim()}`);
        return { key: keys[i], model: modelName }; // Return first working combination
        
      } catch (error) {
        console.log(`❌ KEY ${i + 1} + ${modelName}: ${error.message.substring(0, 80)}...`);
      }
    }
  }
  
  console.log('\n💔 No working combinations found');
  return null;
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testEnvironmentKeys().then(result => {
  if (result) {
    console.log(`\n🎉 WORKING COMBINATION FOUND:`);
    console.log(`   API Key: ${result.key.substring(0, 15)}...`);
    console.log(`   Model: ${result.model}`);
  }
});