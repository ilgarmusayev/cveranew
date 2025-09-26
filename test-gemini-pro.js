const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiPro() {
  try {
    console.log('🧪 Testing gemini-pro model...');
    
    const apiKey = 'AIzaSyC2ibKvEuDyilAwgMKUBIRiwkAdz1ROGdM';
    const geminiAI = new GoogleGenerativeAI(apiKey);
    const model = geminiAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = 'Translate "Hello world" to Azerbaijani. Return only the translation.';
    
    console.log('📤 Sending test request...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Test successful!');
    console.log('📥 Response:', text.trim());
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGeminiPro();