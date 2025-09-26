const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testFinalTranslation() {
  try {
    console.log('🧪 Testing translation with gemini-pro-latest...');
    
    const apiKey = 'AIzaSyC2ibKvEuDyilAwgMKUBIRiwkAdz1ROGdM';
    const geminiAI = new GoogleGenerativeAI(apiKey);
    const model = geminiAI.getGenerativeModel({ model: 'gemini-pro-latest' });
    
    const testData = {
      personalInfo: {
        name: "Afet Khalilli",
        title: "Keyfiyyət Təminatı Mühəndisi",
        summary: "Agile mühitlərdə (Jira, Trello, TestRail) əl ilə testlərin dizaynı"
      }
    };
    
    const prompt = `
Siz peşəkar CV tərcümə mütəxəssisiniz. Aşağıdakı CV məzmununu Azərbaycan dilindən İngilis dilinə tam və dəqiq tərcümə edin.

🔥 MÜTLƏQ QAYDALAR:
1. 📧 Email, telefon nömrəsi, URL-lər olduğu kimi saxla
2. 📅 Tarixlər (dates) olduğu kimi saxla - dəyişmə! 
3. Yalnız tərcümə olunmuş JSON formatında cavab verin.

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
    
    try {
      const cleanResponse = text.replace(/```json\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      console.log('✅ JSON parsing successful!');
      console.log('📋 Parsed result:', JSON.stringify(parsed, null, 2));
    } catch (parseError) {
      console.log('⚠️ JSON parsing failed:', parseError.message);
    }
    
  } catch (error) {
    console.error('❌ Translation test failed:', error.message);
  }
}

testFinalTranslation();