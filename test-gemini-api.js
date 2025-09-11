const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGeminiAPI() {
  try {
    console.log('🔍 Gemini API Connection Test...');
    
    // Get Gemini API key from database
    const geminiKey = await prisma.apiKey.findFirst({
      where: {
        service: 'gemini',
        active: true
      }
    });
    
    if (!geminiKey) {
      console.error('❌ No Gemini API key found in database');
      return;
    }
    
    console.log(`✅ Gemini API Key found: ${geminiKey.apiKey.substring(0, 10)}...`);
    
    const geminiAI = new GoogleGenerativeAI(geminiKey.apiKey);
    const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const testPrompt = `
    Simple test: Generate 2 hard skills and 2 soft skills for a Java Developer.
    Return in JSON format:
    {
      "hardSkills": [
        {"name": "Java", "level": "Advanced"},
        {"name": "Spring Framework", "level": "Intermediate"}
      ],
      "softSkills": [
        {"name": "Problem Solving", "level": "Advanced"},
        {"name": "Communication", "level": "Intermediate"}
      ]
    }
    `;
    
    console.log('📡 Testing Gemini API...');
    
    const result = await model.generateContent(testPrompt);
    const response = result.response.text().trim();
    
    console.log('✅ Gemini API Response:');
    console.log(response);
    
    // Try to parse JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ JSON parse successful:');
      console.log('Hard Skills:', parsed.hardSkills);
      console.log('Soft Skills:', parsed.softSkills);
    } else {
      console.log('⚠️ No JSON found in response');
    }
    
  } catch (error) {
    console.error('❌ Gemini API Test Failed:', error.message);
    
    if (error.status) {
      console.error('   Status:', error.status);
    }
    if (error.statusText) {
      console.error('   Status Text:', error.statusText);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testGeminiAPI();
