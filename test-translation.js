const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testTranslation() {
  try {
    console.log('🧪 Testing translation with gemini-1.5-flash-8b...');
    
    const apiKey = 'AIzaSyC2ibKvEuDyilAwgMKUBIRiwkAdz1ROGdM';
    const geminiAI = new GoogleGenerativeAI(apiKey);
    const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });
    
    const testData = {
      personalInfo: {
        name: "John Doe",
        email: "john@example.com"
      },
      summary: "I am a software developer with 5 years of experience."
    };
    
    const prompt = `
Siz peşəkar CV tərcümə mütəxəssisiniz. Aşağıdakı CV məzmununu İngilis dilindən Azərbaycan dilinə tam və dəqiq tərcümə edin.

INPUT JSON:
${JSON.stringify(testData, null, 2)}

Yalnız tərcümə olunmuş JSON formatında cavab verin, başqa heç nə əlavə etməyin.
`;
    
    console.log('📤 Sending translation request...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log('✅ Translation test successful!');
    console.log('📥 Response:');
    console.log(text);
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(text.replace(/```json\s*|\s*```/g, ''));
      console.log('✅ JSON parsing successful!');
      console.log('📋 Parsed result:', JSON.stringify(parsed, null, 2));
    } catch (parseError) {
      console.log('⚠️ JSON parsing failed, but translation worked');
    }
    
  } catch (error) {
    console.error('❌ Translation test failed:', error.message);
  }
}

testTranslation();