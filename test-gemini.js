const { GoogleGenerativeAI } = require('@google/generative-ai');

// Test Gemini API
async function testGeminiAPI() {
  try {
    const apiKey = 'AIzaSyCPw5lA9c4huYqnZ_8gCYMAqUexGVTJGJ4';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('🚀 Testing Gemini API...');
    
    const prompt = "Say hello in Azerbaijani language (just one sentence)";
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    console.log('✅ Gemini API works!');
    console.log('Response:', text);
    
    return true;
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    return false;
  }
}

testGeminiAPI();
